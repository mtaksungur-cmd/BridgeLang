// lib/sanitize.js
/**
 * Input sanitization utilities
 * Protects against XSS, injection, and malformed data
 */

export function sanitizeString(str, maxLength = 1000) {
    if (!str || typeof str !== 'string') return '';

    // Remove HTML tags
    let clean = str.replace(/<[^>]*>/g, '');

    // Remove potentially dangerous characters
    clean = clean.replace(/[<>'"]/g, '');

    // Trim whitespace
    clean = clean.trim();

    // Limit length
    if (clean.length > maxLength) {
        clean = clean.substring(0, maxLength);
    }

    return clean;
}

export function sanitizeEmail(email) {
    if (!email || typeof email !== 'string') return '';

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return '';

    return email.toLowerCase().trim();
}

export function sanitizeNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(num)) return null;
    if (num < min) return min;
    if (num > max) return max;

    return num;
}

export function sanitizeDate(dateStr) {
    if (!dateStr) return null;

    // Check format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) return null;

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    return dateStr;
}

export function sanitizeTime(timeStr) {
    if (!timeStr) return null;

    // Check format HH:MM
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(timeStr)) return null;

    return timeStr;
}

export function sanitizeBookingInput(data) {
    if (!data || typeof data !== 'object') {
        return { valid: false, errors: ['Invalid input data'] };
    }

    const errors = [];
    const sanitized = {};

    // Date
    sanitized.date = sanitizeDate(data.date);
    if (!sanitized.date) errors.push('Invalid date format (expected YYYY-MM-DD)');

    // Start time
    sanitized.startTime = sanitizeTime(data.startTime);
    if (!sanitized.startTime) errors.push('Invalid time format (expected HH:MM)');

    // Duration
    sanitized.duration = sanitizeNumber(data.duration, 30, 180);
    if (sanitized.duration === null) errors.push('Invalid duration (must be 30-180 minutes)');

    // Reason (optional)
    if (data.reason) {
        sanitized.reason = sanitizeString(data.reason, 500);
    }

    // Timezone (optional)
    if (data.timezone) {
        sanitized.timezone = sanitizeString(data.timezone, 50);
    }

    return {
        valid: errors.length === 0,
        data: sanitized,
        errors
    };
}

export function sanitizeUserInput(data) {
    if (!data || typeof data !== 'object') {
        return { valid: false, errors: ['Invalid input'] };
    }

    const errors = [];
    const sanitized = {};

    if (data.name) {
        sanitized.name = sanitizeString(data.name, 100);
        if (!sanitized.name) errors.push('Name is required');
    }

    if (data.email) {
        sanitized.email = sanitizeEmail(data.email);
        if (!sanitized.email) errors.push('Invalid email format');
    }

    if (data.bio) {
        sanitized.bio = sanitizeString(data.bio, 2000);
    }

    return {
        valid: errors.length === 0,
        data: sanitized,
        errors
    };
}
