export const PLAN_LIMITS = {
  free: {
    viewLimit: 9999,
    messagesLeft: 5,
    preLesson: 5,
    reviewDiscount: 25,
  },
  starter: {
    viewLimit: 9999,
    messagesLeft: 10,
    preLesson: 10,
    reviewDiscount: 30,
  },
  pro: {
    viewLimit: 9999,
    messagesLeft: 20,
    preLesson: 20,
    reviewDiscount: 35,
  },
  vip: {
    viewLimit: 9999,
    messagesLeft: 9999,
    preLesson: 9999,
    reviewDiscount: 40,
  },
};

export const getLimitsForPlan = (plan) => {
  const p = (plan || 'free').toLowerCase();
  return PLAN_LIMITS[p] || PLAN_LIMITS.free;
};

export const getPlanLabel = (plan) => {
  const p = (plan || 'free').toLowerCase();
  switch (p) {
    case 'free': return 'Free';
    case 'starter': return 'Starter';
    case 'pro': return 'Pro';
    case 'vip': return 'VIP';
    default: return 'Free';
  }
};

