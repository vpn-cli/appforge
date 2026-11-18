# AppForge Generation Evaluation Harness Report

**Evaluation Timestamp:** 2026-11-18T00:15:12Z  
**Reproduction Command:** `node scripts/run-evals.mjs`  
**Resumption Command (for 120b after quota reset):** `node scripts/run-evals.mjs 120b-only`

---

## 1. System & Test Environment

* **Operating System:** Windows 11 (`win32 10.0.26300 x64`)
* **Processor:** AMD Ryzen 7 6800H with Radeon Graphics (8 Cores, 16 Threads)
* **Runtime:** Node.js `v24.15.0`
* **Benchmark Suite:** 100 domain-specific prompts across 5 categories (`evals/benchmark-prompts.json`):
  * Forms (`form-01` to `form-20`)
  * Dashboards (`dash-01` to `dash-20`)
  * CRUD Interfaces (`crud-01` to `crud-20`)
  * System Settings (`sett-01` to `sett-20`)
  * Analytics & Telemetry (`anal-01` to `anal-20`)
* **AST Validation Engine:** Per-component Zod validator (`lib/validation.ts`) enforcing `Header`, `Statistic`, `DataTable`, `Card`, `Grid`, and `ButtonAction` schemas with safe fallback node integration (`registry/components/InvalidNodeFallback.tsx`).

---

## 2. Model Performance & Validity Comparison

| Model | Evaluated (N) | Node Validity % | Full Layout Pass % | First Render p50 (TTFT) | First Render p95 (TTFT) | Full Layout p50 | Full Layout p95 | Avg Tokens / Prompt |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Groq (`openai/gpt-oss-120b`)** *(Partial)* | 67 | **92.8%** | **71.6%** | *INVALID\** | *INVALID\** | *INVALID\** | *INVALID\** | ~1,250 |
| **Groq (`openai/gpt-oss-20b`)** *(Full)* | 100 | **87.7%** | **68.0%** | **1,620 ms** | **2,917 ms** | **1,956 ms** | **3,341 ms** | **1,749** |
| **Gemini (`gemini-2.5-flash`)** *(Free Tier)* | 100 (1 valid)\*\* | **100.0%** | **1.0%** | 69,174 ms | 69,174 ms | 72,502 ms | 72,502 ms | Quota Blocked |

*\*Note on 120b Latency: Marked INVALID per protocol. In the original evaluation run, `streamText` internal retries and outer backoff sleep delays on 429 rate limits were captured inside the overall attempt timer (inflating recorded durations to 63–92 seconds for rate-limited prompts). Because individual per-chunk or per-attempt timestamps were not preserved, model inference time cannot be isolated mathematically from retry sleep.*  
*\*\*Note on Gemini: Evaluated with Google's default dynamic thinking budget. Gemini hit Google AI Studio's Free Tier limit of 20 requests per day (`generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20 exceeded. Retry in 13h28m`). Only 1 layout (`dash-04`) completed with valid components before hard quota cutoff. Per instructions, no further Gemini requests were executed against the live application key.*

---

## 3. Exact Metric Definitions

### Node Validity %
A generated layout produces an array of AST component nodes: `[node_1, node_2, ..., node_k]`.
Each node is evaluated individually through `validateComponentNode(node)` from `lib/validation.ts`.
A node is considered **Valid** if and only if:
1. `node` is a non-null object containing a registered `type` property in `{"Header", "Statistic", "DataTable", "Card", "Grid", "ButtonAction"}`.
2. `node` strictly satisfies its component-specific Zod schema via `schema.safeParse(node).success === true`:
   * `HeaderSchema`: Requires valid string `title`, optional `subtitle`, and `size` strictly in `["sm", "md", "lg"]`.
   * `StatisticSchema`: Requires numeric/string `value`, valid `label` or `title`, and optional `trend` strictly adhering to trend union schemas (`up | down | neutral` or `{ value, label, direction, sentiment }`).
   * `DataTableSchema`: Requires structured `columns` (`string` or `{ key, label, type, align }`) and `data` or `rows` records.
   * `ButtonActionSchema`: Requires `label` and `variant` strictly in `["default", "outline", "secondary", "ghost"]`.
   * `CardSchema` / `GridSchema`: Recursively validates that all child `content`, `footer`, or `items` are themselves valid component nodes.

$$\text{Node Validity \%} = \left(\frac{\sum \text{Valid Component Nodes}}{\sum \text{Total Evaluated Component Nodes}}\right) \times 100$$

### Full Layout Pass %
A benchmark prompt achieves a **Full Layout Pass** if and only if all three of the following criteria are met:
1. **Valid Non-Empty Array:** The response parses into a valid JSON array containing at least one component (`Array.isArray(ast) && ast.length > 0`).
2. **100% Component Validity:** Every single component node in the array passes `validateComponentNode(node).valid === true` (0 schema violations across all nodes in the tree).
3. **Architectural Root Requirement:** The top-level layout contains at least one `Header` component (`node.type === "Header"`), satisfying the top-level page contract.

$$\text{Full Layout Pass \%} = \left(\frac{\text{Count of Prompts Passing All 3 Layout Criteria}}{\text{Total Prompts in Benchmark Suite}}\right) \times 100$$

---

## 4. Discrepancy Analysis (120b Intermediate vs. Final Frozen Results)

Between the intermediate chat update and the committed dataset, the reported 120b metrics adjusted from (70.1% layout pass, 1,118 ms TTFT) to (71.6% layout pass, 5,326 ms TTFT). The underlying data was never overwritten; `git log` and array diffs confirm 0 entries in the original 67-prompt record changed. The differences arose from:

1. **Prompt 66 (`sett-06`) Completion:**
   * In the intermediate turn, an uncommitted slice of 65 completed items was calculated while prompt 66 was in-flight: 47 full passes out of 65 gave `47 / 67 = 70.1%` layout pass, and `138 / 149 = 92.6%` node validity.
   * When prompt 66 finished, it produced 3 valid nodes and passed full layout, bringing the final 67-prompt total to `48 / 67 = 71.6%` layout pass and `141 / 152 = 92.8%` node validity.
2. **Latency Calculation Methodology:**
   * The intermediate `1,118 ms` value was an unverified manual reference taken from `form-03`'s individual TTFT (`1,117 ms`), rather than an array percentile.
   * When `scripts/run-evals.mjs` ran the mathematical percentile calculation `percentile(ttfts, 0.5)` on all 57 successful responses, it produced `5,326 ms`.
   * However, because the original script did not reset timing across retries, prompts that hit Groq's sliding TPM/TPD rate limits accumulated AI SDK's exponential backoff sleep into their elapsed time (e.g. `92,384 ms` on `sett-02`). As a result, the 120b latency figures are marked **INVALID** to prevent reporting distorted performance.

---

## 5. Resumability Protocol & Retry Handling

[`scripts/run-evals.mjs`](file:///d:/Projects/appforge/scripts/run-evals.mjs) now enforces strict resumability:
* **Recorded Result Protection:** Any prompt with a recorded result is immediately skipped. Prompts resulting in model refusals (such as safety refusals on `form-02` and `form-03`) are preserved as valid data points and never overwritten.
* **Targeted Rate-Limit Retries:** Only prompts explicitly flagged as `rateLimited: true` or `status: "rate_limited"` are evaluated during retry passes.
* **Separation of Latency and Backoff:** Timing starts strictly at the execution of the successful attempt (`attemptStart = performance.now()`). Time spent waiting on HTTP 429 `retry-after` windows is tracked separately in `rateLimitWaitMs`.
* **Resuming Remaining 120b Prompts Tomorrow:**
  ```bash
  node scripts/run-evals.mjs 120b-only
  ```
  The runner will skip the 67 completed prompts in `evals/results-groq-120b.json` and finish prompts 68–100 after Groq quota replenishment.
