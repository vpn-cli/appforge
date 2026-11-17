# AppForge Generation Evaluation Harness Report

**Evaluation Timestamp:** 2026-11-17T18:43:14Z  
**Reproduction Command:** `node scripts/run-evals.mjs`  
**Resumption Command (for 120b after quota reset):** `node scripts/run-evals.mjs 120b-only`

---

## 1. System & Test Environment

* **Operating System:** Windows 11 (`win32 10.0.26300 x64`)
* **Processor:** AMD Ryzen 7 6800H with Radeon Graphics (8 Cores, 16 Threads)
* **Runtime:** Node.js `v24.15.0`
* **Benchmark Suite:** 100 curated domain-specific prompts across 5 categories:
  * Forms (`form-01` to `form-20`)
  * Dashboards (`dash-01` to `dash-20`)
  * CRUD Interfaces (`crud-01` to `crud-20`)
  * System Settings (`sett-01` to `sett-20`)
  * Analytics & Telemetry (`anal-01` to `anal-20`)
* **AST Validation Engine:** Per-component Zod validator (`lib/validation.ts`) enforcing `Header`, `Statistic`, `DataTable`, `Card`, `Grid`, and `ButtonAction` schemas.

---

## 2. Model Performance & Validity Comparison

| Model | Evaluated (N) | Node Validity % | Full Layout Pass % | First Render p50 (TTFT) | First Render p95 (TTFT) | Full Layout p50 | Full Layout p95 | Avg Tokens / Prompt |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Groq (`openai/gpt-oss-120b`)** *(Partial)* | 67 | **92.8%** | **71.6%** | 5,326 ms | 30,202 ms* | 6,181 ms | 31,394 ms* | ~1,250 |
| **Groq (`openai/gpt-oss-20b`)** *(Full)* | 100 | **87.7%** | **68.0%** | **1,620 ms** | **2,917 ms** | **1,956 ms** | **3,341 ms** | 1,749 |
| **Gemini (`gemini-2.5-flash`)** *(Free Tier)* | 6** | **100.0%** | **100.0%** | 12,733 ms | 16,676 ms | 14,211 ms | 18,076 ms | 3,249 |

*\*Note on 120b Latency: p95 includes sliding-window backoff intervals incurred between prompts 60–67 as the 200,000 Tokens Per Day (TPD) quota was reached.*  
*\*\*Note on Gemini Sample Size: Google AI Studio enforces a hard cap of 20 requests per day on free-tier keys (`limit: 20 requests per day exceeded`). Prompts beyond quota were blocked by upstream Google API limits (`retry in 13h28m`).*

---

## 3. Key Findings & Trade-Off Analysis

### Speed vs. Accuracy (Groq 20b vs. 120b)
* **Latency Advantage:** `openai/gpt-oss-20b` is **3.3x faster to first token** (p50: 1,620 ms vs 5,326 ms) and **3.2x faster to complete layout** (p50: 1,956 ms vs 6,181 ms) compared to `120b`.
* **Accuracy Trade-off:** The 120B parameter model achieves higher component validity (**92.8%** vs. **87.7%**) and layout pass rate (**71.6%** vs. **68.0%**). The smaller 20B model occasionally outputs unstructured wrappers for complex composite forms.
* **Token Efficiency:** The 20B model averages 1,749 tokens per prompt (with reasoning + generation tokens included).

### Failover Dynamics & Production Verification
* **Pre-Chunk Failover Guarantee:** Confirmed live against `http://localhost:3000/api/copilot`. When Groq 120b hits HTTP 429 before the first chunk, `createCopilotStream` intercepts the error immediately (`hasSentChunks === false`), logs the incident, and fails over to Gemini.
* **Clean Fallback Execution:** Gemini generated 2,552 bytes of valid JSON UI AST with zero token leaks or model concatenation.
* **Fallback Cost:** While Gemini exhibits **100% component schema validity**, its time-to-first-token is significantly higher (~12.7s p50), confirming the necessity of Groq as the low-latency primary stream tier.

---

## 4. Quota Constraints & Resumption Protocol

* **Groq On-Demand Tier:** Enforces 8,000 Tokens Per Minute (TPM) and 200,000 Tokens Per Day (TPD). The test runner's automatic `retry-after` header parser successfully manages TPM resets without dropping requests.
* **120b Frozen Baseline:** The 67 evaluated prompts are saved at [`evals/results-groq-120b-partial.json`](file:///d:/Projects/appforge/evals/results-groq-120b-partial.json).
* **Resuming 120b Tomorrow:**
  ```bash
  node scripts/run-evals.mjs 120b-only
  ```
  The runner will skip prompts 1–67 and evaluate remaining prompts 68–100 directly into `evals/results-groq-120b.json`.

