// Primary categories for transaction picker
export const PRIMARY_CATEGORIES = [
  { name: 'Home Expenses', icon: '🏠' },
  { name: 'Food', icon: '🍔' },
  { name: 'Transport', icon: '🚗' },
  { name: 'Fun', icon: '🎮' },
  { name: 'Shopping', icon: '🛍️' },
  { name: 'Health', icon: '🏥' },
  { name: 'Education', icon: '📚' },
  { name: 'Subscriptions', icon: '📱' },
  { name: 'Travel', icon: '✈️' },
  { name: 'Gifts', icon: '🎁' },
  { name: 'Savings', icon: '🏦' },
  { name: 'Debt', icon: '💳' },
  { name: 'Remittance', icon: '💸' },
  { name: 'Other (Expense)', icon: '📦' },
];

// Home Expenses sub-categories (level 2)
export const HOME_SUBCATEGORIES = [
  { name: 'Rent', icon: '🏠' },
  { name: 'Electricity', icon: '💡' },
  { name: 'Water', icon: '💧' },
  { name: 'Gas', icon: '🔥' },
  { name: 'Wi-Fi', icon: '📶' },
  { name: 'Groceries', icon: '🛒' },
  { name: 'Maintenance', icon: '🔧' },
  { name: 'Other Home Bills', icon: '📄' },
];

// Income categories
export const INCOME_CATEGORIES = [
  { name: 'Salary', icon: '💼' },
  { name: 'Freelance', icon: '💻' },
  { name: 'Side Hustle', icon: '🚀' },
  { name: 'Business Income', icon: '🏢' },
  { name: 'Investments', icon: '📈' },
  { name: 'Gifts / Support', icon: '🎁' },
  { name: 'Refunds', icon: '↩️' },
  { name: 'Savings', icon: '🏦' },
  { name: 'Other (Income)', icon: '💰' },
];

// Helper: Check if category requires sub-category
export const requiresSubCategory = (category) => {
  return category === 'Home Expenses';
};

// Helper: Get icon for home sub-category
export const getHomeSubCategoryIcon = (subCategory) => {
  const found = HOME_SUBCATEGORIES.find(sc => sc.name === subCategory);
  return found?.icon || '🏠';
};

// Helper: Validate category + subCategory combination
export const validateCategoryStructure = (category, subCategory) => {
  if (category === 'Home Expenses') {
    if (!subCategory) {
      return { valid: false, error: 'Home Expenses requires a sub-category' };
    }
    const validSubCat = HOME_SUBCATEGORIES.find(sc => sc.name === subCategory);
    if (!validSubCat) {
      return { valid: false, error: 'Invalid home sub-category' };
    }
  } else {
    if (subCategory) {
      return { valid: false, error: 'Only Home Expenses can have sub-categories' };
    }
  }
  return { valid: true };
};