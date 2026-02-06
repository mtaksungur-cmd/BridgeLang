// lib/notificationScheduler.js
/**
 * Notification Scheduler
 * Schedules email reminders for upcoming lessons
 */

import { adminDb } from './firebaseAdmin';
import { DateTime } from 'luxon';

export async function scheduleReminders(bookingId, bookingData) {
    try {
        const { date, startTime, timezone = 'Europe/London', duration = 60 } = bookingData;

        // Parse lesson date/time in the specified timezone
        const lessonDateTime = DateTime.fromISO(`${date}T${startTime}:00`, {
            zone: timezone
        });

        console.log('📅 Scheduling reminders for:', {
            bookingId,
            lessonDateTime: lessonDateTime.toISO(),
            timezone
        });

        // Calculate reminder times
        const reminder24h = lessonDateTime.minus({ hours: 24 });
        const reminder1h = lessonDateTime.minus({ hours: 1 });
        const reminder15m = lessonDateTime.minus({ minutes: 15 });

        const now = DateTime.now();

        // Only schedule if reminder time is in the future
        const reminders = [];

        if (reminder24h > now) {
            reminders.push({
                type: '24h_reminder',
                scheduledFor: reminder24h.toISO()
            });
        }

        if (reminder1h > now) {
            reminders.push({
                type: '1h_reminder',
                scheduledFor: reminder1h.toISO()
            });
        }

        if (reminder15m > now) {
            reminders.push({
                type: '15m_reminder',
                scheduledFor: reminder15m.toISO()
            });
        }

        // Create scheduled notifications
        const batch = adminDb.batch();

        for (const reminder of reminders) {
            const notifRef = adminDb.collection('scheduledNotifications').doc();
            batch.set(notifRef, {
                bookingId,
                type: reminder.type,
                scheduledFor: reminder.scheduledFor,
                status: 'pending',
                createdAt: now.toISO(),
                studentId: bookingData.studentId,
                teacherId: bookingData.teacherId
            });
        }

        await batch.commit();

        console.log(`✅ Scheduled ${reminders.length} reminders for booking ${bookingId}`);

        return { success: true, count: reminders.length };

    } catch (error) {
        console.error('Error scheduling reminders:', error);
        throw error;
    }
}

export async function cancelReminders(bookingId) {
    try {
        // Delete all pending reminders for this booking
        const reminders = await adminDb.collection('scheduledNotifications')
            .where('bookingId', '==', bookingId)
            .where('status', '==', 'pending')
            .get();

        const batch = adminDb.batch();

        reminders.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        console.log(`🗑️ Cancelled ${reminders.size} reminders for booking ${bookingId}`);

        return { success: true, count: reminders.size };

    } catch (error) {
        console.error('Error cancelling reminders:', error);
        throw error;
    }
}
