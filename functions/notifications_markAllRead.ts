import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all unread notifications (RLS filtered)
    const unreadNotifications = await base44.entities.Notification.filter({
      readAt: null,
    });

    const now = new Date().toISOString();

    // Mark all as read
    const updates = unreadNotifications.map(notification =>
      base44.entities.Notification.update(notification.id, {
        readAt: now,
      })
    );

    await Promise.all(updates);

    return Response.json({ 
      success: true,
      marked: unreadNotifications.length,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});