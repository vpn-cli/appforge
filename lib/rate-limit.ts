import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize standard global Redis instance. Wrap in a mock if missing configurations locally
let rateLimit: Ratelimit | { limit: (ip: string) => Promise<{ success: boolean; limit: number; remaining: number; reset: number }> };

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  rateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: true,
    prefix: "@appforge/ratelimit",
  });
} else {
  // Mock limiter permitting all queries in local environments where Redis avoids connection
  rateLimit = {
    limit: async (ip: string) => ({ success: true, limit: 10, remaining: 10, reset: 0 })
  };
}

export { rateLimit };
