/**
 * Calculate lifestyle persona scores based on user behavior
 * Each score is 0-10, mapped to Low (0-3), Medium (4-6), High (7-10)
 */

import { getRecentTransactions, sumBySemanticCategory } from './categoryNormalization';

/**
 * Delivery Bro 🍔
 * High food delivery / eating out vs groceries
 */
export function calculateDeliveryBroScore(transactions, daysBack = 90) {
  const recentTxns = getRecentTransactions(transactions, daysBack, true);

  // No data = no score
  if (recentTxns.length === 0) return 0;

  const deliverySpend = sumBySemanticCategory(recentTxns, 'convenience_food');
  const groceriesSpend = sumBySemanticCategory(recentTxns, 'groceries');

  const totalFoodSpend = deliverySpend + groceriesSpend;
  if (totalFoodSpend === 0) return 0;

  const deliveryRatio = deliverySpend / totalFoodSpend;
  
  // Map ratio to 0-10 score
  if (deliveryRatio < 0.3) return Math.round(deliveryRatio * 10);
  if (deliveryRatio < 0.6) return Math.round(3 + (deliveryRatio - 0.3) * 10);
  return Math.min(10, Math.round(6 + (deliveryRatio - 0.6) * 10));
}

/**
 * Subscription Zombie 📺
 * Many subscriptions & high cost as % of income
 */
export function calculateSubscriptionZombieScore(subscriptions, monthlyIncome) {
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const subCount = activeSubs.length;
  
  const totalMonthlySubCost = activeSubs.reduce((sum, s) => {
    const amount = s.amount_base || s.amount || 0;
    if (s.billing_cycle === 'yearly') return sum + (amount / 12);
    if (s.billing_cycle === 'weekly') return sum + (amount * 4);
    return sum + amount;
  }, 0);

  let score = 0;

  // Factor 1: Number of subscriptions (0-5 points)
  if (subCount >= 15) score += 5;
  else if (subCount >= 10) score += 4;
  else if (subCount >= 7) score += 3;
  else if (subCount >= 4) score += 2;
  else if (subCount >= 2) score += 1;

  // Factor 2: % of income (0-5 points)
  if (monthlyIncome > 0) {
    const percentOfIncome = (totalMonthlySubCost / monthlyIncome) * 100;
    if (percentOfIncome >= 15) score += 5;
    else if (percentOfIncome >= 10) score += 4;
    else if (percentOfIncome >= 7) score += 3;
    else if (percentOfIncome >= 5) score += 2;
    else if (percentOfIncome >= 3) score += 1;
  } else {
    // No income data, use absolute cost
    if (totalMonthlySubCost >= 500) score += 4;
    else if (totalMonthlySubCost >= 300) score += 3;
    else if (totalMonthlySubCost >= 150) score += 2;
    else if (totalMonthlySubCost >= 50) score += 1;
  }

  return Math.min(10, score);
}

/**
 * Shopaholic / Impulse Bro 🛍️
 * High shopping, entertainment, misc spending
 */
export function calculateImpulseBroScore(transactions, monthlyIncome, daysBack = 90) {
  const recentTxns = getRecentTransactions(transactions, daysBack, true);

  // No data = no score
  if (recentTxns.length === 0) return 0;

  const impulseSpend = sumBySemanticCategory(recentTxns, ['shopping', 'entertainment', 'miscellaneous']);
  const totalSpend = recentTxns.reduce((sum, t) => sum + (t.amount_base || t.amount), 0);
  
  if (totalSpend === 0) return 0;

  const impulseRatio = impulseSpend / totalSpend;
  let score = impulseRatio * 10;

  // Boost if high vs income
  if (monthlyIncome > 0) {
    const monthlyImpulse = impulseSpend * (30 / daysBack);
    const impulseToIncome = monthlyImpulse / monthlyIncome;
    if (impulseToIncome > 0.3) score = Math.min(10, score + 2);
    if (impulseToIncome > 0.2) score = Math.min(10, score + 1);
  }

  return Math.min(10, Math.round(score));
}

/**
 * Home Cook 🍳
 * Groceries > Eating Out/Delivery (inverse of Delivery Bro)
 */
export function calculateHomeCookScore(transactions, daysBack = 90) {
  // Inverse relationship with Delivery Bro
  const deliveryScore = calculateDeliveryBroScore(transactions, daysBack);
  return Math.max(0, 10 - deliveryScore);
}

/**
 * Hustle Bro 💼
 * Significant side hustle income
 */
export function calculateHustleBroScore(sideHustleTransactions, monthlyIncome, daysBack = 90) {
  if (!sideHustleTransactions || sideHustleTransactions.length === 0) return 0;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const recentHustleIncome = sideHustleTransactions
    .filter(t => 
      new Date(t.date) >= cutoffDate && t.type === 'income'
    )
    .reduce((sum, t) => sum + (t.amount_base || t.amount), 0);

  if (monthlyIncome === 0 || recentHustleIncome === 0) return 0;

  const monthlyHustleIncome = recentHustleIncome * (30 / daysBack);
  const hustleRatio = monthlyHustleIncome / monthlyIncome;

  // Map ratio to score
  if (hustleRatio < 0.05) return Math.round(hustleRatio * 100); // 0-5%
  if (hustleRatio < 0.15) return Math.round(2 + (hustleRatio - 0.05) * 30); // 5-15%
  if (hustleRatio < 0.30) return Math.round(5 + (hustleRatio - 0.15) * 20); // 15-30%
  return Math.min(10, Math.round(8 + (hustleRatio - 0.30) * 10)); // 30%+
}

/**
 * Saver Bro 💰
 * Strong savings rate
 */
export function calculateSaverBroScore(savingsGoals, transactions, monthlyIncome, daysBack = 90) {
  // Calculate net savings from transactions (no normalization needed - uses income/expense type)
  const recentTxns = getRecentTransactions(transactions, daysBack, false);
  
  // No data = no score
  if (recentTxns.length === 0) return 0;

  const income = recentTxns
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount_base || t.amount), 0);
  const expenses = recentTxns
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount_base || t.amount), 0);

  const netSavings = income - expenses;
  
  if (income === 0) return 0;

  const savingsRate = netSavings / income;

  // Map savings rate to score
  if (savingsRate < 0) return 0; // Spending more than earning
  if (savingsRate < 0.05) return 1;
  if (savingsRate < 0.10) return 3;
  if (savingsRate < 0.20) return 5;
  if (savingsRate < 0.30) return 7;
  if (savingsRate < 0.40) return 9;
  return 10;
}

/**
 * Investor Bro 📈
 * Regular investment contributions
 */
export function calculateInvestorBroScore(investments, transactions, daysBack = 90) {
  if (!investments || investments.length === 0) return 0;

  const totalInvested = investments.reduce((sum, inv) => 
    sum + (inv.amount_invested_base || inv.amount_invested || 0), 0
  );

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  // Count recent investment purchases
  const recentInvestments = investments.filter(inv => 
    inv.purchase_date && new Date(inv.purchase_date) >= cutoffDate
  );

  let score = 0;

  // Factor 1: Total invested (0-5 points)
  if (totalInvested >= 50000) score += 5;
  else if (totalInvested >= 20000) score += 4;
  else if (totalInvested >= 10000) score += 3;
  else if (totalInvested >= 5000) score += 2;
  else if (totalInvested >= 1000) score += 1;

  // Factor 2: Recent activity (0-5 points)
  const recentCount = recentInvestments.length;
  if (recentCount >= 5) score += 5;
  else if (recentCount >= 3) score += 4;
  else if (recentCount >= 2) score += 3;
  else if (recentCount >= 1) score += 2;

  return Math.min(10, score);
}

/**
 * Travel Bro ✈️
 * Travel & flight spending
 */
export function calculateTravelBroScore(transactions, monthlyIncome, daysBack = 90) {
  const recentTxns = getRecentTransactions(transactions, daysBack, true);

  // No data = no score
  if (recentTxns.length === 0) return 0;

  const travelSpend = sumBySemanticCategory(recentTxns, 'travel');

  if (travelSpend === 0) return 0;

  const monthlyTravel = travelSpend * (30 / daysBack);
  
  if (monthlyIncome > 0) {
    const travelToIncome = monthlyTravel / monthlyIncome;
    if (travelToIncome >= 0.15) return 10;
    if (travelToIncome >= 0.10) return 8;
    if (travelToIncome >= 0.05) return 6;
    if (travelToIncome >= 0.02) return 4;
    return 2;
  }

  // Fallback to absolute spend
  if (monthlyTravel >= 1000) return 10;
  if (monthlyTravel >= 500) return 7;
  if (monthlyTravel >= 200) return 4;
  return 2;
}

/**
 * Get level and color for a score
 */
export function getLifestyleLevel(score) {
  if (score <= 3) {
    return { level: 'Low', color: 'green', bgColor: 'bg-green-500/20', textColor: 'text-green-400', borderColor: 'border-green-500/30' };
  } else if (score <= 6) {
    return { level: 'Medium', color: 'yellow', bgColor: 'bg-yellow-500/20', textColor: 'text-yellow-400', borderColor: 'border-yellow-500/30' };
  } else {
    return { level: 'High', color: 'red', bgColor: 'bg-red-500/20', textColor: 'text-red-400', borderColor: 'border-red-500/30' };
  }
}

/**
 * Get all lifestyle scores
 */
export function calculateAllLifestyleScores(data) {
  const {
    transactions = [],
    subscriptions = [],
    sideHustleTransactions = [],
    investments = [],
    savingsGoals = [],
    monthlyIncome = 0,
    daysBack = 90
  } = data;

  return {
    deliveryBro: calculateDeliveryBroScore(transactions, daysBack),
    subscriptionZombie: calculateSubscriptionZombieScore(subscriptions, monthlyIncome),
    impulseBro: calculateImpulseBroScore(transactions, monthlyIncome, daysBack),
    homeCook: calculateHomeCookScore(transactions, daysBack),
    hustleBro: calculateHustleBroScore(sideHustleTransactions, monthlyIncome, daysBack),
    saverBro: calculateSaverBroScore(savingsGoals, transactions, monthlyIncome, daysBack),
    investorBro: calculateInvestorBroScore(investments, transactions, daysBack),
    travelBro: calculateTravelBroScore(transactions, monthlyIncome, daysBack),
  };
}