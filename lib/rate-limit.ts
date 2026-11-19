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

export const DEFAULT_GUEST_COPILOT_IP_LIMIT = 5;
export const DEFAULT_GUEST_COPILOT_IP_WINDOW_SECONDS = 3600;
export const DEFAULT_GUEST_COPILOT_DAILY_CAP = 25;

// Determine if we have Upstash Redis access wired seamlessly via environment boundaries
const hasUpstashKeys = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

let ratelimit: Ratelimit | null = null;
let publicReadRatelimit: Ratelimit | null = null;
let guestIpRatelimit: Ratelimit | null = null;
let guestDailyRatelimit: Ratelimit | null = null;

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

  const ipLimit = process.env.GUEST_COPILOT_IP_LIMIT
    ? parseInt(process.env.GUEST_COPILOT_IP_LIMIT, 10)
    : DEFAULT_GUEST_COPILOT_IP_LIMIT;
  const dailyCap = process.env.GUEST_COPILOT_DAILY_CAP
    ? parseInt(process.env.GUEST_COPILOT_DAILY_CAP, 10)
    : DEFAULT_GUEST_COPILOT_DAILY_CAP;

  guestIpRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(ipLimit, `${DEFAULT_GUEST_COPILOT_IP_WINDOW_SECONDS} s`),
    prefix: "appforge:guest_copilot_ip",
  });

  guestDailyRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(dailyCap, "86400 s"),
    prefix: "appforge:guest_copilot_daily",
  });
}

// Fallback: Mock token bucket rate limiters for local IDE development and unit tests
const ipMap = new Map<string, { count: number; resetTime: number }>();
const publicReadIpMap = new Map<string, { count: number; resetTime: number }>();
const guestIpMap = new Map<string, { count: number; resetTime: number }>();
const guestDailyMap = new Map<string, { count: number; resetTime: number }>();

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

export type GuestLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  reason?: "ip_limit" | "global_daily_cap";
};

export async function checkGuestCopilotLimit(ip: string): Promise<GuestLimitResult> {
  const ipLimit = process.env.GUEST_COPILOT_IP_LIMIT
    ? parseInt(process.env.GUEST_COPILOT_IP_LIMIT, 10)
    : DEFAULT_GUEST_COPILOT_IP_LIMIT;
  const dailyCap = process.env.GUEST_COPILOT_DAILY_CAP
    ? parseInt(process.env.GUEST_COPILOT_DAILY_CAP, 10)
    : DEFAULT_GUEST_COPILOT_DAILY_CAP;

  // 1. Check Global Daily Cap across all logged-out users
  const dayKey = `global:${new Date().toISOString().slice(0, 10)}`;
  let dailyRes: { success: boolean; limit: number; remaining: number; reset: number };
  if (guestDailyRatelimit) {
    dailyRes = await guestDailyRatelimit.limit(dayKey);
  } else {
    dailyRes = limitInMemory(guestDailyMap, dayKey, dailyCap, 86400000);
  }

  if (!dailyRes.success) {
    return {
      success: false,
      limit: dailyCap,
      remaining: 0,
      reset: dailyRes.reset,
      reason: "global_daily_cap",
    };
  }

  // 2. Check Per-IP Limit (x-real-ip)
  let ipRes: { success: boolean; limit: number; remaining: number; reset: number };
  if (guestIpRatelimit) {
    ipRes = await guestIpRatelimit.limit(ip);
  } else {
    ipRes = limitInMemory(guestIpMap, ip, ipLimit, DEFAULT_GUEST_COPILOT_IP_WINDOW_SECONDS * 1000);
  }

  if (!ipRes.success) {
    return {
      success: false,
      limit: ipLimit,
      remaining: 0,
      reset: ipRes.reset,
      reason: "ip_limit",
    };
  }

  return {
    success: true,
    limit: ipLimit,
    remaining: ipRes.remaining,
    reset: ipRes.reset,
  };
}

export function resetGuestCopilotLimitsForTesting() {
  guestDailyMap.clear();
  guestIpMap.clear();
}
