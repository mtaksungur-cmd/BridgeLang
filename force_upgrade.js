const { adminDb } = require('./lib/firebaseAdmin');

async function forceUpgrade(email, plan) {
  const PLAN_LIMITS = {
    free: { viewLimit: 10, messagesLeft: 5 },
    starter: { viewLimit: 30, messagesLeft: 10 },
    pro: { viewLimit: 100, messagesLeft: 20 },
    vip: { viewLimit: 9999, messagesLeft: 9999 },
  };

  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const usersSnap = await adminDb.collection('users').where('email', '==', email).get();

  if (usersSnap.empty) {
    console.log(`User ${email} not found`);
    return;
  }

  const userDoc = usersSnap.docs[0];
  await userDoc.ref.update({
    subscriptionPlan: plan,
    viewLimit: limits.viewLimit,
    messagesLeft: limits.messagesLeft,
    subscription: {
        planKey: plan,
        activeUntil: new Date(Date.now() + 30 * 86400000),
        activeUntilMillis: Date.now() + 30 * 86400000,
        lastPaymentAt: new Date(),
        lifetimePayments: 1
    }
  });

  console.log(`User ${email} force upgraded to ${plan}`);
}

const email = process.argv[2];
const plan = process.argv[3];
forceUpgrade(email, plan);
