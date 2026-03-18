import { formatCurrency } from '../currency/currencyUtils';
import { getRecentTransactions, sumBySemanticCategory } from './categoryNormalization';

/**
 * Define all lifestyle tags with their metadata and content
 */
export const LIFESTYLE_TAGS = {
  deliveryBro: {
    name: 'Delivery Bro',
    emoji: '🍔',
    shortDesc: (level) => 
      level === 'High' 
        ? "You lean heavily on food delivery and eating out."
        : level === 'Medium'
        ? "You use delivery regularly but still cook sometimes."
        : "You rarely order delivery, preferring to cook at home.",
    getDetails: (transactions, daysBack, currency) => {
      const recentTxns = getRecentTransactions(transactions, daysBack, true);

      const deliverySpend = sumBySemanticCategory(recentTxns, 'convenience_food');
      const groceriesSpend = sumBySemanticCategory(recentTxns, 'groceries');

      const totalFoodSpend = deliverySpend + groceriesSpend;
      const deliveryPercent = totalFoodSpend > 0 ? ((deliverySpend / totalFoodSpend) * 100).toFixed(0) : null;

      return [
        { label: 'Delivery & eating out', value: formatCurrency(deliverySpend, currency) },
        { label: 'Groceries', value: formatCurrency(groceriesSpend, currency) },
        { label: '% on convenience food', value: deliveryPercent !== null ? `${deliveryPercent}%` : 'Not enough data yet' },
      ];
    },
    improvements: {
      High: [
        "Aim for at least 3 more home-cooked meals per week",
        "Set a monthly limit for delivery spending",
        "Meal prep on weekends to reduce weekday ordering",
      ],
      Medium: [
        "Try cooking one more meal at home each week",
        "Keep delivery as a weekend treat, not a daily habit",
        "Stock your fridge to avoid last-minute orders",
      ],
      Low: [
        "Keep up the home cooking! You're saving a lot",
        "Consider sharing your meal prep tips with friends",
        "Occasional delivery is fine as a reward",
      ],
    },
  },

  subscriptionZombie: {
    name: 'Subscription Zombie',
    emoji: '📺',
    shortDesc: (level) => 
      level === 'High'
        ? "Many recurring subscriptions are eating into your income."
        : level === 'Medium'
        ? "You have a moderate number of subscriptions."
        : "You keep subscriptions minimal and under control.",
    getDetails: (subscriptions, monthlyIncome, currency) => {
      const activeSubs = subscriptions.filter(s => s.status === 'active');
      const totalMonthlySubCost = activeSubs.reduce((sum, s) => {
        const amount = s.amount_base || s.amount || 0;
        if (s.billing_cycle === 'yearly') return sum + (amount / 12);
        if (s.billing_cycle === 'weekly') return sum + (amount * 4);
        return sum + amount;
      }, 0);

      const percentOfIncome = monthlyIncome > 0 
        ? ((totalMonthlySubCost / monthlyIncome) * 100).toFixed(1)
        : null;

      return [
        { label: 'Active subscriptions', value: `${activeSubs.length}` },
        { label: 'Total monthly cost', value: formatCurrency(totalMonthlySubCost, currency) },
        ...(percentOfIncome ? [{ label: '% of income', value: `${percentOfIncome}%` }] : []),
      ];
    },
    improvements: {
      High: [
        "Cancel subscriptions you haven't used in 30 days",
        "Set calendar reminders before renewal dates",
        "Challenge: cut 3 subscriptions this month",
      ],
      Medium: [
        "Review each subscription: is it worth the cost?",
        "Consider sharing family plans to save money",
        "Pause subscriptions you only use seasonally",
      ],
      Low: [
        "Great job keeping subscriptions lean!",
        "Review yearly subs to catch any sneaky renewals",
        "Your wallet thanks you for staying disciplined",
      ],
    },
  },

  impulseBro: {
    name: 'Impulse Bro',
    emoji: '🛍️',
    shortDesc: (level) => 
      level === 'High'
        ? "You frequently make unplanned purchases on shopping and fun."
        : level === 'Medium'
        ? "You occasionally splurge but keep it somewhat controlled."
        : "You rarely make impulse purchases, staying disciplined.",
    getDetails: (transactions, daysBack, currency) => {
      const recentTxns = getRecentTransactions(transactions, daysBack, true);

      const shoppingSpend = sumBySemanticCategory(recentTxns, 'shopping');
      const entertainmentSpend = sumBySemanticCategory(recentTxns, 'entertainment');
      const miscSpend = sumBySemanticCategory(recentTxns, 'miscellaneous');

      return [
        { label: 'Shopping', value: formatCurrency(shoppingSpend, currency) },
        { label: 'Entertainment & fun', value: formatCurrency(entertainmentSpend, currency) },
        { label: 'Miscellaneous', value: formatCurrency(miscSpend, currency) },
      ];
    },
    improvements: {
      High: [
        "Wait 24 hours before buying non-essentials",
        "Set a monthly 'fun money' budget and stick to it",
        "Unsubscribe from promotional emails",
      ],
      Medium: [
        "Track impulse buys to spot patterns",
        "Ask yourself: 'Do I need this or just want it?'",
        "Keep one day a week as a 'no-spend day'",
      ],
      Low: [
        "Excellent impulse control! Keep it up",
        "You're free to enjoy occasional treats guilt-free",
        "Your future self is grateful for this discipline",
      ],
    },
  },

  homeCook: {
    name: 'Home Cook',
    emoji: '🍳',
    shortDesc: (level) => 
      level === 'High'
        ? "You cook most meals at home, saving money and eating healthier."
        : level === 'Medium'
        ? "You balance home cooking with occasional eating out."
        : "You rely more on delivery and restaurants than cooking.",
    getDetails: (transactions, daysBack, currency) => {
      const recentTxns = getRecentTransactions(transactions, daysBack, true);

      const groceriesSpend = sumBySemanticCategory(recentTxns, 'groceries');
      const deliverySpend = sumBySemanticCategory(recentTxns, 'convenience_food');

      const totalFoodSpend = groceriesSpend + deliverySpend;
      const homePercent = totalFoodSpend > 0 ? ((groceriesSpend / totalFoodSpend) * 100).toFixed(0) : null;

      return [
        { label: 'Groceries', value: formatCurrency(groceriesSpend, currency) },
        { label: 'Eating out & delivery', value: formatCurrency(deliverySpend, currency) },
        { label: '% spent on groceries', value: homePercent !== null ? `${homePercent}%` : 'Not enough data yet' },
      ];
    },
    improvements: {
      High: [
        "Amazing! You're saving money and eating healthier",
        "Share your favorite recipes with the community",
        "Reward yourself with occasional restaurant visits",
      ],
      Medium: [
        "Nice balance between cooking and convenience",
        "Try one new recipe each week to keep it interesting",
        "Meal prep on Sundays to stay consistent",
      ],
      Low: [
        "Start with simple meals: pasta, rice bowls, salads",
        "Invest in basic kitchen tools to make cooking easier",
        "Challenge yourself to cook 2 meals at home this week",
      ],
    },
  },

  hustleBro: {
    name: 'Hustle Bro',
    emoji: '💼',
    shortDesc: (level) => 
      level === 'High'
        ? "Your side hustle is a significant part of your income!"
        : level === 'Medium'
        ? "Your side hustle is growing and starting to matter."
        : "You have little to no side hustle income right now.",
    getDetails: (sideHustleTransactions, monthlyIncome, daysBack, currency) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      const recentHustleIncome = sideHustleTransactions
        .filter(t => new Date(t.date) >= cutoffDate && t.type === 'income')
        .reduce((sum, t) => sum + (t.amount_base || t.amount), 0);

      const monthlyHustleIncome = recentHustleIncome * (30 / daysBack);
      const percentOfIncome = monthlyIncome > 0 
        ? ((monthlyHustleIncome / monthlyIncome) * 100).toFixed(1)
        : null;

      return [
        { label: `Side hustle income (${daysBack} days)`, value: formatCurrency(recentHustleIncome, currency) },
        { label: 'Estimated monthly', value: formatCurrency(monthlyHustleIncome, currency) },
        ...(percentOfIncome ? [{ label: '% of total income', value: `${percentOfIncome}%` }] : []),
      ];
    },
    improvements: {
      High: [
        "Consider scaling your hustle into a full business",
        "Track expenses carefully for tax deductions",
        "Invest some hustle income into growth or savings",
      ],
      Medium: [
        "Look for ways to automate or streamline your hustle",
        "Raise your rates or prices gradually",
        "Set aside hustle income for taxes and investments",
      ],
      Low: [
        "Explore side hustle ideas that match your skills",
        "Start small: freelancing, tutoring, selling crafts",
        "Even $200/month extra income makes a difference",
      ],
    },
  },

  saverBro: {
    name: 'Saver Bro',
    emoji: '💰',
    shortDesc: (level) => 
      level === 'High'
        ? "You're consistently saving a strong portion of your income."
        : level === 'Medium'
        ? "You save regularly but could push it a bit higher."
        : "You're spending most of your income with little savings.",
    getDetails: (transactions, savingsGoals, daysBack, currency) => {
      const recentTxns = getRecentTransactions(transactions, daysBack, false);
      
      const income = recentTxns
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount_base || t.amount), 0);
      const expenses = recentTxns
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount_base || t.amount), 0);
      const netSavings = income - expenses;
      const savingsRate = income > 0 ? ((netSavings / income) * 100).toFixed(1) : '—';

      return [
        { label: `Income (${daysBack} days)`, value: formatCurrency(income, currency) },
        { label: `Expenses (${daysBack} days)`, value: formatCurrency(expenses, currency) },
        { label: 'Net savings', value: formatCurrency(netSavings, currency) },
        { label: 'Savings rate', value: income > 0 ? `${savingsRate}%` : 'Not enough data yet' },
      ];
    },
    improvements: {
      High: [
        "Fantastic savings discipline! Keep going",
        "Consider moving cash into investments for growth",
        "Set long-term goals: house, retirement, freedom",
      ],
      Medium: [
        "Aim to increase your savings rate by 5%",
        "Automate savings transfers on payday",
        "Cut one unnecessary expense to boost savings",
      ],
      Low: [
        "Start with 'pay yourself first': save 5% of income",
        "Build a small emergency fund (500-1000)",
        "Track expenses to find savings opportunities",
      ],
    },
  },

  investorBro: {
    name: 'Investor Bro',
    emoji: '📈',
    shortDesc: (level) => 
      level === 'High'
        ? "You're actively investing and building long-term wealth."
        : level === 'Medium'
        ? "You have some investments but could do more."
        : "You're not investing much or at all right now.",
    getDetails: (investments, currency) => {
      const totalInvested = investments.reduce((sum, inv) => 
        sum + (inv.amount_invested_base || inv.amount_invested || 0), 0);
      const totalValue = investments.reduce((sum, inv) => 
        sum + (inv.current_value_base || inv.current_value || 0), 0);
      const gain = totalValue - totalInvested;
      const gainPercent = totalInvested > 0 ? ((gain / totalInvested) * 100).toFixed(1) : 0;

      return [
        { label: 'Total invested', value: formatCurrency(totalInvested, currency) },
        { label: 'Current value', value: formatCurrency(totalValue, currency) },
        { label: 'Gain/Loss', value: `${formatCurrency(gain, currency)} (${gainPercent}%)` },
        { label: 'Number of investments', value: `${investments.length}` },
      ];
    },
    improvements: {
      High: [
        "Diversify across stocks, ETFs, and other assets",
        "Stay consistent with monthly contributions",
        "Review portfolio quarterly to rebalance",
      ],
      Medium: [
        "Increase monthly investment contributions",
        "Research low-cost index funds or ETFs",
        "Start with 10-15% of income if possible",
      ],
      Low: [
        "Begin with small amounts: even $50/month helps",
        "Learn about ETFs, stocks, or retirement accounts",
        "Investing early beats timing the market",
      ],
    },
  },

  travelBro: {
    name: 'Travel Bro',
    emoji: '✈️',
    shortDesc: (level) => 
      level === 'High'
        ? "You spend significantly on travel and experiences."
        : level === 'Medium'
        ? "You travel occasionally and enjoy exploring."
        : "You rarely spend on travel right now.",
    getDetails: (transactions, daysBack, currency) => {
      const recentTxns = getRecentTransactions(transactions, daysBack, true);
      const travelSpend = sumBySemanticCategory(recentTxns, 'travel');
      const monthlyTravel = travelSpend * (30 / daysBack);
      const travelCount = recentTxns.filter(t => {
        const travelKeywords = ['travel', 'flight', 'hotel', 'vacation'];
        return travelKeywords.some(kw => t.category?.toLowerCase().includes(kw));
      }).length;

      return [
        { label: `Travel spending (${daysBack} days)`, value: formatCurrency(travelSpend, currency) },
        { label: 'Estimated monthly', value: formatCurrency(monthlyTravel, currency) },
        { label: 'Travel transactions', value: `${travelCount}` },
      ];
    },
    improvements: {
      High: [
        "Travel is an investment in experiences - enjoy!",
        "Look for travel rewards credit cards",
        "Budget travel spending to avoid financial strain",
      ],
      Medium: [
        "Plan trips in advance to get better deals",
        "Use points and miles for free or cheap flights",
        "Balance travel with savings goals",
      ],
      Low: [
        "Start a travel fund for future adventures",
        "Even small weekend trips can be rewarding",
        "Travel doesn't have to be expensive to be fun",
      ],
    },
  },
};