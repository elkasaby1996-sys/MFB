import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { limit = 50, unreadOnly = false } = await req.json();

    // Build filter - RLS ensures only user's notifications
    const filter = {};
    if (unreadOnly) {
      filter.readAt = null;
    }

    const notifications = await base44.entities.Notification.filter(
      filter,
      '-created_date',
      limit
    );

    return Response.json({
      notifications,
      count: notifications.length,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});