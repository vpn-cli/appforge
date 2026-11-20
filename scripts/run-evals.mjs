/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { validateComponentNode } from "../lib/validation.ts";
import { PROMPT_VERSION, COPILOT_SYSTEM_PROMPT as SYSTEM_PROMPT } from "../lib/copilot-prompt.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const EVAL_TEMPERATURE = 0.1;

let currentCommitHash = "unknown";
try {
  currentCommitHash = execSync("git rev-parse HEAD", { cwd: rootDir, encoding: "utf-8" }).trim();
} catch {
  currentCommitHash = "unknown";
}

// Load env vars from .env.local without altering production config
const envFile = path.join(rootDir, ".env.local");
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

// Providers setup
const groqKey = (process.env.GROQ_API_KEY || "").trim().replace(/^["']|["']$/g, "");
const geminiKey = (process.env.GEMINI_API_KEY || "").trim().replace(/^["']|["']$/g, "");

if (!groqKey || !geminiKey) {
  console.error("Missing GROQ_API_KEY or GEMINI_API_KEY in .env.local");
  process.exit(1);
}

const groq = createGroq({ apiKey: groqKey });
const google = createGoogleGenerativeAI({ apiKey: geminiKey });

const evalsDir = path.join(rootDir, "evals");
if (!fs.existsSync(evalsDir)) fs.mkdirSync(evalsDir, { recursive: true });

const promptsPath = path.join(evalsDir, "benchmark-prompts.json");
const prompts = JSON.parse(fs.readFileSync(promptsPath, "utf-8"));

console.log(`Loaded ${prompts.length} benchmark prompts from ${promptsPath}`);

function extractJsonArray(rawText) {
  let cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  }
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") {
      if (Array.isArray(parsed.components)) return parsed.components;
      if (Array.isArray(parsed.pages?.[0]?.components)) return parsed.pages[0].components;
      return [parsed];
    }
    return null;
  } catch {
    return null;
  }
}

function extractRetryAfterMs(err) {
  if (!err) return 8000;
  const headers = err.responseHeaders || err.cause?.responseHeaders;
  if (headers) {
    const retrySec = headers["retry-after"] || headers.get?.("retry-after");
    if (retrySec && !isNaN(Number(retrySec))) {
      return (Number(retrySec) + 2) * 1000;
    }
  }
  const msg = `${err.message || ""} ${err.responseBody || ""} ${err.data?.error?.message || ""}`;
  const mMatch = msg.match(/try again in (?:(\d+)m)?(\d+(?:\.\d+)?)s/i);
  if (mMatch) {
    const minutes = mMatch[1] ? parseFloat(mMatch[1]) : 0;
    const seconds = mMatch[2] ? parseFloat(mMatch[2]) : 0;
    return Math.ceil((minutes * 60 + seconds + 2) * 1000);
  }
  return 8000;
}

/**
 * Evaluates a single prompt.
 * Latency timing begins strictly at the start of this attempt.
 */
async function evalSinglePrompt(item, providerName, model, modelId) {
  const attemptStart = performance.now();
  let firstChunkTime = null;
  let rawText = "";
  let streamError = null;

  try {
    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      prompt: item.prompt,
      temperature: EVAL_TEMPERATURE,
      maxRetries: 0,
      onError({ error }) {
        streamError = error;
      },
    });

    for await (const chunk of result.textStream) {
      if (firstChunkTime === null) {
        firstChunkTime = performance.now();
      }
      rawText += chunk;
    }

    if (streamError) {
      throw streamError;
    }

    const end = performance.now();
    // Timing starts strictly at the attempt that succeeded:
    const ttftMs = firstChunkTime ? Math.round(firstChunkTime - attemptStart) : Math.round(end - attemptStart);
    const durationMs = Math.round(end - attemptStart);

    if (!rawText.trim()) {
      throw new Error("Empty output stream received from provider.");
    }

    let usage = null;
    try {
      usage = await result.usage;
    } catch {}

    const inputTokens = usage?.inputTokens || 0;
    const outputTokens = usage?.outputTokens || 0;
    const totalTokens = usage?.totalTokens || (inputTokens + outputTokens);
    const thinkingTokens = usage?.outputTokenDetails?.reasoningTokens || 0;
    const textTokens = usage?.outputTokenDetails?.textTokens || Math.max(0, outputTokens - thinkingTokens);

    const astArray = extractJsonArray(rawText);
    const isValidArray = Array.isArray(astArray) && astArray.length > 0;

    let validNodes = 0;
    let totalNodes = 0;
    let hasHeader = false;

    if (isValidArray) {
      totalNodes = astArray.length;
      for (const node of astArray) {
        if (node && typeof node === "object" && node.type === "Header") {
          hasHeader = true;
        }
        const check = validateComponentNode(node);
        if (check.valid) {
          validNodes++;
        }
      }
    }

    const nodePassRate = totalNodes > 0 ? (validNodes / totalNodes) * 100 : 0;
    const fullLayoutPass = isValidArray && nodePassRate === 100 && hasHeader;

    return {
      id: item.id,
      category: item.category,
      prompt: item.prompt,
      provider: providerName,
      model: modelId || providerName,
      promptVersion: PROMPT_VERSION,
      temperature: EVAL_TEMPERATURE,
      commitHash: currentCommitHash,
      ttftMs,
      durationMs,
      inputTokens,
      outputTokens,
      totalTokens,
      thinkingTokens,
      textTokens,
      totalNodes,
      validNodes,
      nodePassRate: Math.round(nodePassRate * 10) / 10,
      hasHeader,
      fullLayoutPass,
      success: true,
      rateLimited: false,
      status: "completed",
      rawOutput: rawText,
      rawOutputPreview: rawText.slice(0, 150) + "...",
    };
  } catch (err) {
    const end = performance.now();
    const effectiveErr = streamError || err;
    const retryAfterMs = extractRetryAfterMs(effectiveErr);
    const errMsg = (effectiveErr.message || String(effectiveErr)).toLowerCase();
    const isRateLimit =
      errMsg.includes("rate_limit") ||
      errMsg.includes("429") ||
      errMsg.includes("tpm") ||
      errMsg.includes("tpd") ||
      errMsg.includes("tokens per") ||
      errMsg.includes("503") ||
      errMsg.includes("overloaded") ||
      errMsg.includes("quota");

    return {
      id: item.id,
      category: item.category,
      prompt: item.prompt,
      provider: providerName,
      model: modelId || providerName,
      promptVersion: PROMPT_VERSION,
      temperature: EVAL_TEMPERATURE,
      commitHash: currentCommitHash,
      ttftMs: null,
      durationMs: Math.round(end - attemptStart),
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      thinkingTokens: 0,
      textTokens: 0,
      totalNodes: 0,
      validNodes: 0,
      nodePassRate: 0,
      hasHeader: false,
      fullLayoutPass: false,
      success: false,
      rateLimited: isRateLimit,
      status: isRateLimit ? "rate_limited" : "failed",
      error: effectiveErr.message || String(effectiveErr),
      retryAfterMs,
      rawOutput: rawText || null,
      rawOutputPreview: (rawText || "").slice(0, 150) + "...",
    };
  }
}

/**
 * Resumable retry harness:
 * Separates wait time spent on 429s into `rateLimitWaitMs`.
 * Timing of successful response begins at the attempt that succeeds.
 */
async function evalWithRetry(item, providerName, model, modelId, maxRetries = 15) {
  let rateLimitWaitMs = 0;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await evalSinglePrompt(item, providerName, model, modelId);
    if (res.success && res.totalNodes > 0) {
      res.rateLimitWaitMs = rateLimitWaitMs;
      return res;
    }

    if (res.rateLimited && attempt < maxRetries) {
      const waitMs = res.retryAfterMs || 8000;
      rateLimitWaitMs += waitMs;
      process.stdout.write(` [429: wait ${Math.ceil(waitMs / 1000)}s per header (retry ${attempt}/${maxRetries})] `);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    if (attempt < 3 && !res.rateLimited) {
      await new Promise((r) => setTimeout(r, 1500 * attempt));
      continue;
    }

    res.rateLimitWaitMs = rateLimitWaitMs;
    return res;
  }
}

function percentile(arr, p) {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  if (lower === upper) return sorted[lower];
  return Math.round(sorted[lower] * (1 - weight) + sorted[upper] * weight);
}

function summarize(results, modelLabel, isLatencyInvalid = false) {
  const successful = results.filter((r) => r.success && r.totalNodes > 0);
  const count = results.length;
  const succCount = successful.length;

  const ttfts = successful.map((r) => r.ttftMs).filter((v) => typeof v === "number" && v > 0);
  const durations = successful.map((r) => r.durationMs).filter((v) => typeof v === "number" && v > 0);
  const totalTokensArr = successful.map((r) => r.totalTokens).filter((v) => typeof v === "number" && v > 0);
  const thinkingTokensArr = successful.map((r) => r.thinkingTokens).filter((v) => typeof v === "number" && v > 0);

  const totalNodes = successful.reduce((acc, r) => acc + r.totalNodes, 0);
  const totalValidNodes = successful.reduce((acc, r) => acc + r.validNodes, 0);
  const nodePassRate =
    totalNodes > 0 ? Math.round((totalValidNodes / totalNodes) * 1000) / 10 : 0;
  const fullLayoutPassCount = successful.filter((r) => r.fullLayoutPass).length;
  const fullLayoutPassRate =
    count > 0 ? Math.round((fullLayoutPassCount / count) * 1000) / 10 : 0;

  const avgTokens =
    totalTokensArr.length > 0
      ? Math.round(totalTokensArr.reduce((a, b) => a + b, 0) / totalTokensArr.length)
      : 0;

  const avgThinkingTokens =
    thinkingTokensArr.length > 0
      ? Math.round(thinkingTokensArr.reduce((a, b) => a + b, 0) / thinkingTokensArr.length)
      : 0;

  return {
    model: modelLabel,
    sampleSize: count,
    successCount: succCount,
    nodeValidationPassRate: nodePassRate,
    fullLayoutPassRate: fullLayoutPassRate,
    latencyValid: !isLatencyInvalid,
    firstRenderP50Ms: isLatencyInvalid ? "INVALID" : percentile(ttfts, 0.5),
    firstRenderP95Ms: isLatencyInvalid ? "INVALID" : percentile(ttfts, 0.95),
    fullLayoutP50Ms: isLatencyInvalid ? "INVALID" : percentile(durations, 0.5),
    fullLayoutP95Ms: isLatencyInvalid ? "INVALID" : percentile(durations, 0.95),
    avgTokensPerPrompt: avgTokens,
    avgThinkingTokens: avgThinkingTokens,
    totalComponentsEvaluated: totalNodes,
    validComponentsEvaluated: totalValidNodes,
  };
}

async function runModelSuite(modelKey, providerName, modelInstance, outFileName) {
  const filePath = path.join(evalsDir, outFileName);
  let dataset = [];
  if (fs.existsSync(filePath)) {
    try {
      dataset = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      if (!Array.isArray(dataset)) dataset = [];
    } catch {}
  }

  console.log(`\n=======================================================`);
  console.log(`EVALUATING: ${providerName}`);
  console.log(`Target: ${prompts.length} prompts -> ${outFileName}`);
  console.log(`=======================================================`);

  for (let i = 0; i < prompts.length; i++) {
    const item = prompts[i];
    // Resumability rule: Skip ANY prompt with a recorded result. Retry ONLY prompts marked rate-limited.
    const existing = dataset.find((r) => r.id === item.id);
    const isRateLimited =
      existing &&
      (existing.rateLimited === true ||
        existing.status === "rate_limited" ||
        existing.error?.includes("429") ||
        existing.error?.includes("Rate limit") ||
        existing.error?.includes("quota") ||
        (existing.totalNodes === 0 && existing.durationMs > 30000));

    if (existing && !isRateLimited) {
      process.stdout.write(`\r[${modelKey}] Cached: ${i + 1}/${prompts.length} (${item.id})`);
      continue;
    }

    process.stdout.write(`\r[${modelKey}] Running: ${i + 1}/${prompts.length} (${item.id} - ${item.category})`);
    const res = await evalWithRetry(item, providerName, modelInstance, modelKey);
    const existingIndex = dataset.findIndex((r) => r.id === item.id);
    if (existingIndex >= 0) {
      dataset[existingIndex] = res;
    } else {
      dataset.push(res);
    }
    fs.writeFileSync(filePath, JSON.stringify(dataset, null, 2));
    // Pace requests slightly to respect 8000 TPM limit
    await new Promise((r) => setTimeout(r, 1800));
  }

  console.log(`\n[${modelKey}] Suite Complete. Saved to ${outFileName}\n`);
  return dataset;
}

async function main() {
  const args = process.argv.slice(2);
  const targetMode = args[0] || "summary-only";

  console.log("\n=======================================================");
  console.log("APPFORGE GENERATION EVALUATION HARNESS");
  console.log(`Execution Mode: ${targetMode}`);
  console.log("=======================================================\n");

  let results120b = [];
  let results20b = [];
  let resultsGemini = [];

  // Load partial 120b dataset if available
  const p120bPath = path.join(evalsDir, "results-groq-120b-partial.json");
  if (fs.existsSync(p120bPath)) {
    try {
      results120b = JSON.parse(fs.readFileSync(p120bPath, "utf-8"));
    } catch {}
  }

  if (targetMode === "120b-only") {
    // Resumable 120b runner (for tomorrow after quota reset)
    const model120b = groq("openai/gpt-oss-120b");
    results120b = await runModelSuite("Groq-120b", "Groq (openai/gpt-oss-120b)", model120b, "results-groq-120b.json");
  } else if (targetMode === "run-20b") {
    const model20b = groq("openai/gpt-oss-20b");
    results20b = await runModelSuite("Groq-20b", "Groq (openai/gpt-oss-20b)", model20b, "results-groq-20b.json");
  }

  // Load existing datasets to build full comparative summary
  if (results20b.length === 0 && fs.existsSync(path.join(evalsDir, "results-groq-20b.json"))) {
    results20b = JSON.parse(fs.readFileSync(path.join(evalsDir, "results-groq-20b.json"), "utf-8"));
  }
  if (resultsGemini.length === 0 && fs.existsSync(path.join(evalsDir, "results-gemini.json"))) {
    resultsGemini = JSON.parse(fs.readFileSync(path.join(evalsDir, "results-gemini.json"), "utf-8"));
  }
  if (results120b.length === 0 && fs.existsSync(path.join(evalsDir, "results-groq-120b.json"))) {
    results120b = JSON.parse(fs.readFileSync(path.join(evalsDir, "results-groq-120b.json"), "utf-8"));
  }

  // 120b latency is marked INVALID because stored records aggregated internal AI SDK retry sleeps on 429s
  const summary120b = results120b.length > 0 ? summarize(results120b, "Groq (openai/gpt-oss-120b) [Partial]", true) : null;
  const summary20b = results20b.length > 0 ? summarize(results20b, "Groq (openai/gpt-oss-20b)", false) : null;
  const summaryGemini = resultsGemini.length > 0 ? summarize(resultsGemini, "Gemini (gemini-2.5-flash)", false) : null;

  const comparisonRows = [];
  if (summary120b) {
    comparisonRows.push({
      "Model": summary120b.model,
      "Sample N": summary120b.sampleSize,
      "Node Validity %": `${summary120b.nodeValidationPassRate}%`,
      "Full Layout %": `${summary120b.fullLayoutPassRate}%`,
      "TTFT p50": summary120b.firstRenderP50Ms === "INVALID" ? "INVALID (Polluted by retry sleep)" : `${summary120b.firstRenderP50Ms} ms`,
      "TTFT p95": summary120b.firstRenderP95Ms === "INVALID" ? "INVALID (Polluted by retry sleep)" : `${summary120b.firstRenderP95Ms} ms`,
      "Duration p50": summary120b.fullLayoutP50Ms === "INVALID" ? "INVALID (Polluted by retry sleep)" : `${summary120b.fullLayoutP50Ms} ms`,
      "Duration p95": summary120b.fullLayoutP95Ms === "INVALID" ? "INVALID (Polluted by retry sleep)" : `${summary120b.fullLayoutP95Ms} ms`,
      "Avg Tokens": summary120b.avgTokensPerPrompt,
    });
  }
  if (summary20b) {
    comparisonRows.push({
      "Model": summary20b.model,
      "Sample N": summary20b.sampleSize,
      "Node Validity %": `${summary20b.nodeValidationPassRate}%`,
      "Full Layout %": `${summary20b.fullLayoutPassRate}%`,
      "TTFT p50": `${summary20b.firstRenderP50Ms} ms`,
      "TTFT p95": `${summary20b.firstRenderP95Ms} ms`,
      "Duration p50": `${summary20b.fullLayoutP50Ms} ms`,
      "Duration p95": `${summary20b.fullLayoutP95Ms} ms`,
      "Avg Tokens": summary20b.avgTokensPerPrompt,
    });
  }
  if (summaryGemini) {
    comparisonRows.push({
      "Model": summaryGemini.model,
      "Sample N": summaryGemini.sampleSize,
      "Node Validity %": `${summaryGemini.nodeValidationPassRate}%`,
      "Full Layout %": `${summaryGemini.fullLayoutPassRate}%`,
      "TTFT p50": `${summaryGemini.firstRenderP50Ms} ms`,
      "TTFT p95": `${summaryGemini.firstRenderP95Ms} ms`,
      "Duration p50": `${summaryGemini.fullLayoutP50Ms} ms`,
      "Duration p95": `${summaryGemini.fullLayoutP95Ms} ms`,
      "Avg Tokens": `${summaryGemini.avgTokensPerPrompt} (thinking: ${summaryGemini.avgThinkingTokens})`,
    });
  }

  console.log("\n=======================================================");
  console.log("EVALUATION HARNESS COMPARISON TABLE");
  console.log("=======================================================\n");
  console.table(comparisonRows);

  const fullSummaryData = {
    timestamp: new Date().toISOString(),
    environment: {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      cpus: os.cpus()[0]?.model,
      nodeVersion: process.version,
    },
    models: {
      groq_120b_partial: summary120b,
      groq_20b: summary20b,
      gemini_2_5_flash: summaryGemini,
    },
    reproductionCommand: "node scripts/run-evals.mjs",
  };

  fs.writeFileSync(path.join(evalsDir, "eval-summary.json"), JSON.stringify(fullSummaryData, null, 2));
  console.log("\nSaved evaluation summary to evals/eval-summary.json\n");
}

main().catch((err) => {
  console.error("Eval harness execution failed:", err);
  process.exit(1);
});
