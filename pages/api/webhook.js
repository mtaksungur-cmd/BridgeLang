import { buffer } from 'micro';
import Stripe from 'stripe';
import { adminDb } from '../../lib/firebaseAdmin';
import { DateTime } from 'luxon';
import { sendMail } from '../../lib/mailer';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

/* -------------------- Helpers -------------------- */
function toStartAtUtc({ date, startTime, timezone }) {
  try {
    const dt = DateTime.fromFormat(`${date} ${startTime}`, 'yyyy-MM-dd HH:mm', { zone: timezone || 'UTC' });
    return dt.isValid ? dt.toUTC().toMillis() : null;
  } catch {
    return null;
  }
}

async function createDailyRoom({ teacherId, date, startTime, durationMinutes, timezone }) {
  if (!process.env.DAILY_API_KEY) throw new Error('DAILY_API_KEY missing');
  const dt = DateTime.fromFormat(`${date} ${startTime}`, 'yyyy-MM-dd HH:mm', { zone: timezone || 'UTC' });
  const startSec = dt.toSeconds();
  const expSec = startSec + (durationMinutes || 60) * 60;

  const resp = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `lesson-${teacherId || 't'}-${Date.now()}`,
      properties: {
        nbf: Math.floor(startSec),
        exp: Math.floor(expSec),
        enable_screenshare: true,
        enable_chat: true,
      },
    }),
  });

  const data = await resp.json();
  if (!resp.ok || !data?.url)
    throw new Error(`Daily API error: ${data?.error || 'unknown'}`);
  return data.url;
}

/* -------------------- Limits -------------------- */
const PLAN_LIMITS = {
  free: { viewLimit: 10, messagesLeft: 3 },
  starter: { viewLimit: 30, messagesLeft: 8 },
  pro: { viewLimit: 60, messagesLeft: 20 },
  vip: { viewLimit: 9999, messagesLeft: 9999 },
};

/* -------------------- Sadakat bonusu oluşturucu -------------------- */
async function createLoyaltyLessonCoupon(plan, lifetime) {
  const percent = plan === 'vip' ? 20 : plan === 'pro' ? 10 : 0;
  if (!percent) return null;
  if (lifetime % 3 !== 0) return null;

  const coupon = await stripe.coupons.create({
    percent_off: percent,
    duration: 'once',
    name: `${plan.toUpperCase()} Loyalty — Payment #${lifetime}`,
  });
  const promo = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: `LOY-${plan}-${lifetime}-${Date.now().toString().slice(-5)}`,
    max_redemptions: 1,
  });
  return { code: promo.code, promoId: promo.id, percent };
}

/* -------------------- Handler -------------------- */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  /* -------------------------------------------------
   * ONE-OFF SUBSCRIPTION UPGRADE / RENEWALS
   * ------------------------------------------------- */
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const meta = session.metadata || {};

    /* 🔹 Plan ödemesi (abonelik yükseltme / yenileme) */
    if (meta.bookingType === 'subscription_upgrade') {
      const userId = meta.userId;
      const uref = adminDb.collection('users').doc(userId);
      const snap = await uref.get();
      const udata = snap.exists ? snap.data() : {};
      const sub = udata.subscription || {};

      const lifetime = (sub.lifetimePayments || 0) + 1;
      const plan = meta.upgradeTo;
      const base = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
      const now = Date.now();
      const nextMonth = now + 30 * 86400000;

      const updatedSub = {
        ...sub,
        planKey: plan,
        activeUntil: new Date(nextMonth),
        activeUntilMillis: nextMonth,
        lastPaymentAt: new Date(),
        lifetimePayments: lifetime,
        pending_downgrade_to: null,
      };

      let subscriptionCoupons = Array.isArray(udata.subscriptionCoupons)
        ? [...udata.subscriptionCoupons]
        : [];
      if (meta.vipAppliedCouponId) {
        subscriptionCoupons.push({
          code: meta.vipAppliedCouponId,
          percent: 10,
          type: 'subscription',
          source: 'vip-loyalty-auto',
          used: true,
          active: false,
          createdAt: new Date(),
          appliedOnPaymentNo: Number(meta.vipNextPaymentNo || lifetime),
        });
      }

      let lessonCoupons = Array.isArray(udata.lessonCoupons)
        ? [...udata.lessonCoupons]
        : [];
      const loyalty = await createLoyaltyLessonCoupon(plan, lifetime);
      if (loyalty) {
        lessonCoupons.push({
          code: loyalty.code,
          promoId: loyalty.promoId,
          percent: loyalty.percent,
          type: 'lesson',
          source: 'loyalty-3x',
          active: true,
          used: false,
          createdAt: new Date(),
          milestonePaymentNo: lifetime,
        });

        try {
          await sendMail({
            to: udata.email,
            subject: `🎁 ${plan.toUpperCase()} Loyalty Bonus — ${loyalty.percent}% Off`,
            html: `
              <p>Hi ${udata.name || 'there'},</p>
              <p>Congratulations! You've unlocked a <b>${loyalty.percent}% loyalty discount</b> for your next lesson booking.</p>
              <p>Your loyalty discount has been automatically applied and will appear during your next lesson payment.</p>
              <p>Keep learning with BridgeLang!</p>
            `,
          });
        } catch (e) {
          console.warn('⚠️ Loyalty email failed:', e.message);
        }
      }

      await uref.set(
        {
          subscriptionPlan: plan,
          viewLimit: base.viewLimit,
          messagesLeft: base.messagesLeft,
          subscription: updatedSub,
          subscriptionCoupons,
          lessonCoupons,
        },
        { merge: true }
      );

      /* 🔹 Fatura / makbuz e-postası */
      try {
        let receiptUrl = null;
        let invoiceNumber = null;

        if (session.invoice) {
          const invoice = await stripe.invoices.retrieve(session.invoice);
          receiptUrl = invoice?.hosted_invoice_url || invoice?.invoice_pdf || null;
          invoiceNumber = invoice?.number || null;
        }

        if (!receiptUrl && session.payment_intent) {
          const pi = await stripe.paymentIntents.retrieve(session.payment_intent, { expand: ['charges'] });
          const charge = pi?.charges?.data?.[0];
          receiptUrl = charge?.receipt_url || null;
        }

        const amount = (session.amount_total / 100).toFixed(2);
        const dateUk = DateTime.now().setZone('Europe/London').toFormat('dd/MM/yyyy HH:mm');

        await sendMail({
          to: udata.email,
          subject: `✅ ${plan.toUpperCase()} plan payment confirmed${invoiceNumber ? ` — Invoice ${invoiceNumber}` : ''}`,
          html: `
            <p>Hi ${udata.name || 'there'},</p>
            <p>Your <b>${plan.toUpperCase()}</b> plan payment was successful.</p>
            <p><b>Amount Paid:</b> £${amount}</p>
            <p><b>Date (UK Time):</b> ${dateUk}</p>
            ${
              receiptUrl
                ? `<p>You can view or download your ${invoiceNumber ? 'invoice' : 'receipt'} here:<br/>
                   <a href="${receiptUrl}" target="_blank" rel="noopener">${receiptUrl}</a></p>`
                : `<p>You will receive your receipt shortly.</p>`
            }
            <p>Thank you for choosing BridgeLang!</p>
          `,
        });
      } catch (e) {
        console.warn('⚠️ Subscription invoice email failed:', e.message);
      }

      console.log(`✅ Subscription ${meta.renewal === '1' ? 'renewed' : 'changed'}: ${meta.upgradeFrom} → ${plan} | lifetime #${lifetime}`);
      return res.status(200).json({ received: true });
    }

    /* 🔹 Normal ders ödemesi */
    if (meta.bookingType === 'lesson') {
      const { teacherId, studentId, date, startTime, endTime, duration, location } = meta;
      const durationMinutes = parseInt(duration, 10) || 60;
      const startAtUtc = toStartAtUtc({ date, startTime, timezone: 'Europe/London' });
      const bookingRef = adminDb.collection('bookings').doc(session.id);

      const originalCents = Number(meta.original_unit_amount || 0);
      const discountedCents = Number(meta.discounted_unit_amount || session.amount_total || 0);
      const discountPercent = Number(meta.discountPercent || 0);
      const originalPrice = originalCents / 100;
      const paidAmount = discountedCents / 100;
      const teacherShare = (originalCents * 0.8) / 100;
      const platformSubsidy = Math.max(0, originalPrice - paidAmount);

      let meetingLink = '';
      if (location === 'Online') {
        try {
          meetingLink = await createDailyRoom({ teacherId, date, startTime, durationMinutes, timezone: 'Europe/London' });
        } catch (e) {
          console.error('Daily create exception:', e);
        }
      }

      await bookingRef.set(
        {
          teacherId,
          studentId,
          date,
          startTime,
          endTime,
          duration: durationMinutes,
          location,
          meetingLink,
          amountPaid: paidAmount,
          originalPrice,
          discountPercent,
          teacherShare,
          platformSubsidy,
          status: 'pending-approval',
          teacherApproved: false,
          studentConfirmed: false,
          reminderSent: false,
          timezone: 'Europe/London',
          startAtUtc,
          stripeSessionId: session.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true }
      );

      /* 🔹 Öğrencinin lessonTaken sayısını artır ve kuponları güncelle */
      try {
        const uref = adminDb.collection('users').doc(studentId);
        const snap = await uref.get();
        const user = snap.exists ? snap.data() : {};
        const newLessonCount = (user.lessonsTaken || 0) + 1;
        let coupons = Array.isArray(user.lessonCoupons) ? [...user.lessonCoupons] : [];

        if (newLessonCount >= 6) {
          const updatedCoupons = [];
          for (const c of coupons) {
            if (!c.active && !c.used && c.type === 'lesson' && c.code?.startsWith('REV-')) {
              try {
                await stripe.promotionCodes.update(c.promoId || c.code, { active: true });
                c.active = true;
              } catch (err) {
                console.warn(`⚠️ Coupon activation failed for ${c.code}:`, err.message);
              }
            }
            updatedCoupons.push(c);
          }
          coupons = updatedCoupons;
        }

        await uref.update({ lessonsTaken: newLessonCount, lessonCoupons: coupons });
        console.log(`📘 lessonsTaken updated: ${newLessonCount} for ${studentId}`);
      } catch (err) {
        console.warn('⚠️ lessonsTaken update failed:', err.message);
      }

      /* -------------------- ✉️ Mail gönderimi -------------------- */
      try {
        const teacherSnap = await adminDb.collection('users').doc(teacherId).get();
        const studentSnap = await adminDb.collection('users').doc(studentId).get();
        const teacher = teacherSnap.data() || {};
        const student = studentSnap.data() || {};

        const formattedDate = DateTime.fromFormat(date, 'yyyy-MM-dd', { zone: 'Europe/London' }).toFormat('dd LLL yyyy');
        const formattedTime = DateTime.fromFormat(startTime, 'HH:mm', { zone: 'Europe/London' }).toFormat('HH:mm');
        const baseInfo = `
          <p><b>Date:</b> ${formattedDate}</p>
          <p><b>Start:</b> ${formattedTime} (UK Time)</p>
          <p><b>Duration:</b> ${durationMinutes} minutes</p>
          <p><b>Location:</b> ${location}</p>
          ${meetingLink ? `<p><b>Join Link:</b> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
        `;

        await sendMail({
          to: student.email,
          subject: `✅ Lesson booked with ${teacher.name || 'your teacher'}`,
          html: `
            <p>Hi ${student.name || 'Student'},</p>
            <p>Your lesson has been successfully booked.</p>
            <p><b>Teacher:</b> ${teacher.name || 'Teacher'}</p>
            ${baseInfo}
            <p>We’ll notify you again 1 hour before the lesson.</p>
            <p>Thank you for choosing BridgeLang!</p>
          `,
        });

        await sendMail({
          to: teacher.email,
          subject: `📘 New lesson booked with ${student.name || 'a student'}`,
          html: `
            <p>Hi ${teacher.name || 'Teacher'},</p>
            <p>You have a new lesson booking!</p>
            <p><b>Student:</b> ${student.name || 'Student'}</p>
            ${baseInfo}
            <p>Please review your schedule and prepare for the session.</p>
            <p>BridgeLang Teacher Portal</p>
          `,
        });
      } catch (mailErr) {
        console.warn('⚠️ Lesson booking mail failed:', mailErr.message);
      }

      return res.status(200).json({ received: true });
    }
  }

  return res.status(200).json({ received: true });
}
