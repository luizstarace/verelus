// Cloudflare Workers/Pages runtime disallows setInterval in global scope,
// so expired entries are cleaned opportunistically inside rateLimit().
const rateMap = new Map<string, { count: number; resetAt: number }>();
const MAX_ENTRIES = 10000;

export function rateLimit(
  ip: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    if (rateMap.size >= MAX_ENTRIES) {
      for (const [k, v] of rateMap) {
        if (now > v.resetAt) rateMap.delete(k);
      }
    }
    rateMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  entry.count++;
  if (entry.count > limit) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: limit - entry.count };
}

export function getRateLimitHeaders(remaining: number, limit: number) {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(Math.max(0, remaining)),
  };
}
