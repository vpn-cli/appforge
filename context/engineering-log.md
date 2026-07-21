# AppForge Engineering Log
*A living document tracking critical architectural blockades, compiler quirks, and systematic optimizations implemented across the AppForge platform.*

### 1. LLM Output Serialization (Markdown Contamination)
**Challenge:** Generative models (like Gemini) implicitly format JSON payload outputs by wrapping them in Markdown code blocks (e.g. ` ```json { ... } ``` `). Feeding this raw string directly into the Javascript compilation engine triggered fatal `SyntaxError` crashes at `JSON.parse()`.
**Solution:** Deployed an aggressive Regular Expression (RegEx) sequence (`.replace(/```json/gi, "")`) to silently scrub textual wrappers off the LLM payload before serialization. 
**Optimization:** To prevent CPU/memory thrashing across older devices, this RegEx sweep was moved fundamentally outside the real-time `while(true)` streaming decoder loop, ensuring it only executes exactly once when network packets are fully flushed.

### 2. Next.js Turbopack Caching Stalls (HMR CSS Freezes)
**Challenge:** Rapid sequential edits to Tailwind JIT utility maps (e.g. arbitrary dynamic corner properties) caused the `.next` compiler daemon to lock into a frozen cache state, rendering the preview browser visually obsolete despite disk files being completely updated.
**Solution:** Bypassed the Tailwind compilation engine sequentially during development gridlock by injecting raw React DOM inline styling (`style={{}}`). This forced physical execution of explicit CSS parameters directly into the browser regardless of Webpack pipeline status.

### 3. Gemini API Daily Quota Exhaustion (429 Fallback)
**Challenge:** Extensive prompt testing and UI schema generation rapidly maxed out the single-account free tier Google AI Studio allowance (1,500 Requests Per Day), causing the entire `/api/copilot` edge route to throw fatal `429: RESOURCE_EXHAUSTED` stack traces.
**Solution:** Architected a "Token Rotational Failover Pipeline". Configured the endpoint array to sequentially loop through a localized environmental stack (`GEMINI_API_KEY`, `GEMINI_API_KEY_2`, etc.). If a `429` error is explicitly caught on the primary iteration, the backend silently swallows the halt exception and cascades the payload down to the secondary token cluster, achieving massive uptime reliability.

### 4. LLM Context Window Token Inflation
**Challenge:** Pushing the massive 70+ line conversational Natural Language system prompt into every single Copilot request severely skyrocketed token consumption variables.
**Solution:** Optimized network loads via "Prompt Minification". Translated all verbose JSON schemas into heavily compressed, ultra-dense TypeScript object interfaces. Since core LLMs natively parse language AST structures better than human filler-phrases, this computationally reduced payload payloads by an estimated ~75%, heavily stretching free-tier limitations.

### 5. Tailwind CSS Specificity Overrides (The Droplet Bug)
**Challenge:** Combining generic radius utility variables (`rounded-2xl` / 16px) with localized structural anchors (`rounded-tr-sm` / 2px) mathematically resulted in the CSS compiler overwriting the specific anchor due to cascade loading orders—physically erasing chat droplets.
**Solution:** Disassembled generic groupings. Explicitly declared all independent border-radii dynamically per-component (`rounded-tl-2xl rounded-bl-2xl rounded-br-2xl rounded-tr-sm`) to guarantee strict structural boundaries that Webpack has zero jurisdiction to casually override.
