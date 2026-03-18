// This endpoint has been deprecated and disabled for security reasons.
// Data deletion is handled through the authenticated deleteUserAccount function.
Deno.serve(async (_req) => {
  return Response.json(
    { error: 'This endpoint is deprecated and no longer available.' },
    { status: 403 }
  );
});