export const PLAN_LIMITS = {
  free: {
    viewLimit: 10,
    messagesLeft: 5,
  },
  starter: {
    viewLimit: 30,
    messagesLeft: 10,
  },
  pro: {
    viewLimit: 100,
    messagesLeft: 20,
  },
  vip: {
    viewLimit: 9999,
    messagesLeft: 9999,
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

