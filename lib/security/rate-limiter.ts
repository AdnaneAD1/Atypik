// lib/security/rate-limiter.ts
import { NextResponse } from 'next/server';

interface RateLimitConfig {
  maxRequests: number; // Max allowed requests in interval
  windowMs: number;    // Window size in milliseconds
}

interface ClientRecord {
  timestamps: number[];
}

const clientStore = new Map<string, ClientRecord>();

// Cleanup stale clients periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    clientStore.forEach((record, key) => {
      record.timestamps = record.timestamps.filter(t => now - t < 600000);
      if (record.timestamps.length === 0) {
        clientStore.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; response: NextResponse };

export function checkRateLimit(req: Request, config: RateLimitConfig = { maxRequests: 30, windowMs: 60 * 1000 }): RateLimitResult {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || realIp || '127.0.0.1';

  const now = Date.now();
  let client = clientStore.get(clientIp);

  if (!client) {
    client = { timestamps: [] };
    clientStore.set(clientIp, client);
  }

  // Retain only timestamps within the sliding window
  client.timestamps = client.timestamps.filter(t => now - t < config.windowMs);

  if (client.timestamps.length >= config.maxRequests) {
    const oldestTimestamp = client.timestamps[0];
    const retryAfter = Math.ceil((config.windowMs - (now - oldestTimestamp)) / 1000);
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'Trop de requêtes. Veuillez réessayer ultérieurement.',
          retryAfterSeconds: retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
          },
        }
      ),
    };
  }

  client.timestamps.push(now);
  return { allowed: true };
}
