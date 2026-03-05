import { buffer } from 'micro';
import Stripe from 'stripe';
import { adminDb } from '../../lib/firebaseAdmin';
import { PLAN_LIMITS } from '../../lib/planLimits';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
    console.log('🔔 === V1 WEBHOOK START ===');
    
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'] || req.headers['x-stripe-signature'];

    let event;

    if (!sig || !webhookSecret) {
        console.error('❌ V1 Webhook: Missing Stripe-Signature header or STRIPE_WEBHOOK_SECRET env var');
        return res.status(400).send('Webhook Error: Missing signature or webhook secret');
    }

    try {
        event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
        console.log('✅ V1 Webhook Signature Verified. Event:', event.type);
    } catch (err) {
        console.error(`❌ V1 Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const metadata = session.metadata || {};

        if (metadata.bookingType === 'subscription_upgrade' || metadata.bookingType === 'subscription') {
            const userId = metadata.userId;
            const upgradeTo = (metadata.upgradeTo || 'free').toLowerCase();

            if (!userId) {
                console.error('❌ V1 Webhook: Missing userId in metadata');
                return res.status(400).json({ error: 'Missing userId' });
            }

            try {
                const limits = PLAN_LIMITS[upgradeTo] || PLAN_LIMITS.free;
                const now = Date.now();
                const activeUntilMillis = now + 30 * 24 * 60 * 60 * 1000;

                const userRef = adminDb.collection('users').doc(userId);
                const currentSnap = await userRef.get();
                const currentData = currentSnap.exists ? currentSnap.data() : {};
                const currentSub = currentData.subscription || {};
                const isRenewal = metadata.renewal === '1';
                const upgradeFrom = metadata.upgradeFrom || currentData.subscriptionPlan || 'free';

                let lifetimePayments = currentSub.lifetimePayments || 0;
                if (isRenewal || upgradeFrom === upgradeTo) {
                    lifetimePayments += 1;
                } else {
                    lifetimePayments = 1;
                }

                await userRef.set({
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
                }, { merge: true });
                console.log(`✅ V1 Webhook: User ${userId} upgraded to ${upgradeTo}, limits:`, limits);
            } catch (dbErr) {
                console.error('❌ V1 Webhook Firestore Error:', dbErr.message);
                return res.status(500).json({ error: 'Database update failed' });
            }
        }

        // Handle lesson bookings
        if (metadata.bookingType === 'lesson') {
            const { teacherId, studentId, date, startTime, endTime, duration, location, lessonType } = metadata;
            try {
                await adminDb.collection('bookings').doc(session.id).set({
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
                console.log('✅ V1 Webhook: Booking saved:', session.id);
            } catch (bookErr) {
                console.error('❌ V1 Webhook Booking Error:', bookErr.message);
            }
        }
    }

    res.status(200).json({ received: true });
}
