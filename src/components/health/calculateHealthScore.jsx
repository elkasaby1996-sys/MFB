import { startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns';

// Configurable category weights (sum to 1.0)
const CATEGORY_WEIGHTS = {
  spending: 0.25,      // Spending vs income
  savings: 0.20,       // Savings behavior
  debt: 0.15,          // Debt management
  subscriptions: 0.10, // Subscription costs
  budget: 0.15,        // Budget adherence
  investing: 0.10,     // Investing consistency
  consistency: 0.05,   // Tracking habits
};

export function calculateFinancialHealthScore(data) {
  const {
    transactions = [],
    budgets = [],
    savingsGoals = [],
    debts = [],
    profile = {},
    userMissions = [],
    investments = [],
    subscriptions = [],
  } = data;

  // Ensure arrays
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeBudgets = Array.isArray(budgets) ? budgets : [];
  const safeSavingsGoals = Array.isArray(savingsGoals) ? savingsGoals : [];
  const safeDebts = Array.isArray(debts) ? debts : [];
  const safeUserMissions = Array.isArray(userMissions) ? userMissions : [];
  const safeInvestments = Array.isArray(investments) ? investments : [];
  const safeSubscriptions = Array.isArray(subscriptions) ? subscriptions : [];

  // CRITICAL: Check if user has ANY data
  const hasAnyData = safeTransactions.length > 0 || 
                     safeInvestments.length > 0 || 
                     safeBudgets.length > 0;

  if (!hasAnyData) {
    return {
      total: null,
      breakdown: null,
      status: 'no_data',
      lastUpdated: new Date(),
    };
  }

  // Check data coverage period
  const dataCoverage = calculateDataCoverage(safeTransactions, safeInvestments);
  const isEarlyEstimate = dataCoverage.days < 30;

  // Get current and previous period data
  const currentPeriod = getCurrentPeriodData(safeTransactions, safeInvestments, safeBudgets);
  const previousPeriod = getPreviousPeriodData(safeTransactions, safeInvestments, safeBudgets);

  if (safeTransactions.length === 0 && safeInvestments.length === 0) {
    return {
      total: null,
      breakdown: null,
      status: 'no_data',
      lastUpdated: new Date(),
    };
  }

  const now = new Date();
  
  // Calculate weighted category scores (each 0-100 or null)
  const categoryScores = {
    spending: calculateSpendingScore(safeTransactions, profile),
    savings: calculateSavingsBehaviorScore(safeTransactions, safeSavingsGoals, profile),
    debt: calculateDebtManagementScore(safeDebts, profile),
    subscriptions: calculateSubscriptionScore(safeSubscriptions, profile),
    budget: calculateBudgetAdherenceScore(safeTransactions, safeBudgets),
    investing: calculateInvestingScore(safeInvestments, safeTransactions),
    consistency: calculateConsistencyScore(safeTransactions, profile, safeUserMissions),
  };

  // Calculate weighted final score (only from categories with data)
  // CRITICAL: Each category already returns 0-100, so we just need weighted average
  let totalWeight = 0;
  let weightedSum = 0;
  
  Object.keys(categoryScores).forEach(key => {
    if (categoryScores[key] !== null) {
      weightedSum += categoryScores[key] * CATEGORY_WEIGHTS[key];
      totalWeight += CATEGORY_WEIGHTS[key];
    }
  });

  // Normalize weights and calculate final score
  let finalScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;
  
  // CRITICAL: Clamp final score to [0, 100] - no exceptions
  if (finalScore !== null) {
    finalScore = Math.min(100, Math.max(0, finalScore));
  }

  // Calculate previous period score for comparison
  let previousScore = null;
  let scoreChange = null;
  if (previousPeriod.hasData) {
    const prevCategoryScores = {
      spending: calculateSpendingScore(previousPeriod.transactions, profile),
      savings: calculateSavingsBehaviorScore(previousPeriod.transactions, safeSavingsGoals, profile),
      debt: calculateDebtManagementScore(safeDebts, profile),
      subscriptions: calculateSubscriptionScore(safeSubscriptions, profile),
      budget: calculateBudgetAdherenceScore(previousPeriod.transactions, previousPeriod.budgets),
      investing: calculateInvestingScore(previousPeriod.investments, previousPeriod.transactions),
      consistency: calculateConsistencyScore(previousPeriod.transactions, profile, safeUserMissions),
    };
    
    // Calculate previous score with same normalization
    let prevWeightedSum = 0;
    let prevTotalWeight = 0;
    
    Object.keys(prevCategoryScores).forEach(key => {
      if (prevCategoryScores[key] !== null) {
        prevWeightedSum += prevCategoryScores[key] * CATEGORY_WEIGHTS[key];
        prevTotalWeight += CATEGORY_WEIGHTS[key];
      }
    });
    
    previousScore = prevTotalWeight > 0 ? Math.round(prevWeightedSum / prevTotalWeight) : null;
    
    // Clamp previous score as well
    if (previousScore !== null) {
      previousScore = Math.min(100, Math.max(0, previousScore));
    }
    
    scoreChange = finalScore - previousScore;
  }

  return {
    total: finalScore,
    breakdown: categoryScores,
    status: isEarlyEstimate ? 'early_estimate' : 'full',
    dataCoverage,
    previousScore,
    scoreChange,
    calculatedAt: now,
    lastUpdated: now,
  };
}

// Helper: Calculate data coverage
function calculateDataCoverage(transactions, investments) {
  const allDates = [
    ...transactions.map(t => new Date(t.date)),
    ...investments.map(i => new Date(i.purchaseDate || i.created_date)),
  ].filter(d => !isNaN(d));

  if (allDates.length === 0) {
    return { days: 0, firstEntry: null, lastEntry: null };
  }

  const sorted = allDates.sort((a, b) => a - b);
  const firstEntry = sorted[0];
  const lastEntry = sorted[sorted.length - 1];
  const days = differenceInDays(lastEntry, firstEntry) + 1;

  return { days, firstEntry, lastEntry };
}

// Helper: Get current period data
function getCurrentPeriodData(transactions, investments, budgets) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  return {
    transactions: transactions.filter(t => {
      const date = new Date(t.date);
      return date >= monthStart && date <= monthEnd;
    }),
    investments: investments.filter(i => {
      const date = new Date(i.purchaseDate || i.created_date);
      return date >= monthStart && date <= monthEnd;
    }),
    budgets: budgets.filter(b => 
      b.month === (now.getMonth() + 1) && b.year === now.getFullYear()
    ),
  };
}

// Helper: Get previous period data
function getPreviousPeriodData(transactions, investments, budgets) {
  const now = new Date();
  const lastMonth = subMonths(now, 1);
  const monthStart = startOfMonth(lastMonth);
  const monthEnd = endOfMonth(lastMonth);

  const prevTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= monthStart && date <= monthEnd;
  });

  const prevInvestments = investments.filter(i => {
    const date = new Date(i.purchaseDate || i.created_date);
    return date >= monthStart && date <= monthEnd;
  });

  const prevBudgets = budgets.filter(b => 
    b.month === (lastMonth.getMonth() + 1) && b.year === lastMonth.getFullYear()
  );

  return {
    transactions: prevTransactions,
    investments: prevInvestments,
    budgets: prevBudgets,
    hasData: prevTransactions.length > 0 || prevInvestments.length > 0,
  };
}

// Calculate spending score (0-100 or null)
function calculateSpendingScore(transactions, profile) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  const thisMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= monthStart && date <= monthEnd;
  });

  const income = thisMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const expenses = thisMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Require both income AND expenses to calculate
  if (income === 0 || thisMonthTransactions.length === 0) return null;

  const ratio = expenses / income;
  if (ratio <= 0.5) return 100;
  if (ratio <= 0.7) return 85;
  if (ratio <= 0.9) return 70;
  if (ratio <= 1.0) return 55;
  if (ratio <= 1.2) return 35;
  return 15;
}

// Calculate savings behavior score (0-100 or null)
function calculateSavingsBehaviorScore(transactions, savingsGoals, profile) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  const thisMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= monthStart && date <= monthEnd;
  });

  const income = thisMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const expenses = thisMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Require income to calculate savings behavior
  if (income === 0 || thisMonthTransactions.length < 2) return null;

  const netSavings = income - expenses;
  const savingsRate = netSavings / income;

  if (savingsRate < 0) return 0;
  if (savingsRate < 0.05) return 20;
  if (savingsRate < 0.10) return 40;
  if (savingsRate < 0.20) return 65;
  if (savingsRate < 0.30) return 80;
  if (savingsRate < 0.40) return 95;
  return 100;
}

// Calculate debt management score (0-100 or null)
function calculateDebtManagementScore(debts, profile) {
  const activeDebts = debts.filter(d => d.status === 'active');
  
  // Only calculate if user has debt entries
  if (activeDebts.length === 0) return null;

  const monthlyIncome = profile?.monthly_income || 0;
  if (monthlyIncome === 0) return null;

  const totalDebt = activeDebts.reduce((sum, d) => sum + (d.current_balance || 0), 0);
  const monthlyPayments = activeDebts.reduce((sum, d) => sum + (d.minimum_payment || 0), 0);

  const dti = monthlyPayments / monthlyIncome;
  
  if (dti > 0.5) return 10;
  if (dti > 0.4) return 25;
  if (dti > 0.3) return 45;
  if (dti > 0.2) return 65;
  if (dti > 0.1) return 85;
  return 95;
}

// Calculate subscription score (0-100 or null)
function calculateSubscriptionScore(subscriptions, profile) {
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  
  // Only calculate if user has subscriptions
  if (activeSubs.length === 0) return null;

  const monthlyIncome = profile?.monthly_income || 0;
  
  const totalMonthlySubCost = activeSubs.reduce((sum, s) => {
    const amount = s.amount || 0;
    if (s.billing_frequency === 'yearly') return sum + (amount / 12);
    if (s.billing_frequency === 'weekly') return sum + (amount * 4);
    return sum + amount;
  }, 0);

  if (monthlyIncome === 0) {
    if (totalMonthlySubCost >= 500) return 20;
    if (totalMonthlySubCost >= 300) return 50;
    if (totalMonthlySubCost >= 150) return 75;
    return 90;
  }

  const percentOfIncome = (totalMonthlySubCost / monthlyIncome) * 100;
  
  if (percentOfIncome >= 15) return 15;
  if (percentOfIncome >= 10) return 40;
  if (percentOfIncome >= 7) return 60;
  if (percentOfIncome >= 5) return 75;
  if (percentOfIncome >= 3) return 90;
  return 100;
}

// Calculate budget adherence score (0-100 or null)
function calculateBudgetAdherenceScore(transactions, budgets) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  const currentBudgets = budgets.filter(b => b.month === currentMonth && b.year === currentYear);
  
  // Only calculate if user has budgets configured
  if (currentBudgets.length === 0) return null;

  const thisMonthExpenses = transactions.filter(t => {
    const date = new Date(t.date);
    return t.type === 'expense' && date >= monthStart && date <= monthEnd;
  });

  // Need transactions to compare against budgets
  if (thisMonthExpenses.length === 0) return null;

  const spendingByCategory = thisMonthExpenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + (t.amount || 0);
    return acc;
  }, {});

  const totalBudget = currentBudgets.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalSpent = currentBudgets.reduce((sum, b) => {
    return sum + (spendingByCategory[b.category] || 0);
  }, 0);

  if (totalBudget === 0) return null;

  const ratio = totalSpent / totalBudget;
  if (ratio <= 0.7) return 100;
  if (ratio <= 0.85) return 85;
  if (ratio <= 0.95) return 70;
  if (ratio <= 1.0) return 60;
  if (ratio <= 1.1) return 40;
  if (ratio <= 1.25) return 25;
  return 10;
}

// Calculate investing consistency score (0-100 or null)
function calculateInvestingScore(investments, transactions) {
  // Only calculate if user has investment activity
  if (investments.length === 0) return null;

  const now = new Date();
  const threeMonthsAgo = subMonths(now, 3);
  
  const recentInvestments = investments.filter(inv => {
    const date = new Date(inv.purchaseDate || inv.created_date);
    return date >= threeMonthsAgo;
  });

  const totalInvested = investments.reduce((sum, inv) => 
    sum + ((inv.quantity || 0) * (inv.avgBuyPrice_asset || 0)), 0
  );

  let score = 30;
  
  if (totalInvested >= 50000) score += 40;
  else if (totalInvested >= 20000) score += 30;
  else if (totalInvested >= 10000) score += 20;
  else if (totalInvested >= 5000) score += 10;
  
  if (recentInvestments.length >= 3) score += 30;
  else if (recentInvestments.length >= 2) score += 20;
  else if (recentInvestments.length >= 1) score += 10;

  return Math.min(100, score);
}



// Calculate consistency score (0-100, always returns value if any data exists)
function calculateConsistencyScore(transactions, profile, userMissions) {
  // This is the only category that can be calculated with minimal data
  if (transactions.length === 0) return null;

  const now = new Date();
  const thirtyDaysAgo = subMonths(now, 1);
  
  const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
  const daysWithTransactions = new Set(recentTransactions.map(t => t.date.split('T')[0])).size;

  let score = 30;

  if (daysWithTransactions >= 20) score += 40;
  else if (daysWithTransactions >= 15) score += 30;
  else if (daysWithTransactions >= 10) score += 20;
  else if (daysWithTransactions >= 5) score += 10;

  const streak = profile?.streak_days || 0;
  if (streak >= 30) score += 30;
  else if (streak >= 14) score += 20;
  else if (streak >= 7) score += 10;

  return Math.min(100, score);
}

export function getScoreLabel(score) {
  if (score >= 85) return { label: 'Excellent', color: 'green' };
  if (score >= 70) return { label: 'Good', color: 'lightgreen' };
  if (score >= 40) return { label: 'Needs Work', color: 'yellow' };
  return { label: 'Poor', color: 'red' };
}

export function getImprovementSuggestions(breakdown, data) {
  const suggestions = [];
  
  if (!breakdown) return suggestions;
  
  const { spending, savings, debt, subscriptions, budget, investing } = breakdown;

  if (spending < 60) {
    suggestions.push({
      icon: '💰',
      title: 'Reduce Your Spending',
      description: 'You\'re spending too much relative to your income. Try to cut non-essential expenses by 10-15%.',
      priority: 1,
    });
  }

  if (savings < 60) {
    suggestions.push({
      icon: '🎯',
      title: 'Increase Your Savings Rate',
      description: 'Aim to save at least 10-15% of your monthly income. Set up automatic transfers to savings.',
      priority: 2,
    });
  }

  if (debt < 70 && data.debts?.some(d => d.status === 'active')) {
    suggestions.push({
      icon: '📉',
      title: 'Pay Down High-Interest Debt',
      description: 'Focus on paying extra toward your highest interest rate debt to reduce your debt burden.',
      priority: 1,
    });
  }

  if (subscriptions < 60) {
    suggestions.push({
      icon: '📺',
      title: 'Review Your Subscriptions',
      description: 'Audit your recurring subscriptions and cancel those you no longer use regularly.',
      priority: 2,
    });
  }

  if (investing < 60) {
    suggestions.push({
      icon: '📈',
      title: 'Start or Increase Investing',
      description: 'Begin investing even small amounts regularly. Consider low-cost index funds or ETFs.',
      priority: 3,
    });
  }

  if (budget < 60) {
    suggestions.push({
      icon: '📊',
      title: 'Stick to Your Budgets',
      description: 'Review your monthly budgets and track your spending more carefully to stay within limits.',
      priority: 3,
    });
  }

  return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 5);
}