# Decision Record: Failover Before First Chunk Only

## Context & Problem
AppForge leverages multi-provider LLM orchestration for Copilot code generation (Groq Primary with Gemini Fallback). When streaming JSON AST nodes to the client over Server-Sent Events (SSE) or HTTP chunked transfer, two distinct failure modes occur:
1. **Pre-Stream Failure**: The primary provider returns an immediate error (HTTP 429 Rate Limit, HTTP 503 Overloaded, or network timeout) *before* any HTTP body bytes or SSE tokens have been emitted to the client.
2. **Mid-Stream Failure**: The primary provider emits partial valid chunks (e.g. `[{"type": "Header", ...}`), and subsequently disconnects or fails halfway through the JSON AST payload.

## Decision
- **Failover is permitted ONLY before the first chunk is sent to the client.**
- If the primary provider fails before sending any tokens, the streaming pipeline catches the error, logs a failover warning, switches to the secondary provider (Gemini), and streams the secondary provider's response from the beginning.
- If the primary provider fails **mid-stream** (after the first chunk has been transmitted), failover is **strictly locked out**. The pipeline immediately emits a terminal SSE error event and closes the stream. It NEVER switches providers mid-stream and NEVER concatenates tokens from multiple providers.

## Rationale
Switching providers mid-stream would emit half an AST from Provider A followed by the beginning or middle of an AST from Provider B, producing invalid or corrupted JSON that fails Zod validation and breaks the client-side parser. A clean, terminal error allows the client UI to detect the failure, display an error banner, and prompt the user to retry cleanly.

## Verification
Automated test suite `tests/copilot-pipeline.test.ts`:
- `"fails over to secondary provider when primary fails BEFORE the first chunk is sent"` (PASS)
- `"STRICTLY TERMINATES with clean terminal error on MID-STREAM failure (NEVER fails over, NEVER concatenates)"` (PASS)
