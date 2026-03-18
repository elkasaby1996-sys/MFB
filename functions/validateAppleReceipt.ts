import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const VALID_PRODUCT_IDS = new Set([
  'com.myfinancebro.pro.monthly',
  'com.myfinancebro.elite.monthly',
]);

const TIER_MAP = {
  'com.myfinancebro.pro.monthly':   'pro',
  'com.myfinancebro.elite.monthly': 'elite',
};

// Apple's expected bundle ID — reject receipts for any other app
const EXPECTED_BUNDLE_ID = 'com.myfinancebro.app';

async function callAppleVerifyReceipt(receiptData, sharedSecret, useSandbox) {
  const url = useSandbox
    ? 'https://sandbox.itunes.apple.com/verifyReceipt'
    : 'https://buy.itunes.apple.com/verifyReceipt';

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'receipt-data': receiptData,
      'password': sharedSecret,
      'exclude-old-transactions': true,
    }),
  });

  return res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // ── Require authenticated user ────────────────────────────────────────
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sharedSecret = Deno.env.get('APPLE_SHARED_SECRET');
    if (!sharedSecret) {
      return Response.json({ error: 'Apple shared secret not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { receipt_data, transaction_id, product_id } = body;

    if (!receipt_data || typeof receipt_data !== 'string') {
      return Response.json({ error: 'receipt_data is required' }, { status: 400 });
    }

    // Reject obviously invalid client-supplied product IDs early
    if (product_id && !VALID_PRODUCT_IDS.has(product_id)) {
      return Response.json({ success: false, error: 'Product not recognized' }, { status: 400 });
    }

    // ── Call Apple's verification endpoint ────────────────────────────────
    let appleData = await callAppleVerifyReceipt(receipt_data, sharedSecret, false);

    // 21007 = receipt was created in sandbox; retry against sandbox endpoint
    if (appleData.status === 21007) {
      appleData = await callAppleVerifyReceipt(receipt_data, sharedSecret, true);
    }

    if (appleData.status !== 0) {
      return Response.json({
        success: false,
        error: 'Apple rejected receipt',
        apple_status: appleData.status,
      }, { status: 400 });
    }

    // ── Bundle ID check ───────────────────────────────────────────────────
    const bundleId = appleData.receipt?.bundle_id;
    if (bundleId !== EXPECTED_BUNDLE_ID) {
      return Response.json({
        success: false,
        error: 'Bundle ID mismatch',
      }, { status: 400 });
    }

    // ── Find active entitlement ───────────────────────────────────────────
    const allReceiptInfo = appleData.latest_receipt_info || [];

    // Sort descending by expiry so latest is first
    const sorted = [...allReceiptInfo].sort(
      (a, b) => parseInt(b.expires_date_ms) - parseInt(a.expires_date_ms)
    );

    // Only consider receipts for our allowed product IDs
    const eligible = sorted.filter(
      (r) => VALID_PRODUCT_IDS.has(r.product_id)
    );

    if (!eligible.length) {
      return Response.json({ success: false, error: 'No eligible subscription found' }, { status: 400 });
    }

    const latest = eligible[0];
    const latestProductId         = latest.product_id;
    const latestOriginalTxId      = latest.original_transaction_id;
    const expiresMs               = parseInt(latest.expires_date_ms);
    const expiresDate             = new Date(expiresMs);
    const isActive                = expiresDate > new Date();

    // ── Cross-user replay protection ──────────────────────────────────────
    // Check if this original_transaction_id is already bound to a DIFFERENT user
    const existingProfiles = await base44.asServiceRole.entities.UserProfile.filter({
      apple_original_transaction_id: latestOriginalTxId,
    });

    for (const ep of existingProfiles) {
      if (ep.created_by !== user.email) {
        // This transaction ID is bound to another account — reject
        return Response.json({
          success: false,
          error: 'Transaction already associated with a different account',
        }, { status: 403 });
      }
    }

    // ── Derive canonical tier ─────────────────────────────────────────────
    const grantedTier = isActive ? (TIER_MAP[latestProductId] || 'free') : 'free';

    // ── Update user profile with server-verified state ────────────────────
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({
      created_by: user.email,
    });

    if (profiles.length > 0) {
      await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
        plan_tier:                     grantedTier,
        apple_original_transaction_id: latestOriginalTxId,
        subscription_expires_at:       expiresDate.toISOString(),
        subscription_payment_issue:    false,
      });
    }

    return Response.json({
      success: true,
      plan_tier: grantedTier,
      expires_at: expiresDate.toISOString(),
      is_active: isActive,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});