// Feature to subscription tier mapping
export const FEATURE_MAP = {
  charity: {
    name: 'Charity Tracking',
    minTier: 'free',
    description: 'Track charitable donations',
    id: 'charity',
  },
  receipt_scanner: {
    name: 'Receipt Scanner',
    minTier: 'pro',
    description: 'Scan and upload receipts',
    id: 'receipt_scanner',
  },
  vault: {
    name: 'Home Finance Vault',
    minTier: 'pro',
    description: 'Access home finance features',
    id: 'vault',
  },
  real_cost_mode: {
    name: 'Real Cost Mode',
    minTier: 'pro',
    description: 'Track real cost across currencies',
    id: 'real_cost_mode',
  },
  financial_reports: {
    name: 'Financial Reports',
    minTier: 'pro',
    description: 'Generate financial reports',
    id: 'financial_reports',
  },
  health_score: {
    name: 'Financial Health Score',
    minTier: 'pro',
    description: 'Full breakdown of your financial health with lifestyle tags and improvement tips',
    id: 'health_score',
  },
  spending_calendar: {
    name: 'Spending Calendar',
    minTier: 'pro',
    description: 'View spending on a calendar',
    id: 'spending_calendar',
  },
  daily_limit: {
    name: 'Daily Spending Limit',
    minTier: 'pro',
    description: 'Set and track daily spending limits',
    id: 'daily_limit',
  },
  investment_tracking: {
    name: 'Investment Tracking',
    minTier: 'elite',
    description: 'Track your investments',
    id: 'investment_tracking',
  },
  net_worth: {
    name: 'Net Worth Tracker',
    minTier: 'elite',
    description: 'Track your total net worth',
    id: 'net_worth',
  },
  expat_tools: {
    name: 'Expat Tools',
    minTier: 'elite',
    description: 'Multi-currency and global features',
    id: 'expat_tools',
  },
  side_hustle: {
    name: 'Side Hustle',
    minTier: 'elite',
    description: 'Track freelance income, clients, and invoices',
    id: 'side_hustle',
  },
  subscriptions_tracker: {
    name: 'Subscriptions Tracker',
    minTier: 'pro',
    description: 'Track your recurring subscriptions',
    id: 'subscriptions_tracker',
  },
  debt_credit: {
    name: 'Debt & Credit',
    minTier: 'pro',
    freeLimit: 5,
    description: 'Track debts and credit cards',
    id: 'debt_credit',
  },
};

export const TIER_FEATURES = {
  free: [
    'Unlimited spending logging',
    'Up to 5 savings goals',
    'Up to 5 budget goals',
    'Charity tracking',
    '5 AI messages/month',
  ],
  pro: [
    'Unlimited spending logging',
    'Unlimited savings goals',
    'Unlimited budget goals',
    'Charity tracking',
    'Receipt Scanner',
    'Home Finance Vault',
    'Real Cost Mode',
    'Financial Reports',
    'Spending Calendar',
    'Daily Spending Limit',
    'Subscriptions Tracker',
    'Debit & Credit (up to 5)',
    '30 AI messages/month',
  ],
  elite: [
    'Everything in Pro',
    'Investment Tracking',
    'Net Worth Tracker',
    'Global Expat Tools',
    'Side Hustle Tracker',
    'Unlimited Debit & Credit',
    '50 AI messages/month',
    'All features unlimited',
  ],
};

export const TIER_PRICING = {
  free: { price: 0, duration: 'Forever' },
  pro: { price: 9.99, duration: 'month' },
  elite: { price: 14.99, duration: 'month' },
};

export const AI_MESSAGE_LIMITS = {
  free: 5,
  pro: 30,
  elite: 50,
};