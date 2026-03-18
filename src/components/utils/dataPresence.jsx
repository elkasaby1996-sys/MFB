/**
 * Single Source of Truth for Data Presence
 * Determines whether user has sufficient data for insights and scores
 */

import { differenceInDays, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Calculate data presence metrics for a given dataset
 * @returns {Object} Data presence metrics
 */
export function calculateDataPresence(transactions = [], investments = [], budgets = []) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  // Filter to current month for monthly metrics
  const thisMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= monthStart && date <= monthEnd;
  });
  
  // Explicit counts - NO ASSUMPTIONS
  const transactionCount = thisMonthTransactions.length;
  const incomeCount = thisMonthTransactions.filter(t => t.type === 'income').length;
  const expenseCount = thisMonthTransactions.filter(t => t.type === 'expense').length;
  const investmentCount = investments.length;
  const budgetCount = budgets.length;
  
  // Calculate date range coverage
  let daysCovered = 0;
  if (transactions.length > 0) {
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    const firstDate = new Date(sortedTransactions[0].date);
    const lastDate = new Date(sortedTransactions[sortedTransactions.length - 1].date);
    daysCovered = differenceInDays(lastDate, firstDate);
  }
  
  // Core presence checks
  const hasAnyData = (transactionCount + investmentCount + budgetCount) > 0;
  const hasCashflowData = (incomeCount + expenseCount) > 0;
  const hasMinimumActivity = transactionCount >= 3;
  const hasLongTermData = daysCovered >= 14;
  
  return {
    // Counts
    transactionCount,
    incomeCount,
    expenseCount,
    investmentCount,
    budgetCount,
    daysCovered,
    
    // Presence flags
    hasAnyData,
    hasCashflowData,
    hasMinimumActivity,
    hasLongTermData,
    
    // State determination
    state: determineDataState(hasAnyData, hasMinimumActivity, hasLongTermData)
  };
}

/**
 * Determine the overall data state
 * @returns {'no_data' | 'early' | 'sufficient'}
 */
function determineDataState(hasAnyData, hasMinimumActivity, hasLongTermData) {
  if (!hasAnyData) {
    return 'no_data';
  }
  
  if (!hasMinimumActivity || !hasLongTermData) {
    return 'early';
  }
  
  return 'sufficient';
}

/**
 * Get appropriate label for Financial Health Score based on data state
 */
export function getHealthScoreLabel(score, dataState) {
  if (dataState === 'no_data') {
    return {
      label: 'Start tracking',
      subtitle: 'Log your first transaction to generate your score',
      color: 'slate',
      showScore: false
    };
  }
  
  if (dataState === 'early') {
    return {
      label: 'Early estimate',
      subtitle: 'Based on limited activity so far',
      color: 'yellow',
      showScore: true
    };
  }
  
  // Normal scoring
  if (score >= 80) {
    return { label: 'Excellent', subtitle: null, color: 'green', showScore: true };
  } else if (score >= 60) {
    return { label: 'Good', subtitle: null, color: 'green', showScore: true };
  } else if (score >= 40) {
    return { label: 'Needs Work', subtitle: null, color: 'yellow', showScore: true };
  } else {
    return { label: 'Poor', subtitle: null, color: 'red', showScore: true };
  }
}