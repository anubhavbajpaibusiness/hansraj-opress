import { redis } from './redis.js';

export function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
}

// Returns true while the caller is under the limit. Fails open if Redis hiccups.
export async function allow(key, limit, windowSec) {
  try {
    const n = await redis.incr(key);
    if (n === 1) await redis.expire(key, windowSec);
    return n <= limit;
  } catch {
    return true;
  }
}
