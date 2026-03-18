import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      type, 
      title, 
      message, 
      severity = 'info',
      actionRoute = null,
      actionLabel = null,
      metadata = null,
      dedupeKey = null,
    } = await req.json();

    if (!type || !title || !message) {
      return Response.json({ 
        error: 'type, title, and message are required' 
      }, { status: 400 });
    }

    // Check for duplicate if dedupeKey provided
    if (dedupeKey) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const existing = await base44.entities.Notification.filter({
        dedupeKey: dedupeKey,
      });

      // Check if any notification with this dedupeKey was created in last 24h
      const recentDuplicate = existing.find(n => 
        new Date(n.created_date) > new Date(twentyFourHoursAgo)
      );

      if (recentDuplicate) {
        return Response.json({ 
          success: false,
          duplicate: true,
          message: 'Notification already exists',
        });
      }
    }

    // Create notification (RLS automatically sets created_by = user.email)
    const notification = await base44.entities.Notification.create({
      type,
      title,
      message,
      severity,
      actionRoute,
      actionLabel,
      metadata: metadata ? JSON.stringify(metadata) : null,
      dedupeKey,
      readAt: null,
      archivedAt: null,
    });

    return Response.json({ 
      success: true,
      notification,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});