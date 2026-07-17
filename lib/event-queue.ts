import { Kafka } from "@upstash/kafka";

// Initializes the Serverless Kafka connection securely
// It relies on UPSTASH_KAFKA_REST_URL, UPSTASH_KAFKA_REST_USERNAME, and UPSTASH_KAFKA_REST_PASSWORD
// Ensure these are set in .env.local before triggering events in production.
const kafka = new Kafka({
  url: process.env.UPSTASH_KAFKA_REST_URL || "",
  username: process.env.UPSTASH_KAFKA_REST_USERNAME || "",
  password: process.env.UPSTASH_KAFKA_REST_PASSWORD || "",
});

export type EventType = "app_published" | "workflow_executed" | "user_joined";

export interface SystemEvent {
  id: string;
  type: EventType;
  timestamp: string;
  payload: Record<string, unknown>;
}

/**
 * EventPublisher: Securely forwards platform events into the Serverless Upstash Kafka queue.
 * By decoupling this execution, we guarantee that heavy downstream analytic hooks 
 * won't severely penalize the latency of the user's triggering HTTP request.
 */
export class EventPublisher {
  /**
   * Pushes an asynchronous fire-and-forget payload into the specified Kafka Topic.
   */
  static async publish(topic: string, type: EventType, payload: Record<string, unknown>) {
    try {
      // Validate credentials quickly to prevent hanging the Vercel branch unnecessarily
      if (!process.env.UPSTASH_KAFKA_REST_URL) {
        if (process.env.NODE_ENV === "development") {
          console.log(`[Kafka Mock] Published [${type}] into topic [${topic}]:`, payload);
          return { success: true, mocked: true };
        }
        throw new Error("Missing Upstash Kafka credentials globally. Event suppressed.");
      }

      const event: SystemEvent = {
        id: crypto.randomUUID(),
        type,
        timestamp: new Date().toISOString(),
        payload,
      };

      // Safely utilize the Upstash REST wrapper for connectionless messaging
      const producer = kafka.producer();
      await producer.produce(topic, {
        value: JSON.stringify(event),
      });

      return { success: true };
    } catch (error: unknown) {
      console.error(`[EventPublisher] CRITICAL FAILURE pushing into Kafka [${topic}]:`, (error as Error).message);
      // We purposefully DO NOT throw an error down further so as not to 
      // brick the User's UI flow (e.g., stopping a save just because analytics failed).
      return { success: false, error: (error as Error).message };
    }
  }
}
