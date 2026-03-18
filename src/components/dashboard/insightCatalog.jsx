/**
 * Insight Catalog for Quick Insights
 * Human-written, data-driven messages with strict gating
 */

export const INSIGHT_CATALOG = {
  // === A) CASHFLOW & INCOME ===
  
  EXPENSES_EXCEED_INCOME: {
    id: 'EXPENSES_EXCEED_INCOME',
    priority: 1,
    severity: 'warning',
    icon: '⚠️',
    message_primary: "Your expenses exceeded your income this period.",
    message_secondary: "Based on the income and spending you've logged.",
    cta_label: "Review spending",
    cta_action: "SpendingLog",
    condition: (data) => {
      const { totalIncome, totalExpenses, incomeCount, expenseCount } = data;
      // MUST have both income AND expense entries
      if (incomeCount === 0 || expenseCount === 0) return false;
      return totalIncome > 0 && totalExpenses > totalIncome;
    }
  },

  NO_INCOME_LOGGED: {
    id: 'NO_INCOME_LOGGED',
    priority: 2,
    severity: 'warning',
    icon: '💰',
    message_primary: "No income recorded yet.",
    message_secondary: "Adding income helps your insights stay accurate.",
    cta_label: "Add income",
    cta_action: "add_income",
    condition: (data) => {
      const { expenseCount, incomeCount } = data;
      // MUST have expenses but NO income entries
      return expenseCount > 0 && incomeCount === 0;
    }
  },

  // === B) SAVINGS ===

  NO_SAVINGS_GOAL: {
    id: 'NO_SAVINGS_GOAL',
    priority: 3,
    severity: 'info',
    icon: '🎯',
    message_primary: "You don't have a savings goal yet.",
    message_secondary: "Goals help track progress and stay motivated.",
    cta_label: "Set a goal",
    cta_action: "Savings",
    condition: (data) => {
      const { savingsGoals, transactionCount, incomeCount } = data;
      // MUST have transactions AND income before suggesting goals
      return transactionCount > 0 && incomeCount > 0 && savingsGoals.length === 0;
    }
  },

  LOW_SAVINGS_RATE: {
    id: 'LOW_SAVINGS_RATE',
    priority: 4,
    severity: 'warning',
    icon: '📊',
    message_primary: "Your savings rate is currently low.",
    message_secondary: "This is based on your income and saved amounts.",
    cta_label: "View savings",
    cta_action: "Savings",
    condition: (data) => {
      const { totalIncome, savingsTransactions, incomeCount } = data;
      // MUST have income entries
      if (incomeCount === 0 || totalIncome === 0) return false;
      const savingsRate = (savingsTransactions / totalIncome) * 100;
      return savingsRate < 10;
    }
  },

  // === C) SPENDING BEHAVIOR ===

  HIGH_DISCRETIONARY_SPENDING: {
    id: 'HIGH_DISCRETIONARY_SPENDING',
    priority: 5,
    severity: 'info',
    icon: '🛍️',
    message_primary: "A large share of spending is discretionary.",
    message_secondary: "This includes dining, entertainment, and shopping.",
    cta_label: "View categories",
    cta_action: "SpendingLog",
    condition: (data) => {
      const { categorySpending, totalExpenses, expenseCount } = data;
      // MUST have expense entries
      if (expenseCount === 0 || totalExpenses === 0) return false;
      
      const discretionaryCategories = ['Dining', 'Entertainment', 'Shopping', 'Travel'];
      const discretionaryTotal = discretionaryCategories.reduce((sum, cat) => {
        return sum + (categorySpending[cat] || 0);
      }, 0);
      
      const discretionaryPercent = (discretionaryTotal / totalExpenses) * 100;
      return discretionaryPercent > 40;
    }
  },

  DELIVERY_HEAVY_SPENDING: {
    id: 'DELIVERY_HEAVY_SPENDING',
    priority: 6,
    severity: 'info',
    icon: '🍔',
    message_primary: "Food delivery is a major expense this period.",
    message_secondary: "Home-cooked meals usually reduce monthly costs.",
    cta_label: "View food spending",
    cta_action: "SpendingLog",
    condition: (data) => {
      const { categorySpending, totalExpenses, expenseCount } = data;
      // MUST have expense entries
      if (expenseCount === 0 || totalExpenses === 0) return false;
      
      const deliverySpending = (categorySpending['Dining'] || 0) + (categorySpending['Food'] || 0);
      const deliveryPercent = (deliverySpending / totalExpenses) * 100;
      
      return deliveryPercent > 25;
    }
  },

  // === D) SUBSCRIPTIONS ===

  SUBSCRIPTIONS_DETECTED: {
    id: 'SUBSCRIPTIONS_DETECTED',
    priority: 7,
    severity: 'info',
    icon: '🔔',
    message_primary: "You have active subscriptions.",
    message_secondary: "Some renew automatically each month.",
    cta_label: "Manage subscriptions",
    cta_action: "Subscriptions",
    condition: (data) => {
      const { activeSubscriptions } = data;
      return activeSubscriptions > 0 && activeSubscriptions <= 3;
    }
  },

  HIGH_SUBSCRIPTION_COST: {
    id: 'HIGH_SUBSCRIPTION_COST',
    priority: 8,
    severity: 'warning',
    icon: '💳',
    message_primary: "Subscriptions take up a noticeable share of income.",
    message_secondary: "Reviewing unused services could free up cash.",
    cta_label: "Review subscriptions",
    cta_action: "Subscriptions",
    condition: (data) => {
      const { totalSubscriptionCost, totalIncome, incomeCount, activeSubscriptions } = data;
      // MUST have income entries AND subscriptions
      if (incomeCount === 0 || totalIncome === 0 || activeSubscriptions === 0) return false;
      const subscriptionPercent = (totalSubscriptionCost / totalIncome) * 100;
      return subscriptionPercent > 10;
    }
  },

  // === E) BUDGETING ===

  NO_BUDGET_SET: {
    id: 'NO_BUDGET_SET',
    priority: 9,
    severity: 'info',
    icon: '📋',
    message_primary: "No budget is set yet.",
    message_secondary: "Budgets help keep spending on track.",
    cta_label: "Create budget",
    cta_action: "Budgets",
    condition: (data) => {
      const { transactionCount, expenseCount, budgets } = data;
      // MUST have expense transactions before suggesting budgets
      return transactionCount > 0 && expenseCount > 0 && budgets.length === 0;
    }
  },

  BUDGET_EXCEEDED: {
    id: 'BUDGET_EXCEEDED',
    priority: 10,
    severity: 'warning',
    icon: '⚡',
    message_primary: "You exceeded one or more budgets.",
    message_secondary: "This is based on your recent spending.",
    cta_label: "View budgets",
    cta_action: "Budgets",
    condition: (data) => {
      const { exceededBudgets, expenseCount } = data;
      // MUST have expenses to exceed budgets
      return expenseCount > 0 && exceededBudgets > 0;
    }
  },

  // === F) INVESTING & TRACKING ===

  NO_INVESTMENTS: {
    id: 'NO_INVESTMENTS',
    priority: 11,
    severity: 'info',
    icon: '📈',
    message_primary: "No investments tracked yet.",
    message_secondary: "Tracking investments helps monitor long-term progress.",
    cta_label: "Add investment",
    cta_action: "Investments",
    condition: (data) => {
      const { transactionCount, incomeCount, investments } = data;
      // MUST have income before suggesting investments
      return transactionCount > 0 && incomeCount > 0 && investments.length === 0;
    }
  },

  IRREGULAR_TRACKING: {
    id: 'IRREGULAR_TRACKING',
    priority: 12,
    severity: 'info',
    icon: '📝',
    message_primary: "Limited activity recorded this period.",
    message_secondary: "More tracking leads to better insights.",
    cta_label: "Add transaction",
    cta_action: "add_expense",
    condition: (data) => {
      const { transactionCount, daysSinceFirstTransaction } = data;
      // MUST have at least 1 transaction and be tracking for 7+ days
      if (transactionCount === 0 || daysSinceFirstTransaction < 7) return false;
      return transactionCount > 0 && transactionCount < 5;
    }
  },

  // === G) POSITIVE REINFORCEMENT ===

  CONSISTENT_TRACKING: {
    id: 'CONSISTENT_TRACKING',
    priority: 20,
    severity: 'info',
    icon: '✅',
    message_primary: "You're tracking consistently.",
    message_secondary: "Regular tracking improves insight accuracy.",
    cta_label: null,
    cta_action: null,
    condition: (data) => {
      const { transactionCount, daysSinceFirstTransaction } = data;
      // MUST have transactions and be tracking for 7+ days
      if (transactionCount === 0 || daysSinceFirstTransaction < 7) return false;
      const avgPerDay = transactionCount / daysSinceFirstTransaction;
      return avgPerDay >= 1;
    }
  },

  BALANCED_CASHFLOW: {
    id: 'BALANCED_CASHFLOW',
    priority: 21,
    severity: 'info',
    icon: '💚',
    message_primary: "Your cashflow is balanced this period.",
    message_secondary: "Income covered your spending.",
    cta_label: null,
    cta_action: null,
    condition: (data) => {
      const { totalIncome, totalExpenses, incomeCount, expenseCount } = data;
      // MUST have both income AND expense entries
      if (incomeCount === 0 || expenseCount === 0) return false;
      return totalIncome > 0 && totalExpenses > 0 && totalIncome >= totalExpenses;
    }
  }
};

/**
 * Evaluate all insights and return the top 2 based on priority
 */
export function evaluateInsights(data) {
  const matchedInsights = [];

  // Evaluate each insight condition
  for (const insight of Object.values(INSIGHT_CATALOG)) {
    if (insight.condition(data)) {
      matchedInsights.push(insight);
    }
  }

  // Sort by priority (lower number = higher priority)
  matchedInsights.sort((a, b) => a.priority - b.priority);

  // Return top 2 insights
  return matchedInsights.slice(0, 2);
}

/**
 * Check if user has sufficient data for insights
 * Returns null if absolutely NO data exists
 */
export function hasMinimumData(transactionCount, incomeCount, expenseCount, budgetCount, investmentCount) {
  // Absolute zero data check
  const hasAbsolutelyNoData = 
    transactionCount === 0 && 
    incomeCount === 0 && 
    expenseCount === 0 &&
    budgetCount === 0 &&
    investmentCount === 0;
  
  if (hasAbsolutelyNoData) {
    return null; // Signal to not render anything
  }
  
  const hasAnyData = transactionCount > 0 || budgetCount > 0 || investmentCount > 0;
  
  return {
    hasAnyData,
    hasMinimumData: transactionCount >= 3,
    isEarlyStage: transactionCount > 0 && transactionCount < 14
  };
}