import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can create test users
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const testEmail = `testuser${Date.now()}@example.com`;
    
    // Invite the user
    await base44.users.inviteUser(testEmail, 'user');

    // Create UserProfile with elite subscription
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const profileResponse = await base44.asServiceRole.entities.UserProfile.create({
      name: 'Test User Elite',
      language: 'en',
      country: 'United States',
      currency: 'USD',
      plan_tier: 'elite',
      subscription_expires_at: expiresAt.toISOString(),
      onboarding_completed: true,
      created_by: testEmail,
    });

    const profileId = profileResponse.id;

    // Generate 3 months of transaction data
    const now = new Date();
    const transactions = [];
    const categories = [
      { name: 'Food & Dining', icon: '🍔' },
      { name: 'Transportation', icon: '🚗' },
      { name: 'Shopping', icon: '🛍️' },
      { name: 'Entertainment', icon: '🎬' },
      { name: 'Utilities', icon: '💡' },
      { name: 'Healthcare', icon: '⚕️' },
      { name: 'Groceries', icon: '🛒' },
      { name: 'Salary', icon: '💰', type: 'income' },
    ];

    for (let i = 0; i < 90; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Mostly expenses, occasional income
      const isIncome = Math.random() < 0.05;
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      if (isIncome || category.type === 'income') {
        transactions.push({
          type: 'income',
          category: 'Salary',
          category_icon: '💰',
          amount: 3000 + Math.random() * 500,
          currency: 'USD',
          amount_base: 3000 + Math.random() * 500,
          date: date.toISOString().split('T')[0],
          payment_method: 'bank',
          created_by: testEmail,
        });
      } else {
        transactions.push({
          type: 'expense',
          category: category.name,
          category_icon: category.icon,
          amount: 10 + Math.random() * 150,
          currency: 'USD',
          amount_base: 10 + Math.random() * 150,
          date: date.toISOString().split('T')[0],
          payment_method: Math.random() > 0.3 ? 'card' : 'cash',
          merchant: `${category.name} Store ${Math.floor(Math.random() * 5)}`,
          created_by: testEmail,
        });
      }
    }

    // Bulk create transactions
    await base44.asServiceRole.entities.Transaction.bulkCreate(transactions);

    // Create some budgets for current month
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const budgets = [
      { category: 'Food & Dining', category_icon: '🍔', amount: 400, month: currentMonth, year: currentYear, created_by: testEmail },
      { category: 'Transportation', category_icon: '🚗', amount: 300, month: currentMonth, year: currentYear, created_by: testEmail },
      { category: 'Shopping', category_icon: '🛍️', amount: 500, month: currentMonth, year: currentYear, created_by: testEmail },
      { category: 'Entertainment', category_icon: '🎬', amount: 200, month: currentMonth, year: currentYear, created_by: testEmail },
    ];

    await base44.asServiceRole.entities.Budget.bulkCreate(budgets);

    // Create a savings goal
    const goalDate = new Date(now);
    goalDate.setMonth(goalDate.getMonth() + 6);

    await base44.asServiceRole.entities.SavingsGoal.create({
      name: 'Emergency Fund',
      target_amount: 5000,
      current_amount: 1200,
      currency: 'USD',
      target_date: goalDate.toISOString().split('T')[0],
      icon: '🎯',
      color: 'cyan',
      created_by: testEmail,
    });

    return Response.json({
      success: true,
      email: testEmail,
      message: `Test user created with elite subscription and 3 months of data (${transactions.length} transactions)`,
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});