import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId } = await req.json();

    if (!notificationId) {
      return Response.json({ error: 'notificationId required' }, { status: 400 });
    }

    // Verify notification belongs to current user
    const notifications = await base44.entities.Notification.filter({ id: notificationId });
    if (!notifications || notifications.length === 0) {
      return Response.json({ error: 'Notification not found' }, { status: 404 });
    }
    if (notifications[0].created_by !== user.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await base44.entities.Notification.update(notificationId, {
      readAt: new Date().toISOString(),
    });

    return Response.json({ success: true });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});