import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { addDays, differenceInDays } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile for notification preferences
    const profiles = await base44.entities.UserProfile.filter({});
    const profile = profiles[0];

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const generated = [];

    // Check notification preferences
    const prefs = {
      bills: profile?.notification_bills ?? true,
      budgets: profile?.notification_budgets ?? true,
      debts: profile?.notification_debts ?? true,
      goals: profile?.notification_goals ?? true,
      system: profile?.notification_system ?? true,
    };

    // A) Bills - check subscriptions (home bills)
    if (prefs.bills) {
      const subscriptions = await base44.entities.Subscription.filter({
        status: 'active',
      });

      for (const sub of subscriptions) {
        if (!sub.next_due_date) continue;

        const dueDate = new Date(sub.next_due_date);
        const daysUntil = differenceInDays(dueDate, today);

        if (daysUntil < 0) {
          // Overdue
          const notif = await base44.functions.invoke('notifications_createInternal', {
            type: 'bill_due',
            title: `${sub.name} is Overdue`,
            message: `Your ${sub.name} bill was due on ${sub.next_due_date}`,
            severity: 'warning',
            actionRoute: '/home-finance',
            actionLabel: 'View Bills',
            metadata: { billId: sub.id },
            dedupeKey: `bill_due:${sub.id}:${todayStr}`,
          });
          if (notif.data?.success) generated.push(notif.data.notification);
        } else if (daysUntil <= 3 && daysUntil >= 0) {
          // Due within 3 days
          const notif = await base44.functions.invoke('notifications_createInternal', {
            type: 'bill_due',
            title: `${sub.name} Due ${daysUntil === 0 ? 'Today' : `in ${daysUntil} days`}`,
            message: `${sub.name} bill is coming up soon`,
            severity: 'info',
            actionRoute: '/home-finance',
            actionLabel: 'View Bills',
            metadata: { billId: sub.id },
            dedupeKey: `bill_due:${sub.id}:${todayStr}`,
          });
          if (notif.data?.success) generated.push(notif.data.notification);
        }
      }
    }

    // B) Budgets - check spending vs budget
    if (prefs.budgets) {
      const budgets = await base44.entities.Budget.filter({
        month: today.getMonth() + 1,
        year: today.getFullYear(),
      });

      const transactions = await base44.entities.Transaction.filter({});
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      for (const budget of budgets) {
        const spent = transactions
          .filter(t => {
            const tDate = new Date(t.date);
            return t.type === 'expense' &&
              t.category === budget.category &&
              tDate >= monthStart &&
              tDate <= monthEnd;
          })
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        const percentage = (spent / budget.amount) * 100;

        if (percentage >= 100) {
          const notif = await base44.functions.invoke('notifications_createInternal', {
            type: 'budget_alert',
            title: `${budget.category} Budget Exceeded`,
            message: `You've spent ${percentage.toFixed(0)}% of your ${budget.category} budget`,
            severity: 'warning',
            actionRoute: '/budgets',
            actionLabel: 'View Budget',
            metadata: { budgetId: budget.id },
            dedupeKey: `budget:${budget.id}:${today.getMonth()}-${today.getFullYear()}:100`,
          });
          if (notif.data?.success) generated.push(notif.data.notification);
        } else if (percentage >= 80) {
          const notif = await base44.functions.invoke('notifications_createInternal', {
            type: 'budget_alert',
            title: `${budget.category} Budget Alert`,
            message: `You've spent ${percentage.toFixed(0)}% of your ${budget.category} budget`,
            severity: 'info',
            actionRoute: '/budgets',
            actionLabel: 'View Budget',
            metadata: { budgetId: budget.id },
            dedupeKey: `budget:${budget.id}:${today.getMonth()}-${today.getFullYear()}:80`,
          });
          if (notif.data?.success) generated.push(notif.data.notification);
        }
      }
    }

    // C) Debts - check due dates
    if (prefs.debts) {
      const debts = await base44.entities.Debt.filter({
        status: 'active',
      });

      for (const debt of debts) {
        if (!debt.next_payment_date) continue;

        const dueDate = new Date(debt.next_payment_date);
        const daysUntil = differenceInDays(dueDate, today);

        if (daysUntil < 0) {
          const notif = await base44.functions.invoke('notifications_createInternal', {
            type: 'debt_due',
            title: `${debt.name} Payment Overdue`,
            message: `Payment was due on ${debt.next_payment_date}`,
            severity: 'warning',
            actionRoute: '/debt',
            actionLabel: 'View Debt',
            metadata: { debtId: debt.id },
            dedupeKey: `debt_due:${debt.id}:${todayStr}`,
          });
          if (notif.data?.success) generated.push(notif.data.notification);
        } else if (daysUntil <= 3 && daysUntil >= 0) {
          const notif = await base44.functions.invoke('notifications_createInternal', {
            type: 'debt_due',
            title: `${debt.name} Payment ${daysUntil === 0 ? 'Due Today' : `Due in ${daysUntil} days`}`,
            message: `Don't forget your ${debt.name} payment`,
            severity: 'info',
            actionRoute: '/debt',
            actionLabel: 'View Debt',
            metadata: { debtId: debt.id },
            dedupeKey: `debt_due:${debt.id}:${todayStr}`,
          });
          if (notif.data?.success) generated.push(notif.data.notification);
        }
      }
    }

    // D) Goals - check milestones
    if (prefs.goals) {
      const goals = await base44.entities.SavingsGoal.filter({});

      for (const goal of goals) {
        if (!goal.target_amount || goal.target_amount === 0) continue;

        const progress = (goal.current_amount / goal.target_amount) * 100;
        const milestones = [25, 50, 75, 100];

        for (const milestone of milestones) {
          if (progress >= milestone && progress < milestone + 5) {
            const notif = await base44.functions.invoke('notifications_createInternal', {
              type: 'goal_progress',
              title: `${goal.name} ${milestone}% Complete!`,
              message: `You've reached ${milestone}% of your ${goal.name} goal`,
              severity: 'success',
              actionRoute: '/savings',
              actionLabel: 'View Goal',
              metadata: { goalId: goal.id },
              dedupeKey: `goal:${goal.id}:${milestone}`,
            });
            if (notif.data?.success) generated.push(notif.data.notification);
          }
        }
      }
    }

    return Response.json({
      success: true,
      generated: generated.length,
      notifications: generated,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});