import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
export class RateLimitError extends Error {
  constructor(message = "Rate limit exceeded") {
    super(message);
    this.name = "RateLimitError";
  }
}

export const PUBLIC_READ_RATE_LIMIT_MAX = 120;
export const PUBLIC_READ_RATE_LIMIT_WINDOW_SECONDS = 60;
export const PUBLIC_READ_RATE_LIMIT_WINDOW_MS = PUBLIC_READ_RATE_LIMIT_WINDOW_SECONDS * 1000;

// Determine if we have Upstash Redis access wired seamlessly via environment boundaries
const hasUpstashKeys = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

let ratelimit: Ratelimit | null = null;
let publicReadRatelimit: Ratelimit | null = null;

if (hasUpstashKeys) {
  // Leverage the actual global edge sliding window using `@upstash/redis` from the Upstash SKILLS context lookup
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "60 s"),
  });

  publicReadRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      PUBLIC_READ_RATE_LIMIT_MAX,
      `${PUBLIC_READ_RATE_LIMIT_WINDOW_SECONDS} s`
    ),
    prefix: "appforge:public_read",
  });
}

// Fallback: Mock token bucket rate limiters for local IDE development
const ipMap = new Map<string, { count: number; resetTime: number }>();
const publicReadIpMap = new Map<string, { count: number; resetTime: number }>();

function limitInMemory(
  store: Map<string, { count: number; resetTime: number }>,
  key: string,
  maxRequests: number,
  windowMs: number
) {
  const now = Date.now();
  let record = store.get(key);

  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + windowMs };
  }

  record.count++;
  store.set(key, record);

  const success = record.count <= maxRequests;
  return {
    success,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - record.count),
    reset: record.resetTime,
  };
}

export const rateLimit = {
  limit: async (ip: string, maxRequests: number = 20, windowMs: number = 60000) => {
    // Route 1: Official Vercel Edge implementation
    if (ratelimit) {
      return await ratelimit.limit(ip);
    }

    // Route 2: Local Memory Fallback execution
    return limitInMemory(ipMap, ip, maxRequests, windowMs);
  }
};

export const publicReadRateLimit = {
  limit: async (
    ip: string,
    maxRequests: number = PUBLIC_READ_RATE_LIMIT_MAX,
    windowMs: number = PUBLIC_READ_RATE_LIMIT_WINDOW_MS
  ) => {
    if (publicReadRatelimit) {
      return await publicReadRatelimit.limit(ip);
    }

    return limitInMemory(publicReadIpMap, ip, maxRequests, windowMs);
  }
};
