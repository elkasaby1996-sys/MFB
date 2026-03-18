/**
 * Category Normalization Layer for Financial Health
 * Maps legacy and new category systems to semantic categories
 */

/**
 * Normalize a transaction to a semantic category
 * Supports both legacy categories and new Home Expenses + subCategory system
 */
export function normalizeTransaction(transaction) {
  const category = transaction.category;
  const subCategory = transaction.subCategory;
  const merchant = (transaction.merchant || '').toLowerCase();
  
  // GROCERIES
  // Legacy: category="Groceries"
  // New: category="Home Expenses" AND subCategory="Groceries"
  if (category?.toLowerCase().includes('groceries')) {
    return 'groceries';
  }
  if (category === 'Home Expenses' && subCategory === 'Groceries') {
    return 'groceries';
  }

  // CONVENIENCE FOOD (Delivery, Eating Out, Restaurants)
  const convenienceKeywords = ['delivery', 'restaurant', 'dining', 'eating out'];
  if (convenienceKeywords.some(kw => category?.toLowerCase().includes(kw))) {
    return 'convenience_food';
  }
  // Also check "Food" category - likely convenience unless explicitly groceries
  if (category?.toLowerCase() === 'food' && !subCategory) {
    return 'convenience_food';
  }

  // HOME UTILITIES
  // New: category="Home Expenses" AND subCategory IN [utilities]
  if (category === 'Home Expenses') {
    const utilitySubcategories = ['Electricity', 'Water', 'Gas', 'Wi-Fi', 'Other Home Bills'];
    if (utilitySubcategories.includes(subCategory)) {
      return 'home_utilities';
    }
    // Rent and Maintenance
    if (subCategory === 'Rent') return 'rent';
    if (subCategory === 'Maintenance') return 'home_maintenance';
  }

  // TRANSPORT
  if (category?.toLowerCase().includes('transport') || 
      category?.toLowerCase().includes('commute') ||
      category?.toLowerCase().includes('gas') ||
      category?.toLowerCase().includes('fuel')) {
    return 'transport';
  }

  // SUBSCRIPTIONS
  if (category?.toLowerCase().includes('subscription')) {
    return 'subscriptions';
  }

  // SHOPPING & IMPULSE
  if (category?.toLowerCase().includes('shopping')) {
    return 'shopping';
  }
  if (category?.toLowerCase().includes('entertainment') || 
      category?.toLowerCase().includes('fun') ||
      category?.toLowerCase().includes('hobbies') ||
      category?.toLowerCase().includes('gaming')) {
    return 'entertainment';
  }
  if (category?.toLowerCase().includes('misc') || 
      category?.toLowerCase().includes('other')) {
    return 'miscellaneous';
  }

  // TRAVEL
  const travelKeywords = ['travel', 'flight', 'hotel', 'vacation'];
  if (travelKeywords.some(kw => category?.toLowerCase().includes(kw))) {
    return 'travel';
  }

  // HEALTHCARE
  if (category?.toLowerCase().includes('health') || 
      category?.toLowerCase().includes('medical') ||
      category?.toLowerCase().includes('pharmacy')) {
    return 'healthcare';
  }

  // EDUCATION
  if (category?.toLowerCase().includes('education') || 
      category?.toLowerCase().includes('learning') ||
      category?.toLowerCase().includes('course')) {
    return 'education';
  }

  // DEFAULT: return original category as fallback
  return category?.toLowerCase() || 'uncategorized';
}

/**
 * Filter transactions by semantic category
 */
export function filterBySemanticCategory(transactions, semanticCategories) {
  if (!Array.isArray(semanticCategories)) {
    semanticCategories = [semanticCategories];
  }
  
  return transactions.filter(t => {
    const semantic = normalizeTransaction(t);
    return semanticCategories.includes(semantic);
  });
}

/**
 * Sum transactions by semantic category
 */
export function sumBySemanticCategory(transactions, semanticCategories) {
  const filtered = filterBySemanticCategory(transactions, semanticCategories);
  return filtered.reduce((sum, t) => sum + (t.amount_base || t.amount || 0), 0);
}

/**
 * Get transactions within date range
 */
export function getRecentTransactions(transactions, daysBack = 90, expenseOnly = true) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  return transactions.filter(t => {
    const dateMatch = new Date(t.date) >= cutoffDate;
    const typeMatch = expenseOnly ? t.type === 'expense' : true;
    return dateMatch && typeMatch;
  });
}