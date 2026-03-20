import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { BASE44_APP_URL, BASE44_RUNTIME, logBase44Debug } from '@/lib/base44-config';

const { appId, token, functionsVersion } = appParams;
const serverUrl = appParams.serverUrl || BASE44_APP_URL;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  serverUrl,
  token,
  functionsVersion,
  requiresAuth: false
});

logBase44Debug('Initialized Base44 client', {
  runtime: BASE44_RUNTIME,
  appId,
  serverUrl,
  hasToken: Boolean(token),
});
