import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if welcome notification already exists (by type or dedupeKey)
    const existingByType = await base44.entities.Notification.filter({ type: 'welcome' });
    if (existingByType.length > 0) {
      return Response.json({ success: false, message: 'Welcome notification already exists' });
    }

    const existingByKey = await base44.entities.Notification.filter({ dedupeKey: `welcome:${user.email}` });
    if (existingByKey.length > 0) {
      return Response.json({ success: false, message: 'Welcome notification already exists' });
    }

    // Create welcome notification
    const notification = await base44.entities.Notification.create({
      type: 'system',
      title: 'Welcome to MyFinanceBro! 👽',
      message: "Start by adding your first transaction or bill to see your financial insights come alive.",
      severity: 'info',
      actionRoute: '/dashboard',
      actionLabel: 'Get Started',
      dedupeKey: `welcome:${user.email}`,
      readAt: null,
    });

    return Response.json({ 
      success: true,
      notification,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});