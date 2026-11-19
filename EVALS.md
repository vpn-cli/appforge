# AppForge Generation Evaluation Harness Report

**Evaluation Timestamp:** 2026-11-18T00:15:12Z  
**Current Prompt Version:** `v1.3.0` (bumped from `v1.2.0` in `lib/copilot-prompt.ts`)  
**Reproduction Command:** `node scripts/run-evals.mjs`  
**Resumption Command (for 120b after quota reset):** `node scripts/run-evals.mjs 120b-only`

> [!NOTE]
> **Schema & Prompt Version Notice (`v1.2.0` → `v1.3.0` & Strict Validation Defense):** All recorded evaluation results below predate the `PROMPT_VERSION` bump to `v1.3.0`. In `v1.3.0`, component AST validation across all schemas (`HeaderSchema`, `StatisticSchema`, `DataTableSchema`, `CardSchema`, `GridSchema`, `ButtonActionSchema`) and `AppConfigSchema` transitioned to `.strict()`. Unrecognized or extra keys that previously passed through or were ignored now strictly fail validation. Consequently, evaluation pass rates, node validity percentages, and benchmark results recorded prior to `v1.3.0` are not comparable with results produced under this version. No new LLM evals have been run under `v1.3.0`.

> [!NOTE]
> **Historical Schema Notice (`v1.1.0` → `v1.2.0`):** Evaluation datasets below were originally executed under `v1.1.0` before `DataTableSchema` added `type: "status"` and `colors?: Record<string, "success" | "warning" | "danger" | "info" | "neutral" | "violet">`.

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

## 2. Independent Model Evaluation Records

> [!IMPORTANT]
> **Non-Comparative Data Notice:** The datasets below must NOT be compared side-by-side. Groq 120b was evaluated using strict per-component Zod schemas (`lib/validation.ts`), whereas Groq 20b was evaluated under an obsolete type-only string check (`commit 975e62a~1`). Because raw completions were not preserved in full, 20b cannot be back-scored. Each model's results are presented strictly as independent historical artifacts.

### 2.1 Groq (`openai/gpt-oss-120b`) — Per-Component Zod Schema Suite
* **Validation Standard:** Strict per-component Zod schemas (`HeaderSchema`, `StatisticSchema`, `DataTableSchema`, `CardSchema`, `GridSchema`, `ButtonActionSchema`).
* **Total Prompts Attempted:** 67 (interrupted by sliding-window rate limits at `sett-07`)
* **Completed Prompts (Excluding 429 Rate Limits):** 59 prompts
* **Full Layout Pass Rate (Excluding 429s):** **81.4%** (48 pass / 59 completed)
* **Full Layout Pass Rate (Raw with 429s as Fail):** **71.6%** (48 pass / 67 attempted)
* **Node Validity Rate:** **92.8%** (141 valid / 152 total component nodes evaluated across non-429 prompts)
* **Latency (TTFT & Duration):** Marked **INVALID** per evaluation protocol (exponential retry backoff sleep inflated attempt timers).

### 2.2 Groq (`openai/gpt-oss-20b`) — Legacy Unvalidated Run (Old Type-Only Check)
* **Validation Standard:** Legacy type-only string check (`z.object({ type: z.string() })` prior to `commit 975e62a`).
* **Total Prompts Evaluated:** 100 prompts
* **Reported Node Validity %:** **87.7% (old type-only check)** — Not evaluated against component schemas.
* **Reported Full Layout Pass %:** **68.0%** (68/100) — Historical unvalidated metric.
* **Latency Profile:** First Render p50: 1,620 ms | p95: 2,917 ms; Full Layout p50: 1,956 ms | p95: 3,341 ms; Avg Tokens: 1,749.

### 2.3 Gemini (`gemini-2.5-flash`) — Free Tier Quota Aborted Run
* **Validation Standard:** Evaluated with default dynamic thinking budget.
* **Total Prompts Attempted:** 100 (Hard quota cut off after prompt 1; 99 rejected with 429 quota exhaustion).
* **Completed Valid Layouts:** 1 (`dash-04`: 2 valid nodes, 100% node validity, 1.0% pass rate).
* **Latency Profile:** Marked **INVALID** due to quota delays and artificial hold time.

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
   * `DataTableSchema`: Requires structured `columns` (`string` or `{ key, label, type, colors, align }`, where `type` supports `"status"` and `colors` maps status values to `"success" | "warning" | "danger" | "info" | "neutral" | "violet"`) and `data` or `rows` records. *(Note: historical `v1.1.0` runs below used the prior schema without `type: "status"` or `colors`.)*
   * `ButtonActionSchema`: Requires `label` and `variant` strictly in `["default", "outline", "secondary", "ghost"]`.
   * `CardSchema` / `GridSchema`: Recursively validates that all child `content`, `footer`, or `items` are themselves valid component nodes.

$$\text{Node Validity \%} = \left(\frac{\sum \text{Valid Component Nodes}}{\sum \text{Total Evaluated Component Nodes}}\right) \times 100$$

> [!NOTE]
> **Refusal Node Contribution:** Prompts that result in a plain text refusal (such as `form-02` and `form-03`) emit 0 AST component nodes. They contribute exactly **0 valid nodes and 0 total nodes** to the aggregate node validity fraction. Refusals do not dilute or inflate the node validity percentage of parsed component nodes, but count strictly as failures for Full Layout Pass %.

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
* **Resuming Remaining 120b Prompts:**
  ```bash
  node scripts/run-evals.mjs 120b-only
  ```
  *(Paused: No further evals will be executed until a separate eval account is configured.)*

---

## 6. Groq 120b Per-Prompt Breakdown & Refusal Investigation

### Recomputed Metrics (Excluding Rate-Limited Prompts)
* **Total Evaluated Entries:** 67
* **Completed (Non-Rate-Limited):** 59 prompts
* **Status Distribution:**
  * **Pass:** 48 prompts
  * **Fail:** 9 prompts (`form-04`, `form-05`, `form-07`, `form-09`, `form-11`, `form-12`, `form-13`, `form-15`, `sett-02`)
  * **Refusal:** 2 prompts (`form-02`, `form-03`) — counted as failures
  * **Rate Limited (429):** 8 prompts (`dash-18`, `crud-19`, `crud-20`, `sett-01`, `sett-03`, `sett-04`, `sett-05`, `sett-07`) — excluded from recomputation
* **Full-Layout Pass % (Excluding Rate-Limited):**
  $$\text{Full Layout Pass \%} = \frac{48 \text{ passes}}{59 \text{ non-rate-limited prompts}} = 81.36\% \text{ (vs. } \frac{48}{67} = 71.64\% \text{ raw)}$$
* **Node Validity % (Excluding Rate-Limited):**
  $$\text{Node Validity \%} = \frac{141 \text{ valid nodes}}{152 \text{ evaluated nodes}} = 92.76\%$$
  *(126 valid / 126 in passes + 15 valid / 26 in fails + 0 / 0 in refusals + 0 / 0 in rate-limited)*

### Performance Across All 5 Prompt Categories

| Category | Suite Total | Evaluated | Completed (Non-429) | Rate-Limited (429) | Full Layout Passes | Fails / Refusals | Pass % (Completed) | Pass % (Evaluated) | Node Validity % |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Forms** | 20 | 20 | 20 | 0 | 10 | 10 (8 fail, 2 refusal) | **50.0%** (10/20) | **50.0%** (10/20) | **82.0%** (41/50) |
| **Dashboards** | 20 | 20 | 19 | 1 | 19 | 0 | **100.0%** (19/19) | **95.0%** (19/20) | **100.0%** (48/48) |
| **CRUD Interfaces** | 20 | 20 | 18 | 2 | 18 | 0 | **100.0%** (18/18) | **90.0%** (18/20) | **100.0%** (46/46) |
| **System Settings** | 20 | 7 | 2 | 5 | 1 | 1 | **50.0%** (1/2) | **14.3%** (1/7) | **75.0%** (6/8) |
| **Analytics & Telemetry** | 20 | 0 | 0 | 0 | 0 | 0 | *N/A (unattempted)* | *N/A (unattempted)* | *N/A* |
| **Total / Overall** | **100** | **67** | **59** | **8** | **48** | **11** | **81.4%** (48/59) | **71.6%** (48/67) | **92.8%** (141/152) |

### Refusal Investigation (`form-02` & `form-03`)
* **Prompt `form-02`:**
  * **Input:** `"Build a customer feedback and NPS survey form with rating scale and text comments"`
  * **Recorded Refusal Output:** `"I’m sorry, but I can’t help with that...."`
  * **Root Cause (Hypothesis, untested):** Suspected false-positive safety classifier trigger on customer feedback / PII collection within the model's system boundary.
* **Prompt `form-03`:**
  * **Input:** `"Create a multi-tier SaaS checkout billing form with credit card fields and tax address"`
  * **Recorded Refusal Output:** `"I’m sorry, but I can’t fulfill that request...."`
  * **Root Cause (Hypothesis, untested):** Suspected trigger on PCI-DSS / financial payment data guardrails caused by the phrase `"credit card fields"`. *(Note: The 1,117 ms TTFT of this single refusal was previously mistakenly cited as the overall 120b median).*

### Complete 67-Prompt Status Table

| Index | Prompt ID | Category | Status | Valid Nodes | Total Nodes | Node Pass % | Full Layout Pass |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| 1 | `form-01` | forms | **pass** | 3 | 3 | 100.0% | true |
| 2 | `form-02` | forms | **refusal** | 0 | 0 | 0.0% | false |
| 3 | `form-03` | forms | **refusal** | 0 | 0 | 0.0% | false |
| 4 | `form-04` | forms | **fail** | 1 | 2 | 50.0% | false |
| 5 | `form-05` | forms | **fail** | 2 | 3 | 66.7% | false |
| 6 | `form-06` | forms | **pass** | 3 | 3 | 100.0% | true |
| 7 | `form-07` | forms | **fail** | 2 | 4 | 50.0% | false |
| 8 | `form-08` | forms | **pass** | 3 | 3 | 100.0% | true |
| 9 | `form-09` | forms | **fail** | 2 | 3 | 66.7% | false |
| 10 | `form-10` | forms | **pass** | 5 | 5 | 100.0% | true |
| 11 | `form-11` | forms | **fail** | 2 | 3 | 66.7% | false |
| 12 | `form-12` | forms | **fail** | 1 | 2 | 50.0% | false |
| 13 | `form-13` | forms | **fail** | 1 | 2 | 50.0% | false |
| 14 | `form-14` | forms | **pass** | 2 | 2 | 100.0% | true |
| 15 | `form-15` | forms | **fail** | 1 | 2 | 50.0% | false |
| 16 | `form-16` | forms | **pass** | 3 | 3 | 100.0% | true |
| 17 | `form-17` | forms | **pass** | 2 | 2 | 100.0% | true |
| 18 | `form-18` | forms | **pass** | 2 | 2 | 100.0% | true |
| 19 | `form-19` | forms | **pass** | 3 | 3 | 100.0% | true |
| 20 | `form-20` | forms | **pass** | 3 | 3 | 100.0% | true |
| 21 | `dash-01` | dashboards | **pass** | 3 | 3 | 100.0% | true |
| 22 | `dash-02` | dashboards | **pass** | 2 | 2 | 100.0% | true |
| 23 | `dash-03` | dashboards | **pass** | 4 | 4 | 100.0% | true |
| 24 | `dash-04` | dashboards | **pass** | 2 | 2 | 100.0% | true |
| 25 | `dash-05` | dashboards | **pass** | 3 | 3 | 100.0% | true |
| 26 | `dash-06` | dashboards | **pass** | 2 | 2 | 100.0% | true |
| 27 | `dash-07` | dashboards | **pass** | 2 | 2 | 100.0% | true |
| 28 | `dash-08` | dashboards | **pass** | 2 | 2 | 100.0% | true |
| 29 | `dash-09` | dashboards | **pass** | 3 | 3 | 100.0% | true |
| 30 | `dash-10` | dashboards | **pass** | 2 | 2 | 100.0% | true |
| 31 | `dash-11` | dashboards | **pass** | 3 | 3 | 100.0% | true |
| 32 | `dash-12` | dashboards | **pass** | 3 | 3 | 100.0% | true |
| 33 | `dash-13` | dashboards | **pass** | 2 | 2 | 100.0% | true |
| 34 | `dash-14` | dashboards | **pass** | 2 | 2 | 100.0% | true |
| 35 | `dash-15` | dashboards | **pass** | 3 | 3 | 100.0% | true |
| 36 | `dash-16` | dashboards | **pass** | 2 | 2 | 100.0% | true |
| 37 | `dash-17` | dashboards | **pass** | 3 | 3 | 100.0% | true |
| 38 | `dash-18` | dashboards | **rate_limited** | 0 | 0 | 0.0% | false |
| 39 | `dash-19` | dashboards | **pass** | 3 | 3 | 100.0% | true |
| 40 | `dash-20` | dashboards | **pass** | 2 | 2 | 100.0% | true |
| 41 | `crud-01` | crud | **pass** | 2 | 2 | 100.0% | true |
| 42 | `crud-02` | crud | **pass** | 3 | 3 | 100.0% | true |
| 43 | `crud-03` | crud | **pass** | 3 | 3 | 100.0% | true |
| 44 | `crud-04` | crud | **pass** | 3 | 3 | 100.0% | true |
| 45 | `crud-05` | crud | **pass** | 2 | 2 | 100.0% | true |
| 46 | `crud-06` | crud | **pass** | 2 | 2 | 100.0% | true |
| 47 | `crud-07` | crud | **pass** | 3 | 3 | 100.0% | true |
| 48 | `crud-08` | crud | **pass** | 2 | 2 | 100.0% | true |
| 49 | `crud-09` | crud | **pass** | 3 | 3 | 100.0% | true |
| 50 | `crud-10` | crud | **pass** | 3 | 3 | 100.0% | true |
| 51 | `crud-11` | crud | **pass** | 3 | 3 | 100.0% | true |
| 52 | `crud-12` | crud | **pass** | 3 | 3 | 100.0% | true |
| 53 | `crud-13` | crud | **pass** | 2 | 2 | 100.0% | true |
| 54 | `crud-14` | crud | **pass** | 3 | 3 | 100.0% | true |
| 55 | `crud-15` | crud | **pass** | 2 | 2 | 100.0% | true |
| 56 | `crud-16` | crud | **pass** | 2 | 2 | 100.0% | true |
| 57 | `crud-17` | crud | **pass** | 3 | 3 | 100.0% | true |
| 58 | `crud-18` | crud | **pass** | 2 | 2 | 100.0% | true |
| 59 | `crud-19` | crud | **rate_limited** | 0 | 0 | 0.0% | false |
| 60 | `crud-20` | crud | **rate_limited** | 0 | 0 | 0.0% | false |
| 61 | `sett-01` | settings | **rate_limited** | 0 | 0 | 0.0% | false |
| 62 | `sett-02` | settings | **fail** | 3 | 5 | 60.0% | false |
| 63 | `sett-03` | settings | **rate_limited** | 0 | 0 | 0.0% | false |
| 64 | `sett-04` | settings | **rate_limited** | 0 | 0 | 0.0% | false |
| 65 | `sett-05` | settings | **rate_limited** | 0 | 0 | 0.0% | false |
| 66 | `sett-06` | settings | **pass** | 3 | 3 | 100.0% | true |
| 67 | `sett-07` | settings | **rate_limited** | 0 | 0 | 0.0% | false |
