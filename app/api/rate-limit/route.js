// app/api/rate-limit/route.js - Server-side rate limiting
import { NextResponse } from 'next/server';

// In-memory store (use Redis in production)
const attempts = new Map();
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

// Cleanup old entries periodically
let cleanupTimer;
if (!cleanupTimer) {
    cleanupTimer = setInterval(() => {
        const now = Date.now();
        for (const [key, value] of attempts.entries()) {
            if (value.lastAttempt < now - (60 * 60 * 1000)) {
                attempts.delete(key);
            }
        }
    }, CLEANUP_INTERVAL);
}

function getClientIP(request) {
    return request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'unknown';
}

export async function POST(request) {
    try {
        const { identifier } = await request.json();
        const ip = getClientIP(request);
        const key = `${ip}:${identifier}`;
        const now = Date.now();
        const windowStart = now - RATE_LIMIT_WINDOW;

        const tokenAttempts = attempts.get(key);

        if (tokenAttempts && tokenAttempts.lastAttempt < windowStart) {
            attempts.delete(key);
        }

        const currentAttempts = attempts.get(key) || {
            count: 0,
            lastAttempt: now,
            windowStart: now
        };

        if (currentAttempts.lastAttempt < windowStart) {
            currentAttempts.count = 0;
            currentAttempts.windowStart = now;
        }

        currentAttempts.count++;
        currentAttempts.lastAttempt = now;
        attempts.set(key, currentAttempts);

        if (currentAttempts.count > MAX_ATTEMPTS) {
            return NextResponse.json(
                {
                    allowed: false,
                    message: 'تم تجاوز عدد المحاولات المسموحة',
                    resetTime: currentAttempts.windowStart + RATE_LIMIT_WINDOW
                },
                { status: 429 }
            );
        }

        return NextResponse.json({
            allowed: true,
            remaining: MAX_ATTEMPTS - currentAttempts.count
        });

    } catch (error) {
        console.error('Rate limit check failed:', error);
        return NextResponse.json(
            { allowed: true }, // Fail open
            { status: 200 }
        );
    }
}