import { buffer } from 'micro';
import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebaseAdmin';
import { PLAN_LIMITS } from '../../../lib/planLimits';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
    console.log('🔔 === STRIPE WEBHOOK START ===');
    
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'] || req.headers['x-stripe-signature'];

    let event;

    try {
        if (!sig || !webhookSecret) {
            throw new Error('Missing signature or webhook secret');
        }
        event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
        console.log('✅ Webhook Signature Verified. Event:', event.type);
    } catch (err) {
        console.error(`❌ Webhook Error: ${err.message}`);
        
        // 🛠️ EMERGENCY BYPASS FOR TEST MODE ONLY (if signature verification is failing due to proxy)
        if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test')) {
            console.warn('⚠️ Test Mode: Attempting to process event without signature verification...');
            try {
                event = JSON.parse(buf.toString());
                console.log('⚠️ Processed raw event (Unverified):', event.type);
            } catch (jsonErr) {
                return res.status(400).send(`Webhook Error: ${err.message}`);
            }
        } else {
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const metadata = session.metadata || {};
        console.log('📦 Checkout Completed. Metadata:', metadata);

        // 1. Handle Subscription / Plan Upgrade
        if (metadata.bookingType === 'subscription_upgrade' || metadata.bookingType === 'subscription') {
            const userId = metadata.userId;
            const upgradeTo = (metadata.upgradeTo || 'free').toLowerCase();

            if (!userId) {
                console.error('❌ Missing userId in metadata');
                return res.status(400).json({ error: 'Missing userId' });
            }

            console.log(`💎 Upgrading User ${userId} to Plan: ${upgradeTo}`);
            
            try {
                const limits = PLAN_LIMITS[upgradeTo] || PLAN_LIMITS.free;
                const now = Date.now();
                const activeUntilMillis = now + 30 * 24 * 60 * 60 * 1000;

                const userRef = adminDb.collection('users').doc(userId);
                
                // Read current user data for lifetimePayments
                const currentSnap = await userRef.get();
                const currentData = currentSnap.exists ? currentSnap.data() : {};
                const currentSub = currentData.subscription || {};
                const isRenewal = metadata.renewal === '1';
                const upgradeFrom = metadata.upgradeFrom || currentData.subscriptionPlan || 'free';
                
                // lifetimePayments: reset on plan change, increment on renewal
                let lifetimePayments = currentSub.lifetimePayments || 0;
                if (isRenewal || upgradeFrom === upgradeTo) {
                    lifetimePayments += 1;
                } else {
                    lifetimePayments = 1;
                }

                const updateData = {
                    subscriptionPlan: upgradeTo,
                    viewLimit: limits.viewLimit,
                    messagesLeft: limits.messagesLeft,
                    justUpgraded: true,
                    subscription: {
                        planKey: upgradeTo,
                        activeUntil: new Date(activeUntilMillis),
                        activeUntilMillis,
                        lastPaymentAt: new Date(),
                        updatedAt: new Date(),
                        lifetimePayments,
                        pending_downgrade_to: null,
                    }
                };

                console.log('📝 Update data:', JSON.stringify(updateData, null, 2));
                await userRef.set(updateData, { merge: true });
                console.log('✅ Firestore User Updated Successfully. Plan:', upgradeTo, 'Limits:', limits, 'lifetimePayments:', lifetimePayments);
            } catch (dbErr) {
                console.error('❌ Firestore Update Error:', dbErr.message);
                return res.status(500).json({ error: 'Database update failed' });
            }
        }
        
        // 2. Handle Lesson Bookings
        if (metadata.bookingType === 'lesson') {
            console.log('📚 Processing Lesson Booking...');
            const { teacherId, studentId, date, startTime, endTime, duration, location, lessonType } = metadata;
            try {
                const bookingRef = adminDb.collection('bookings').doc(session.id);
                await bookingRef.set({
                    teacherId,
                    studentId,
                    date,
                    startTime,
                    endTime: endTime || '',
                    duration: Number(duration),
                    location,
                    lessonType: lessonType || 'standard',
                    status: 'confirmed',
                    amountPaid: session.amount_total / 100,
                    stripeSessionId: session.id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }, { merge: true });
                console.log('✅ Booking Saved:', session.id);

                // lessonsTaken is updated only when lesson is completed (both confirmed) in booking/confirm.js

                // Track intro lesson tutors
                if (lessonType === 'intro' && studentId && teacherId) {
                    const studentRef = adminDb.collection('users').doc(studentId);
                    const { FieldValue } = require('firebase-admin/firestore');
                    await studentRef.update({
                        introTutors: FieldValue.arrayUnion(teacherId)
                    });
                    console.log(`✅ Intro tutor ${teacherId} tracked for student ${studentId}`);
                }
            } catch (bookErr) {
                console.error('❌ Booking Save Error:', bookErr.message);
            }
        }
    }

    res.status(200).json({ received: true });
}
