// pages/api/student/progress.js
/**
 * Student Progress Stats API
 * Returns learning analytics and progress metrics
 */

import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();

    const { studentId } = req.query;

    if (!studentId) {
        return res.status(400).json({ error: 'Missing studentId' });
    }

    try {
        // Get all bookings for this student
        const bookingsSnapshot = await adminDb.collection('bookings')
            .where('studentId', '==', studentId)
            .orderBy('createdAt', 'desc')
            .get();

        // Calculate stats
        let totalLessons = 0;
        let completedLessons = 0;
        let upcomingLessons = 0;
        let totalHours = 0;
        let totalSpent = 0;

        const teacherCounts = {}; // { teacherId: count }
        const monthlyLessons = {}; // { '2026-02': 5 }
        const lessonDates = [];

        bookingsSnapshot.docs.forEach(doc => {
            const booking = doc.data();

            totalLessons++;

            // Count by status
            if (booking.status === 'completed') {
                completedLessons++;
                totalHours += (booking.duration || 60) / 60; // Convert minutes to hours
                totalSpent += booking.amountPaid || 0;
            } else if (booking.status === 'confirmed' || booking.status === 'pending') {
                upcomingLessons++;
            }

            // Track favorite teachers
            if (booking.teacherId) {
                teacherCounts[booking.teacherId] = (teacherCounts[booking.teacherId] || 0) + 1;
            }

            // Monthly breakdown
            if (booking.createdAt) {
                const date = booking.createdAt.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthlyLessons[monthKey] = (monthlyLessons[monthKey] || 0) + 1;

                // For streak calculation
                if (booking.status === 'completed' && booking.date) {
                    lessonDates.push(new Date(booking.date));
                }
            }
        });

        // Calculate learning streak
        const streak = calculateStreak(lessonDates);

        // Find favorite teachers (top 3)
        const favoriteTeachers = Object.entries(teacherCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([teacherId, count]) => ({
                teacherId,
                lessonCount: count
            }));

        // Get teacher details
        const teachersWithDetails = await Promise.all(
            favoriteTeachers.map(async (fav) => {
                try {
                    const teacherDoc = await adminDb.collection('users').doc(fav.teacherId).get();
                    const teacher = teacherDoc.data() || {};
                    return {
                        id: fav.teacherId,
                        name: teacher.name || 'Unknown',
                        photo: teacher.profilePhoto || null,
                        lessonCount: fav.lessonCount
                    };
                } catch {
                    return {
                        id: fav.teacherId,
                        name: 'Unknown',
                        photo: null,
                        lessonCount: fav.lessonCount
                    };
                }
            })
        );

        // Format monthly data for chart
        const monthlyData = Object.entries(monthlyLessons)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([month, count]) => ({
                month,
                count
            }));

        const stats = {
            totalLessons,
            completedLessons,
            upcomingLessons,
            totalHours: Number(totalHours.toFixed(1)),
            totalSpent: Number(totalSpent.toFixed(2)),
            learningStreak: streak,
            favoriteTeachers: teachersWithDetails,
            monthlyLessons: monthlyData,
            averagePerMonth: monthlyData.length > 0
                ? Number((totalLessons / monthlyData.length).toFixed(1))
                : 0
        };

        return res.status(200).json(stats);

    } catch (error) {
        console.error('Progress API error:', error);
        return res.status(500).json({ error: 'Failed to fetch progress' });
    }
}

// Calculate learning streak (consecutive days with lessons)
function calculateStreak(lessonDates) {
    if (lessonDates.length === 0) return 0;

    // Sort dates descending (most recent first)
    const sortedDates = lessonDates
        .map(d => new Date(d).setHours(0, 0, 0, 0))
        .sort((a, b) => b - a);

    // Remove duplicates (same day)
    const uniqueDates = [...new Set(sortedDates)];

    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = today - 86400000; // 24 hours in ms

    // Must have lesson today or yesterday to have active streak
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
        return 0;
    }

    let streak = 0;
    let currentDate = uniqueDates[0];

    for (let i = 0; i < uniqueDates.length; i++) {
        const lessonDate = uniqueDates[i];

        if (lessonDate === currentDate || lessonDate === currentDate - 86400000) {
            streak++;
            currentDate = lessonDate - 86400000; // Move to previous day
        } else {
            break; // Streak broken
        }
    }

    return streak;
}
