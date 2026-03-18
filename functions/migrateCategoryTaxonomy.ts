import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Migration mapping: old category -> new structure
const CATEGORY_MIGRATION_MAP = {
  // Home-related categories -> Home Expenses + subCategory
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
  
  // Generic utilities -> Other Home Bills (fallback)
  'utilities': { category: 'Home Expenses', subCategory: 'Other Home Bills', icon: '💡' },
  
  // Categories that stay flat (no changes needed, but normalize names)
  'car maintenance': { category: 'Transport', subCategory: null, icon: '🚗' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can run migration (optional - remove if all users should be able to migrate their own data)
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if migration already completed
    const migrationFlag = await base44.asServiceRole.entities.AppConfig?.get('category_migration_v1');
    if (migrationFlag?.completed) {
      console.log('Migration already completed – skipping');
      return Response.json({ skipped: true, message: 'Migration already completed' });
    }

    // Get all transactions
    const transactions = await base44.asServiceRole.entities.Transaction.list();
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    const migrationLog = [];

    for (const transaction of transactions) {
      try {
        // Skip if already migrated (categoryVersion = 2)
        if (transaction.categoryVersion === 2) {
          skipped++;
          continue;
        }

        const categoryLower = (transaction.category || '').toLowerCase().trim();
        const migration = CATEGORY_MIGRATION_MAP[categoryLower];

        if (migration) {
          // Apply migration
          const updateData = {
            category: migration.category,
            subCategory: migration.subCategory,
            category_icon: migration.icon,
            categoryVersion: 2,
          };

          await base44.asServiceRole.entities.Transaction.update(transaction.id, updateData);
          
          migrated++;
          migrationLog.push({
            id: transaction.id,
            oldCategory: transaction.category,
            newCategory: migration.category,
            subCategory: migration.subCategory,
          });
        } else {
          // Category doesn't need migration, just mark as v2
          await base44.asServiceRole.entities.Transaction.update(transaction.id, {
            categoryVersion: 2,
            subCategory: null, // Ensure no orphaned subCategory
          });
          skipped++;
        }
      } catch (error) {
        errors++;
        migrationLog.push({
          id: transaction.id,
          error: error.message,
        });
      }
    }

    // Mark migration as completed
    await base44.asServiceRole.entities.AppConfig?.set('category_migration_v1', { completed: true });

    return Response.json({
      success: true,
      summary: {
        total: transactions.length,
        migrated,
        skipped,
        errors,
      },
      migrationLog: migrationLog.slice(0, 50), // First 50 entries
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});