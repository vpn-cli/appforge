import { streamText, LanguageModel } from "ai";
import { normalizePromptForCache } from "./validation";

export interface CopilotProvider {
  name: string;
  model: LanguageModel;
}

export interface CopilotPipelineOptions {
  prompt: string;
  providers: CopilotProvider[];
  systemPrompt: string;
  onCacheHit?: (data: string) => void;
  onCacheSet?: (key: string, value: string) => Promise<void>;
  getCached?: (key: string) => Promise<string | null>;
  temperature?: number;
}

export interface StreamEventCallbacks {
  onFirstChunk?: (providerName: string, chunk: string) => void;
  onMidStreamError?: (providerName: string, error: unknown) => void;
  onFailover?: (fromProvider: string, toProvider: string, error: unknown) => void;
}

/**
 * Executes a multi-provider streaming pipeline with strict failover semantics:
 * 1. Groq primary, Gemini fallback (or any prioritized provider array).
 * 2. Failover is permitted ONLY before the first chunk is sent.
 * 3. Once the first chunk is sent, the stream is committed to that provider.
 *    If a stream fails mid-way, it terminates with a clean terminal error.
 *    It NEVER concatenates output from two models.
 */
export function createCopilotStream(
  options: CopilotPipelineOptions,
  callbacks?: StreamEventCallbacks
): ReadableStream<Uint8Array> {
  const { prompt, providers, systemPrompt, temperature = 0.1, onCacheSet } = options;
  const normalizedKey = `copilot_cache:${normalizePromptForCache(prompt)}`;
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      if (!providers || providers.length === 0) {
        controller.error(new Error("No AI providers configured."));
        return;
      }

      let lastError: unknown = null;
      let hasSentChunks = false;
      let streamTextAccumulator = "";

      for (let i = 0; i < providers.length; i++) {
        const currentProvider = providers[i];

        try {
          const responseResult = streamText({
            model: currentProvider.model,
            system: systemPrompt,
            prompt,
            temperature,
          });

          const iterator = responseResult.textStream[Symbol.asyncIterator]();

          // 1. Attempt to acquire the FIRST chunk
          const firstResult = await iterator.next();

          if (firstResult.done) {
            throw new Error(`Provider '${currentProvider.name}' produced an empty token stream.`);
          }

          // 2. Commit to this provider: failover window is now CLOSED
          controller.enqueue(encoder.encode(firstResult.value));
          streamTextAccumulator += firstResult.value;
          hasSentChunks = true;

          if (callbacks?.onFirstChunk) {
            callbacks.onFirstChunk(currentProvider.name, firstResult.value);
          }

          // 3. Stream remaining chunks exclusively from this provider
          try {
            while (true) {
              const nextResult = await iterator.next();
              if (nextResult.done) break;

              controller.enqueue(encoder.encode(nextResult.value));
              streamTextAccumulator += nextResult.value;
            }
          } catch (midStreamErr) {
            // Mid-stream error: MUST NOT failover to another provider!
            console.error(
              `[Copilot Stream] Fatal mid-stream failure with '${currentProvider.name}'. Failover locked out.`,
              midStreamErr
            );

            if (callbacks?.onMidStreamError) {
              callbacks.onMidStreamError(currentProvider.name, midStreamErr);
            }

            // Emit a clean terminal stream error event so client can retry
            controller.error(
              new Error(
                `Stream failed mid-way on ${currentProvider.name}: ${(midStreamErr as Error).message || "Connection interrupted"}`
              )
            );
            return;
          }

          // 4. Stream completed successfully
          if (onCacheSet && streamTextAccumulator.trim()) {
            await onCacheSet(normalizedKey, streamTextAccumulator).catch((err) => {
              console.error("[Copilot Pipeline] Failed to cache completion:", err);
            });
          }

          controller.close();
          return; // Successfully finished
        } catch (beforeFirstChunkErr) {
          // If chunks were already sent, do not failover (already handled in inner loop, but guard here)
          if (hasSentChunks) {
            controller.error(beforeFirstChunkErr);
            return;
          }

          lastError = beforeFirstChunkErr;
          const nextProvider = providers[i + 1];

          if (nextProvider) {
            console.warn(
              `[Copilot Failover] Provider '${currentProvider.name}' failed before sending any chunk: ${(beforeFirstChunkErr as Error).message}. Failing over to '${nextProvider.name}'...`
            );
            if (callbacks?.onFailover) {
              callbacks.onFailover(currentProvider.name, nextProvider.name, beforeFirstChunkErr);
            }
          } else {
            console.error(
              `[Copilot Pipeline] Final provider '${currentProvider.name}' failed before sending any chunk: ${(beforeFirstChunkErr as Error).message}`
            );
          }
          // Continue to next provider in fallback array
        }
      }

      // All providers failed before first chunk
      controller.error(
        lastError || new Error("All configured AI providers failed before sending the first chunk.")
      );
    },
  });
}
