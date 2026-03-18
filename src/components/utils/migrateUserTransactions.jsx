import { base44 } from '@/api/base44Client';

// Client-side migration helper for user's own data
// This is a lighter version that users can run from the app

const CATEGORY_MIGRATION_MAP = {
  'rent': { category: 'Home Expenses', subCategory: 'Rent', icon: '🏠' },
  'mortgage': { category: 'Home Expenses', subCategory: 'Rent', icon: '🏠' },
  'housing': { category: 'Home Expenses', subCategory: 'Rent', icon: '🏠' },
  'electricity': { category: 'Home Expenses', subCategory: 'Electricity', icon: '💡' },
  'water': { category: 'Home Expenses', subCategory: 'Water', icon: '💧' },
  'gas': { category: 'Home Expenses', subCategory: 'Gas', icon: '🔥' },
  'wifi': { category: 'Home Expenses', subCategory: 'Wi-Fi', icon: '📶' },
  'wi-fi': { category: 'Home Expenses', subCategory: 'Wi-Fi', icon: '📶' },
  'internet': { category: 'Home Expenses', subCategory: 'Wi-Fi', icon: '📶' },
  'groceries': { category: 'Home Expenses', subCategory: 'Groceries', icon: '🛒' },
  'maintenance': { category: 'Home Expenses', subCategory: 'Maintenance', icon: '🔧' },
  'other home bills': { category: 'Home Expenses', subCategory: 'Other Home Bills', icon: '🏠' },
  'utilities': { category: 'Home Expenses', subCategory: 'Other Home Bills', icon: '💡' },
};

export async function migrateUserTransactions(onProgress) {
  try {
    // Fetch user's transactions
    const transactions = await base44.entities.Transaction.list();
    
    let migrated = 0;
    let skipped = 0;

    for (const transaction of transactions) {
      // Skip if already migrated
      if (transaction.categoryVersion === 2) {
        skipped++;
        continue;
      }

      const categoryLower = (transaction.category || '').toLowerCase().trim();
      const migration = CATEGORY_MIGRATION_MAP[categoryLower];

      if (migration) {
        // Apply migration
        await base44.entities.Transaction.update(transaction.id, {
          category: migration.category,
          subCategory: migration.subCategory,
          category_icon: migration.icon,
          categoryVersion: 2,
        });
        migrated++;
      } else {
        // Mark as v2 without changes
        await base44.entities.Transaction.update(transaction.id, {
          categoryVersion: 2,
          subCategory: null,
        });
        skipped++;
      }

      if (onProgress) {
        onProgress({ migrated, skipped, total: transactions.length });
      }
    }

    return { success: true, migrated, skipped, total: transactions.length };
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, error: error.message };
  }
}