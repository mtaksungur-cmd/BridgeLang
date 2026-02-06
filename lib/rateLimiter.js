// lib/rateLimiter.js
/**
 * In-memory rate limiter (production: use Redis/Vercel KV)
 * Tracks requests per IP/user and enforces limits
 */

const rateLimitStore = new Map();

const LIMITS = {
    payment: { requests: 5, window: 60 * 1000 },      // 5 per minute
    booking: { requests: 10, window: 60 * 1000 },     // 10 per minute
    general: { requests: 100, window: 60 * 1000 },    // 100 per minute
    webhook: { requests: 200, window: 60 * 1000 },    // 200 per minute (Stripe)
};

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
        if (now - data.resetTime > 0) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

export async function rateLimit(identifier, type = 'general') {
    const limit = LIMITS[type];
    if (!limit) {
        console.warn('Unknown rate limit type:', type);
        return { allowed: true, remaining: 999, reset: 0 };
    }

    const key = `${type}:${identifier}`;
    const now = Date.now();

    let data = rateLimitStore.get(key);

    if (!data || now > data.resetTime) {
        // Create new or reset
        data = {
            count: 1,
            resetTime: now + limit.window
        };
        rateLimitStore.set(key, data);

        return {
            allowed: true,
            remaining: limit.requests - 1,
            reset: Math.ceil((data.resetTime - now) / 1000)
        };
    }

    // Increment count
    data.count++;

    if (data.count > limit.requests) {
        return {
            allowed: false,
            remaining: 0,
            reset: Math.ceil((data.resetTime - now) / 1000)
        };
    }

    return {
        allowed: true,
        remaining: limit.requests - data.count,
        reset: Math.ceil((data.resetTime - now) / 1000)
    };
}

export function getRateLimitHeaders(type, result) {
    const limit = LIMITS[type];
    return {
        'X-RateLimit-Limit': limit.requests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString()
    };
}

export function getIdentifier(req) {
    // Try to get user ID from session/auth
    const userId = req.userId || req.query.userId || req.body?.userId;
    if (userId) return `user:${userId}`;

    // Fall back to IP
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0] : req.connection?.remoteAddress || 'unknown';
    return `ip:${ip}`;
}
