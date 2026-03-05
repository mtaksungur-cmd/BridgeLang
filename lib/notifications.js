// lib/notifications.js
/**
 * In-App Notification Helpers
 * Create and manage user notifications
 */

import { adminDb } from './firebaseAdmin';
import { DateTime } from 'luxon';

/**
 * Create an in-app notification
 */
export async function createNotification({
    userId,
    type,
    title,
    message,
    actionUrl = null,
    metadata = {}
}) {
    try {
        const now = DateTime.now();
        const expiresAt = now.plus({ days: 7 }); // Auto-expire after 7 days

        const notification = {
            userId,
            type,
            title,
            message,
            actionUrl,
            metadata,
            read: false,
            createdAt: now.toISO(),
            expiresAt: expiresAt.toISO()
        };

        const ref = await adminDb.collection('notifications').add(notification);

        console.log(`✅ Notification created for user ${userId}:`, title);

        return { success: true, id: ref.id };

    } catch (error) {
        console.error('Failed to create notification:', error);
        throw error;
    }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId) {
    try {
        await adminDb.collection('notifications').doc(notificationId).update({
            read: true,
            readAt: DateTime.now().toISO()
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
        throw error;
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId) {
    try {
        const notifications = await adminDb.collection('notifications')
            .where('userId', '==', userId)
            .where('read', '==', false)
            .get();

        const batch = adminDb.batch();

        notifications.docs.forEach(doc => {
            batch.update(doc.ref, {
                read: true,
                readAt: DateTime.now().toISO()
            });
        });

        await batch.commit();

        console.log(`✅ Marked ${notifications.size} notifications as read for user ${userId}`);

        return { success: true, count: notifications.size };
    } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
        throw error;
    }
}

/**
 * Delete old (expired) notifications
 * Should be called via cron job
 */
export async function deleteExpiredNotifications() {
    try {
        const now = DateTime.now().toISO();

        const expired = await adminDb.collection('notifications')
            .where('expiresAt', '<=', now)
            .limit(100)
            .get();

        const batch = adminDb.batch();

        expired.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        console.log(`🗑️ Deleted ${expired.size} expired notifications`);

        return { success: true, count: expired.size };
    } catch (error) {
        console.error('Failed to delete expired notifications:', error);
        throw error;
    }
}

// Notification type helpers

export async function notifyPaymentReceived({ userId, amount, bookingId }) {
    return createNotification({
        userId,
        type: 'payment_received',
        title: 'Payment Transferred',
        message: `£${amount.toFixed(2)} has been transferred to your account`,
        actionUrl: '/teacher/earnings',
        metadata: { bookingId, amount }
    });
}

export async function notifyLessonReminder({ userId, teacherName, date, startTime, bookingId }) {
    return createNotification({
        userId,
        type: 'lesson_reminder',
        title: 'Lesson Tomorrow',
        message: `Your lesson with ${teacherName} is tomorrow at ${startTime}`,
        actionUrl: '/student/dashboard',
        metadata: { bookingId, date, startTime }
    });
}

export async function notifyBookingConfirmed({ userId, teacherName, date, startTime, bookingId }) {
    return createNotification({
        userId,
        type: 'booking_confirmed',
        title: 'Booking Confirmed',
        message: `Your lesson with ${teacherName} on ${date} at ${startTime} is confirmed`,
        actionUrl: '/student/dashboard',
        metadata: { bookingId, date, startTime }
    });
}

export async function notifyReviewReceived({ userId, studentName, rating, bookingId }) {
    return createNotification({
        userId,
        type: 'review_received',
        title: 'New Review',
        message: `${studentName} left you a ${rating}⭐ review`,
        actionUrl: '/teacher/profile',
        metadata: { bookingId, rating }
    });
}

export async function notifyRescheduleRequest({ userId, requesterName, newDate, newTime, bookingId }) {
    return createNotification({
        userId,
        type: 'reschedule_request',
        title: 'Reschedule Request',
        message: `${requesterName} wants to reschedule to ${newDate} at ${newTime}`,
        actionUrl: '/teacher/lessons',
        metadata: { bookingId, newDate, newTime }
    });
}
