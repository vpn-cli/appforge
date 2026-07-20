import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
export class RateLimitError extends Error {
  constructor(message = "Rate limit exceeded") {
    super(message);
    this.name = "RateLimitError";
  }
}

// Determine if we have Upstash Redis access wired seamlessly via environment boundaries
const hasUpstashKeys = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

let ratelimit: Ratelimit | null = null;

if (hasUpstashKeys) {
  // Leverage the actual global edge sliding window using `@upstash/redis` from the Upstash SKILLS context lookup
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "60 s"),
  });
}

// Fallback: Mock token bucket rate limiter for local IDE development
const ipMap = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = {
  limit: async (ip: string, maxRequests: number = 3, windowMs: number = 60000) => {
    // Route 1: Official Vercel Edge implementation
    if (ratelimit) {
      return await ratelimit.limit(ip);
    }

    // Route 2: Local Memory Fallback execution
    const now = Date.now();
    let record = ipMap.get(ip);
    
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
    }
    
    record.count++;
    ipMap.set(ip, record);
    
    const success = record.count <= maxRequests;
    return { 
      success, 
      limit: maxRequests, 
      remaining: Math.max(0, maxRequests - record.count), 
      reset: record.resetTime 
    };
  }
};
