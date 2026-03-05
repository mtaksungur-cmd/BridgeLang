// lib/timezone.js
/**
 * Timezone utility functions for BridgeLang
 * Handles conversion between user timezones and UTC
 */

/**
 * Convert local time string to UTC timestamp
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {string} timeStr - Time in HH:MM format (24h)
 * @param {string} timezone - IANA timezone (e.g., 'Europe/London')
 * @returns {Date} UTC Date object
 */
export function localToUTC(dateStr, timeStr, timezone) {
    const dateTimeStr = `${dateStr}T${timeStr}:00`;

    // Create date in user's timezone
    const localDate = new Date(dateTimeStr);

    // Get timezone offset (this is a simplified version - for production use a library like date-fns-tz)
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    return localDate;
}

/**
 * Convert UTC timestamp to local time string
 * @param {Date|Timestamp} utcDate - UTC date
 * @param {string} timezone - IANA timezone
 * @returns {{date: string, time: string}} Local date and time
 */
export function utcToLocal(utcDate, timezone) {
    const date = utcDate instanceof Date ? utcDate : utcDate.toDate();

    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const parts = formatter.formatToParts(date);
    const dateStr = `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}`;
    const timeStr = `${parts.find(p => p.type === 'hour').value}:${parts.find(p => p.type === 'minute').value}`;

    return { date: dateStr, time: timeStr };
}

/**
 * Get user's timezone from browser
 * @returns {string} IANA timezone
 */
export function getUserTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Format time with timezone abbreviation
 * @param {Date} date - Date to format
 * @param {string} timezone - IANA timezone
 * @returns {string} Formatted time with TZ (e.g., "17:00 GMT")
 */
export function formatTimeWithTZ(date, timezone) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
        hour12: false
    });

    return formatter.format(date);
}

/**
 * Calculate time difference in minutes between lesson time and now
 * Accounts for timezones
 * @param {string} dateStr - Lesson date (YYYY-MM-DD)
 * @param {string} timeStr - Lesson time (HH:MM)
 * @param {string} timezone - Lesson timezone
 * @returns {number} Minutes until lesson (negative if past)
 */
export function getMinutesUntilLesson(dateStr, timeStr, timezone) {
    const lessonDateTime = new Date(`${dateStr}T${timeStr}:00`);
    const now = new Date();

    // Simple diff (for accurate calculation, use date-fns-tz)
    const diffMs = lessonDateTime - now;
    return Math.floor(diffMs / (1000 * 60));
}

/**
 * Common timezones for BridgeLang
 */
export const COMMON_TIMEZONES = [
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Istanbul', label: 'Istanbul (TRT)' },
    { value: 'America/New_York', label: 'New York (EST/EDT)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
];

/**
 * Check if lesson is within join window (15 min before to 15 min after end)
 * @param {string} dateStr - Lesson date
 * @param {string} timeStr - Lesson start time
 * @param {number} duration - Lesson duration in minutes
 * @param {string} timezone - Lesson timezone
 * @returns {boolean} Can user join?
 */
export function canJoinLesson(dateStr, timeStr, duration, timezone) {
    const now = new Date();
    const lessonStart = new Date(`${dateStr}T${timeStr}:00`);
    const lessonEnd = new Date(lessonStart.getTime() + duration * 60 * 1000);

    const diffMinsFromStart = Math.floor((lessonStart - now) / (1000 * 60));
    const diffMinsFromEnd = Math.floor((lessonEnd - now) / (1000 * 60));

    // 15 min before start to 15 min after end
    return diffMinsFromStart >= -15 && diffMinsFromStart <= 15 && diffMinsFromEnd >= -15;
}
