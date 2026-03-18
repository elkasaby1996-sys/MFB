import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ENTITY_TYPES = [
      'Transaction', 'Budget', 'SavingsGoal', 'Investment', 'BrokerageAccount',
      'Debt', 'Subscription', 'UserMission', 'Watchlist', 'NetWorthHistory',
      'SideHustleClient', 'SideHustleProject', 'SideHustleInvoice',
      'SideHustleTransaction', 'FXRate', 'Donation', 'GivingGoal',
      'ZakatProfile', 'ManualAsset', 'Remittance', 'RemittanceGoal',
      'CountryProfile', 'Receipt', 'Notification', 'TransferLabelHistory',
      'FeatureTrial', 'UserProfile',
    ];

    const errors = [];

    for (const entityType of ENTITY_TYPES) {
      try {
        const records = await base44.asServiceRole.entities[entityType].filter(
          { created_by: user.email },
          '', 10000
        );
        for (const record of (records || [])) {
          await base44.asServiceRole.entities[entityType].delete(record.id);
        }
      } catch (err) {
        errors.push(`${entityType}: ${err.message}`);
      }
    }

    // Attempt to remove the User identity record (removes login access)
    try {
      const userRecords = await base44.asServiceRole.entities.User.filter({ email: user.email });
      if (userRecords?.length > 0) {
        await base44.asServiceRole.entities.User.delete(userRecords[0].id);
      }
    } catch (err) {
      errors.push(`User identity: ${err.message}`);
    }

    return Response.json({
      success: true,
      message: 'Account and all associated data have been permanently deleted.',
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});