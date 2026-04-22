const rateMap = new Map<string, { count: number; resetAt: number }>();

// Clean expired entries periodically
setInterval(() => {
  const now = Date.now();
  rateMap.forEach((val, key) => {
    if (now > val.resetAt) rateMap.delete(key);
  });
}, 60000);

export function rateLimit(
  ip: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const key = ip;
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
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
