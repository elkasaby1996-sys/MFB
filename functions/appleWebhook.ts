import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { importX509, jwtVerify } from 'npm:jose@5.9.6';
import { X509Certificate } from 'npm:@peculiar/x509@1.12.3';

// ── Pinned Apple PKI Subject Distinguished Name fragments ──────────────────
// These are stable, publicly documented values from Apple's Certificate Authority.
// Source: https://www.apple.com/certificateauthority/
const APPLE_ROOT_CA_SUBJECT_FRAGMENT   = 'Apple Root CA - G3';
const APPLE_WWDR_SUBJECT_FRAGMENT      = 'Apple Worldwide Developer Relations';

const VALID_PRODUCT_IDS = new Set([
  'com.myfinancebro.pro.monthly',
  'com.myfinancebro.elite.monthly',
]);

const UPGRADE_EVENTS       = new Set(['SUBSCRIBED', 'DID_RENEW', 'INITIAL_BUY']);
const BILLING_RETRY_EVENTS = new Set(['BILLING_RETRY_PERIOD', 'GRACE_PERIOD_EXPIRED']);
// Only documented App Store Server Notification types — 'CANCEL' is not a real Apple event type
const CANCEL_EVENTS        = new Set(['DID_FAIL_TO_RENEW', 'EXPIRED', 'REVOKE']);

// ── Certificate chain validation ───────────────────────────────────────────
/**
 * Validates the x5c certificate chain from an Apple JWS:
 *   x5c[0] = leaf (signed by x5c[1])
 *   x5c[1] = Apple WWDR intermediate (signed by x5c[2])
 *   x5c[2] = Apple Root CA G3 (self-signed / trust anchor)
 *
 * Enforces:
 *   - Minimum 2 certs in chain
 *   - Each cert's validity window (notBefore / notAfter)
 *   - Cryptographic signature: each cert verified against its issuer
 *   - Pinned Subject DN for WWDR intermediate and Root CA
 */
async function verifyAppleCertChain(x5cArray) {
  if (!Array.isArray(x5cArray) || x5cArray.length < 2) {
    throw new Error('x5c must contain at least 2 certs');
  }

  const certs = x5cArray.map((b64) => {
    const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return new X509Certificate(der);
  });

  const now = new Date();

  // 1. Validity dates for all certs
  for (const cert of certs) {
    if (now < new Date(cert.notBefore) || now > new Date(cert.notAfter)) {
      throw new Error(`Certificate not valid at current time: subject=${cert.subject}`);
    }
  }

  // 2. Signature chain: verify cert[i] was signed by cert[i+1]
  for (let i = 0; i < certs.length - 1; i++) {
    let verified;
    try {
      verified = await certs[i].verify({ issuerCertificate: certs[i + 1] });
    } catch {
      verified = false;
    }
    if (!verified) {
      throw new Error(`Cert chain broken at index ${i}: leaf not signed by issuer`);
    }
  }

  // 3. Pin the trust anchor (root CA) by known Apple DN
  const rootSubject = certs[certs.length - 1].subject || '';
  if (!rootSubject.includes(APPLE_ROOT_CA_SUBJECT_FRAGMENT)) {
    throw new Error(`Root cert subject mismatch. Got: ${rootSubject}`);
  }

  // 4. Pin intermediate (WWDR) if present as x5c[1] in a 3-cert chain
  if (certs.length >= 3) {
    const wwdrSubject = certs[certs.length - 2].subject || '';
    if (!wwdrSubject.includes(APPLE_WWDR_SUBJECT_FRAGMENT)) {
      throw new Error(`Intermediate cert subject mismatch. Got: ${wwdrSubject}`);
    }
  }
}

// ── JWS verification ───────────────────────────────────────────────────────
function b64urlToB64(str) {
  return str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - str.length % 4) % 4);
}

async function verifyAppleJws(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWS structure');

  let header;
  try {
    header = JSON.parse(atob(b64urlToB64(parts[0])));
  } catch {
    throw new Error('Malformed JWS header');
  }

  if (header.alg !== 'ES256') {
    throw new Error(`Unexpected JWS algorithm: ${header.alg}`);
  }

  if (!Array.isArray(header.x5c) || header.x5c.length < 2) {
    throw new Error('JWS x5c header missing or too short');
  }

  // Full chain validation before using any key material
  await verifyAppleCertChain(header.x5c);

  // Verify JWS signature against leaf cert's public key
  const leafPem = `-----BEGIN CERTIFICATE-----\n${header.x5c[0]}\n-----END CERTIFICATE-----`;
  const publicKey = await importX509(leafPem, 'ES256');
  const { payload } = await jwtVerify(token, publicKey, { algorithms: ['ES256'] });
  return payload;
}

// ── Main handler ───────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    // Gate 1: shared token
    const expectedToken = Deno.env.get('APPLE_WEBHOOK_TOKEN');
    if (!expectedToken) {
      return new Response('Webhook token not configured', { status: 500 });
    }

    const authHeader  = req.headers.get('authorization') || '';
    const tokenHeader = req.headers.get('x-webhook-token') || '';
    const provided    = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : tokenHeader || null;

    if (!provided || provided !== expectedToken) {
      return new Response('Unauthorized', { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();

    let notificationType, originalTransactionId, productId, expiresDate;

    if (body.signedPayload) {
      // V2 App Store Server Notification
      let outerPayload;
      try {
        outerPayload = await verifyAppleJws(body.signedPayload);
      } catch (e) {
        return Response.json({ error: 'Invalid outer JWS: ' + e.message }, { status: 400 });
      }

      notificationType = outerPayload.notificationType;

      if (!outerPayload.data?.signedTransactionInfo) {
        return Response.json({ status: 'no_transaction_info' });
      }

      let txPayload;
      try {
        txPayload = await verifyAppleJws(outerPayload.data.signedTransactionInfo);
      } catch (e) {
        return Response.json({ error: 'Invalid transaction JWS: ' + e.message }, { status: 400 });
      }

      originalTransactionId = txPayload.originalTransactionId;
      productId             = txPayload.productId;
      expiresDate           = txPayload.expiresDate ? new Date(txPayload.expiresDate) : null;

    } else if (body.notification_type && body.unified_receipt) {
      // V1 legacy fallback
      notificationType = body.notification_type;
      const latest = body.unified_receipt?.latest_receipt_info
        ?.sort((a, b) => parseInt(b.expires_date_ms) - parseInt(a.expires_date_ms))?.[0];
      if (!latest) return Response.json({ status: 'no_receipt' });

      originalTransactionId = latest.original_transaction_id;
      productId             = latest.product_id;
      expiresDate           = latest.expires_date_ms ? new Date(parseInt(latest.expires_date_ms)) : null;

    } else {
      return Response.json({ error: 'Missing signedPayload or unified_receipt' }, { status: 400 });
    }

    // Product allowlist
    if (!productId || !VALID_PRODUCT_IDS.has(productId)) {
      return Response.json({ status: 'unknown_product' });
    }

    // Find user
    const matchedProfiles = await base44.asServiceRole.entities.UserProfile.filter({
      apple_original_transaction_id: originalTransactionId,
    });

    if (!matchedProfiles?.length) {
      return Response.json({ status: 'no_user_matched' });
    }

    const profile = matchedProfiles[0];
    let newTier = profile.plan_tier;

    if (UPGRADE_EVENTS.has(notificationType)) {
      newTier = productId.includes('elite') ? 'elite' : 'pro';
    } else if (BILLING_RETRY_EVENTS.has(notificationType)) {
      await base44.asServiceRole.entities.UserProfile.update(profile.id, {
        subscription_payment_issue: true,
      });
      return Response.json({ status: 'billing_retry_noted' });
    } else if (CANCEL_EVENTS.has(notificationType)) {
      newTier = 'free';
    }

    if (newTier !== profile.plan_tier || expiresDate) {
      await base44.asServiceRole.entities.UserProfile.update(profile.id, {
        plan_tier: newTier,
        apple_original_transaction_id: originalTransactionId,
        ...(expiresDate && { subscription_expires_at: expiresDate.toISOString() }),
        subscription_payment_issue: false,
      });
    }

    return Response.json({ status: 'processed', tier: newTier });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});