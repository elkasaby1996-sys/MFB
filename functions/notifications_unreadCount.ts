import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RLS ensures only user's notifications are counted
    const notifications = await base44.entities.Notification.filter({
      readAt: null,
      archivedAt: null,
    });

    return Response.json({ count: notifications.length });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});