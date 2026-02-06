import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebaseAdmin';
import admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    console.log('🔵 === BOOKING CHECKOUT START ===');
    const {
      teacherId, studentId, date, startTime, endTime,
      duration, location, price, studentEmail, timezone,
      lessonType
    } = req.body;

    console.log('📦 Request data:', {
      teacherId, studentId, date, startTime, duration, location, price, lessonType
    });

    if (!teacherId || !studentId || !date || !startTime || !duration || !location) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      console.log('❌ Invalid price:', price);
      return res.status(400).json({ error: 'Invalid or missing price.' });
    }

    console.log('✅ Basic validation passed');

    // ====== TIME CONFLICT VALIDATION ======
    console.log('🕐 Checking for time conflicts...');

    // Parse booking time
    const [startHours, startMins] = startTime.split(':').map(Number);
    const bookingDate = new Date(date);
    bookingDate.setHours(startHours, startMins, 0, 0);
    const bookingEnd = new Date(bookingDate.getTime() + duration * 60 * 1000);

    // Check teacher conflicts
    const teacherConflicts = await adminDb.collection('bookings')
      .where('teacherId', '==', teacherId)
      .where('date', '==', date)
      .where('status', 'in', ['pending', 'approved', 'confirmed'])
      .get();

    // Check student conflicts
    const studentConflicts = await adminDb.collection('bookings')
      .where('studentId', '==', studentId)
      .where('date', '==', date)
      .where('status', 'in', ['pending', 'approved', 'confirmed'])
      .get();

    // Function to check if two time ranges overlap
    const hasTimeOverlap = (start1, end1, start2, end2) => {
      return start1 < end2 && end1 > start2;
    };

    // Check teacher's existing bookings
    for (const doc of teacherConflicts.docs) {
      const existing = doc.data();
      const [exHours, exMins] = existing.startTime.split(':').map(Number);
      const exStart = new Date(date);
      exStart.setHours(exHours, exMins, 0, 0);
      const exEnd = new Date(exStart.getTime() + existing.duration * 60 * 1000);

      if (hasTimeOverlap(bookingDate, bookingEnd, exStart, exEnd)) {
        console.log('❌ Teacher time conflict detected');
        return res.status(400).json({
          error: 'Teacher is not available at this time. Please choose a different time slot.'
        });
      }
    }

    // Check student's existing bookings
    for (const doc of studentConflicts.docs) {
      const existing = doc.data();
      const [exHours, exMins] = existing.startTime.split(':').map(Number);
      const exStart = new Date(date);
      exStart.setHours(exHours, exMins, 0, 0);
      const exEnd = new Date(exStart.getTime() + existing.duration * 60 * 1000);

      if (hasTimeOverlap(bookingDate, bookingEnd, exStart, exEnd)) {
        console.log('❌ Student time conflict detected');
        return res.status(400).json({
          error: 'You already have a lesson booked at this time. Please choose a different time slot.'
        });
      }
    }

    console.log('✅ No time conflicts found');

    // Duplicate booking prevention
    const duplicateCheck = await adminDb.collection('bookings')
      .where('studentId', '==', studentId)
      .where('teacherId', '==', teacherId)
      .where('date', '==', date)
      .where('startTime', '==', startTime)
      .where('status', 'in', ['pending', 'confirmed', 'approved'])
      .get();

    if (!duplicateCheck.empty) {
      console.log('❌ Duplicate booking detected');
      return res.status(400).json({
        error: 'You already have a booking for this time slot. Please check your lessons.'
      });
    }

    console.log('✅ No duplicate bookings');

    if (lessonType === 'intro') {
      numericPrice = 4.99;

      const sSnap = await adminDb.collection('users').doc(studentId).get();
      const sData = sSnap.exists ? sSnap.data() : {};
      const introTutors = Array.isArray(sData.introTutors) ? sData.introTutors : [];

      if (introTutors.includes(teacherId)) {
        console.log('❌ Intro lesson already booked with this tutor');
        return res.status(400).json({ error: 'You have already booked an intro lesson with this tutor.' });
      }
    }

    const originalPrice = numericPrice;
    let discountedPrice = originalPrice;
    let discountLabel = 'No discount';
    let discountPercent = 0;
    let usedCoupon = null;

    console.log('🎫 Checking for coupons...');
    const uSnap = await adminDb.collection('users').doc(studentId).get();
    if (uSnap.exists && lessonType !== 'intro') {
      const user = uSnap.data();
      const plan = user?.subscriptionPlan || 'free';
      const totalLessons = user?.lessonsTaken || 0;
      const lessonCoupons = Array.isArray(user?.lessonCoupons) ? user.lessonCoupons : [];

      if (totalLessons < 6) {
        if (plan === 'starter') { discountedPrice *= 0.9; discountLabel = 'Starter 10% (first 6 lessons)'; discountPercent = 10; }
        if (plan === 'pro') { discountedPrice *= 0.85; discountLabel = 'Pro 15% (first 6 lessons)'; discountPercent = 15; }
        if (plan === 'vip') { discountedPrice *= 0.8; discountLabel = 'VIP 20% (first 6 lessons)'; discountPercent = 20; }
      } else {
        const activeCoupon = lessonCoupons.find(c => c.type === 'lesson' && c.active === true && !c.used);
        if (activeCoupon) {
          const pct = Number(activeCoupon.percent ?? activeCoupon.discount ?? 0);
          if (pct > 0) {
            discountedPrice = originalPrice * (1 - pct / 100);
            discountLabel = `Auto Lesson Coupon ${pct}%`;
            discountPercent = pct;
            usedCoupon = activeCoupon;
          }
        }
      }
    }

    console.log('💰 Pricing:', {
      original: originalPrice,
      discounted: discountedPrice,
      discount: discountLabel
    });

    const originalUnitAmount = Math.round(originalPrice * 100);
    const discountedUnitAmount = Math.max(0, Math.round(discountedPrice * 100));

    const standardCommissionRate = 0.20;
    const expectedPlatformFee = Math.round(originalPrice * standardCommissionRate * 100);
    const discountAmount = originalUnitAmount - discountedUnitAmount;
    const finalPlatformFee = Math.max(0, expectedPlatformFee - discountAmount);

    console.log('🏦 Fetching teacher Stripe account...');
    const tutorSnap = await adminDb.collection('users').doc(teacherId).get();
    const tutorData = tutorSnap.exists ? tutorSnap.data() : {};
    const stripeAccountId = tutorData.stripeAccountId;

    console.log('Teacher Stripe account:', stripeAccountId || 'NOT SET');

    if (!stripeAccountId) {
      console.log('❌ Teacher has no Stripe account');
      return res.status(400).json({ error: 'Teacher has not connected their payment account. Please contact support.' });
    }

    // Validate that Stripe account actually exists
    let validStripeAccount = false;
    try {
      console.log('🔍 Validating Stripe account...');
      const account = await stripe.accounts.retrieve(stripeAccountId);
      validStripeAccount = account && account.id === stripeAccountId;
      console.log('✅ Stripe account validated:', stripeAccountId);
    } catch (accountErr) {
      console.error('❌ Stripe account validation failed:', accountErr.message);
      validStripeAccount = false;
    }

    // Prepare payment_intent_data - only add transfer and fee if account is valid
    const paymentIntentData = {};

    if (validStripeAccount) {
      // Only use application_fee_amount when doing Stripe Connect transfer
      paymentIntentData.application_fee_amount = finalPlatformFee;
      paymentIntentData.transfer_data = {
        destination: stripeAccountId,
      };
      console.log('✅ Using valid Stripe account for transfer with platform fee:', finalPlatformFee);
    } else {
      // If no valid Stripe account, platform receives full payment directly
      // No transfer, no application fee needed
      console.warn(`⚠️ Teacher ${teacherId} has invalid Stripe account ${stripeAccountId}. Platform will receive full payment.`);
    }

    console.log('💳 Creating Stripe checkout session...');
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: { name: 'Private Lesson' },
          unit_amount: discountedUnitAmount,
        },
        quantity: 1,
      }],
      payment_intent_data: Object.keys(paymentIntentData).length > 0 ? paymentIntentData : undefined,
      customer_email: studentEmail || undefined,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      metadata: {
        bookingType: 'lesson',
        lessonType: lessonType || 'standard',
        teacherId,
        studentId,
        date,
        startTime,
        endTime: endTime || '',
        duration: String(duration),
        location,
        timezone: timezone || '',
        discountLabel,
        discountPercent: String(discountPercent || 0),
        original_unit_amount: String(originalUnitAmount),
        discounted_unit_amount: String(discountedUnitAmount),
        coupon_code: usedCoupon?.code || '',
        coupon_type: usedCoupon?.type || '',
      },
    });

    console.log('✅ Stripe session created:', session.id);
    console.log('🔗 Checkout URL:', session.url);

    if (usedCoupon) {
      console.log('🎫 Marking coupon as used...');
      await adminDb.collection('users').doc(studentId).update({
        lessonCoupons: admin.firestore.FieldValue.arrayRemove(usedCoupon),
      });
      usedCoupon.used = true;
      await adminDb.collection('users').doc(studentId).update({
        lessonCoupons: admin.firestore.FieldValue.arrayUnion(usedCoupon),
      });
    }

    console.log('🔵 === BOOKING CHECKOUT SUCCESS ===');
    return res.status(200).json({
      url: session.url || session.checkout_url
    });
  } catch (err) {
    console.error('❌❌❌ CHECKOUT ERROR:', err);
    console.error('Error stack:', err.stack);
    return res.status(500).json({
      error: 'Checkout initialization failed',
      details: err.message
    });
  }
}
