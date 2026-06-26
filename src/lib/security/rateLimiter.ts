import logger from '@/lib/logger';

interface RateLimitConfig {
  
  maxRequests: number;
  
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60_000,
};

const requestStore = new Map<string, number[]>();

const CLEANUP_INTERVAL = 5 * 60_000;

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of requestStore.entries()) {
      const filtered = timestamps.filter((t) => now - t < DEFAULT_CONFIG.windowMs);
      if (filtered.length === 0) {
        requestStore.delete(key);
      } else {
        requestStore.set(key, filtered);
      }
    }
  }, CLEANUP_INTERVAL);
}

interface RateLimitResult {
  
  allowed: boolean;
  
  remaining: number;
  
  retryAfterSeconds?: number;
}

export function checkRateLimit(
  userId: string,
  config: RateLimitConfig = DEFAULT_CONFIG,
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const timestamps = (requestStore.get(userId) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= config.maxRequests) {
    
    const earliestInWindow = timestamps[0] ?? now;
    const retryAfterMs = earliestInWindow + config.windowMs - now;
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

    logger.warn(
      { userId, count: timestamps.length, limit: config.maxRequests },
      'Rate limit exceeded',
    );

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  timestamps.push(now);
  requestStore.set(userId, timestamps);

  return {
    allowed: true,
    remaining: config.maxRequests - timestamps.length,
  };
}

export function resetRateLimit(userId: string): void {
  requestStore.delete(userId);
}
