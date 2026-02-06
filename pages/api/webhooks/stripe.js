// pages/api/webhooks/stripe.js - UPDATE to grant unlimited messaging after first lesson
import { buffer } from 'micro';
import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebaseAdmin';
import { sendBookingConfirmation } from '../../../lib/emailService';
import { scheduleReminders } from '../../../lib/notificationScheduler';
import { getBookingConfirmationEmail } from '../../../lib/reminderTemplates';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
    console.log('🔔 === WEBHOOK RECEIVED ===');
    console.log('Method:', req.method);
    console.log('Headers:', req.headers['stripe-signature'] ? 'Signature present' : 'NO SIGNATURE');

    if (req.method !== 'POST') return res.status(405).end();

    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
        console.log('✅ Webhook signature verified');
        console.log('Event type:', event.type);
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        console.log('💳 Processing checkout.session.completed');
        const session = event.data.object;
        const metadata = session.metadata || {};
        console.log('Metadata:', metadata);

        if (metadata.bookingType === 'lesson') {
            console.log('📚 Creating lesson booking...');
            const { teacherId, studentId, date, startTime, endTime, duration, location, timezone, lessonType, discountLabel, discountPercent } = metadata;

            const bookingData = {
                teacherId,
                studentId,
                date,
                startTime,
                endTime: endTime || '',
                duration: Number(duration),
                location,
                timezone: timezone || '',
                lessonType: lessonType || 'standard',
                status: 'confirmed',
                paymentId: session.payment_intent,
                sessionId: session.id,
                amountPaid: session.amount_total / 100,
                discountLabel: discountLabel || 'No discount',
                discountPercent: Number(discountPercent || 0),
                createdAt: new Date(),
                teacherApproved: false,
                studentConfirmed: false,
                // ✅ PAYMENT HOLD (ESCROW)
                paymentHeld: true,  // Money held until lesson completion
                transferStatus: 'pending',  // pending | completed | failed
                transferId: null,
                teacherAmount: null,
                platformFee: null
            };

            console.log('💾 Saving booking to Firestore...');
            const bookingRef = await adminDb.collection('bookings').add(bookingData);
            console.log('✅ Booking created:', bookingRef.id);

            // ✨ PHASE 4: Schedule automated reminders
            try {
                await scheduleReminders(bookingRef.id, bookingData);
                console.log('✅ Automated reminders scheduled (24h/1h/15min)');
            } catch (error) {
                console.error('⚠️ Failed to schedule reminders:', error);
            }

            // ✨ PHASE 4: Send booking confirmation email
            try {
                const teacherRef = await adminDb.collection('users').doc(teacherId).get();
                const studentRef = await adminDb.collection('users').doc(studentId).get();
                const teacher = teacherRef.data() || {};
                const student = studentRef.data() || {};

                const confirmationEmail = getBookingConfirmationEmail({
                    studentName: student.name,
                    teacherName: teacher.name,
                    date,
                    startTime,
                    timezone: timezone || 'Europe/London',
                    duration: Number(duration),
                    amountPaid: session.amount_total / 100
                });

                const { sendMail } = require('../../../lib/mailer');
                await sendMail({
                    to: student.email,
                    subject: confirmationEmail.subject,
                    html: confirmationEmail.html
                });

                console.log('✅ Booking confirmation email sent to', student.email);

                // ✨ PHASE 4: Send in-app notification
                const { notifyBookingConfirmed } = require('../../../lib/notifications');
                await notifyBookingConfirmed({
                    userId: studentId,
                    teacherName: teacher.name,
                    date,
                    startTime,
                    bookingId: bookingRef.id
                });
                console.log('✅ In-app notification created');
            } catch (error) {
                console.error('⚠️ Failed to send confirmation email:', error);
            }

            // ✅ Log transaction
            await logTransaction({
                type: 'payment',
                bookingId: bookingRef.id,
                userId: studentId,
                amount: session.amount_total / 100,
                currency: 'GBP',
                stripeId: session.payment_intent,
                status: 'success',
                metadata: {
                    teacherId: teacherId,
                    date: date,
                    lessonType: lessonType
                }
            });

            // Track intro lesson
            if (lessonType === 'intro') {
                const studentRef = adminDb.collection('users').doc(studentId);
                await studentRef.update({
                    introTutors: adminDb.FieldValue.arrayUnion(teacherId),
                });
                console.log('✅ Intro lesson tracked');
            }

            // 🆕 PHASE 4: Grant unlimited messaging after FIRST lesson completion
            const studentRef = adminDb.collection('users').doc(studentId);
            const studentSnap = await studentRef.get();
            const studentData = studentSnap.exists ? studentSnap.data() : {};

            const completedLessonsSnap = await adminDb.collection('bookings')
                .where('studentId', '==', studentId)
                .where('status', '==', 'approved')
                .get();

            const completedCount = completedLessonsSnap.size;

            // If this is their 1st approved lesson, grant unlimited messaging with this teacher
            if (completedCount === 1) {
                const messagesAfterLesson = studentData.messagesAfterLesson || {};
                messagesAfterLesson[teacherId] = true;

                await studentRef.update({
                    messagesAfterLesson: messagesAfterLesson
                });

                console.log(`✉️ Granted unlimited messaging: ${studentId} ↔ ${teacherId}`);
            }

            // Mark review coupon as used if applicable
            if (metadata.coupon_code) {
                const reviewCoupon = studentData.reviewCoupon;
                if (reviewCoupon && reviewCoupon.promoCode === metadata.coupon_code && !reviewCoupon.usedOn) {
                    await studentRef.update({
                        'reviewCoupon.usedOn': bookingRef.id,
                        'reviewCoupon.usedAt': new Date()
                    });
                    console.log(`🎁 Review coupon used: ${metadata.coupon_code}`);
                }
            }

            // Send confirmation email to student
            try {
                console.log('📧 Sending confirmation email...');
                const studentSnap = await adminDb.collection('users').doc(studentId).get();
                const teacherSnap = await adminDb.collection('users').doc(teacherId).get();

                if (studentSnap.exists && teacherSnap.exists) {
                    const studentData = studentSnap.data();
                    const teacherData = teacherSnap.data();

                    await sendBookingConfirmation({
                        to: studentData.email,
                        userName: studentData.name || studentData.email,
                        teacherName: teacherData.name || 'Your Teacher',
                        lessonDate: new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
                        lessonTime: startTime,
                        duration: Number(duration),
                        location: location,
                        price: (session.amount_total / 100).toFixed(2),
                        bookingId: bookingRef.id,
                    });
                    console.log(`✅ Booking confirmation email sent to ${studentData.email}`);
                }
            } catch (emailError) {
                console.error('❌ Failed to send booking confirmation email:', emailError);
                // Don't fail the webhook if email fails
            }

            // 🎥 Create Daily.co video room for online lessons
            if (location.toLowerCase() === 'online') {
                try {
                    console.log('🎥 Creating video room for online lesson...');
                    const axios = require('axios');
                    const DAILY_API_KEY = process.env.DAILY_API_KEY;

                    if (DAILY_API_KEY) {
                        const response = await axios.post('https://api.daily.co/v1/rooms', {
                            name: `lesson-${bookingRef.id}`,
                            privacy: 'public',  // Changed from 'private' to allow access without tokens
                            properties: {
                                exp: Math.floor(Date.now() / 1000) + (Number(duration) * 60) + 3600,
                                enable_chat: true,
                                enable_screenshare: true,
                                enable_recording: false,  // Recordings can be enabled later
                                max_participants: 2,
                                // Only teacher and student can join (enforced by room name uniqueness)
                                enable_knocking: false,  // Direct entry
                                start_audio_off: false,
                                start_video_off: false
                            }
                        }, {
                            headers: {
                                'Authorization': `Bearer ${DAILY_API_KEY}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        const roomUrl = response.data.url;
                        await bookingRef.update({
                            meetingLink: roomUrl,
                            videoProvider: 'daily.co',
                            roomCreatedAt: new Date().toISOString()
                        });
                        console.log(`✅ Video room created: ${roomUrl}`);
                    } else {
                        console.warn('⚠️ DAILY_API_KEY not configured - skipping video room');
                    }
                } catch (videoError) {
                    console.error('🎥 Video room error (non-critical):', videoError.message);
                }
            }

            console.log('🔔 === WEBHOOK SUCCESS - BOOKING CREATED ===');
        } else if (metadata.bookingType === 'subscription' || metadata.bookingType === 'subscription_upgrade') {
            console.log('💎 Processing subscription payment...');
            const { userId, upgradeTo, payable, renewal, viewLimit, messagesLeft } = metadata;

            if (!userId || !upgradeTo) {
                console.error('❌ Missing subscription metadata');
                return res.status(400).json({ error: 'Invalid subscription metadata' });
            }

            console.log('💾 Updating user subscription plan...');
            const now = Date.now();
            const activeUntilMillis = now + 30 * 24 * 60 * 60 * 1000; // 30 days from now

            const ref = adminDb.collection('users').doc(userId);
            const snap = await ref.get();
            const userData = snap.exists ? snap.data() : {};
            const currentSub = userData.subscription || {};

            const updateData = {
                subscriptionPlan: upgradeTo, // 'starter', 'pro', 'vip'
                viewLimit: Number(viewLimit) || 30,
                messagesLeft: Number(messagesLeft) || 10,
                justUpgraded: true, // 🎉 Trigger welcome banner
                subscription: {
                    planKey: upgradeTo,
                    activeUntil: new Date(activeUntilMillis),
                    activeUntilMillis,
                    lastPaymentAt: new Date(),
                    lifetimePayments: renewal === '1' ? (currentSub.lifetimePayments || 0) + 1 : 1,
                    pending_downgrade_to: null,
                },
            };

            await ref.update(updateData);
            console.log(`✅ User ${userId} upgraded to ${upgradeTo} plan`);

            // Send subscription confirmation email
            try {
                if (userData.email) {
                    console.log(`📧 Subscription confirmation for ${userData.email}`);
                    // TODO: Send subscription confirmation email with benefits
                }
            } catch (emailError) {
                console.error('❌ Failed to send subscription email:', emailError);
            }

            console.log('🔔 === WEBHOOK SUCCESS - SUBSCRIPTION UPDATED ===');
        } else {
            console.log('⚠️ Unknown booking type:', metadata.bookingType);
        }
    } else {
        console.log('⚠️ Not checkout.session.completed, ignoring');
    }

    res.status(200).json({ received: true });
}
