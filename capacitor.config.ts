import type { CapacitorConfig } from '@capacitor/cli';

const base44AppUrl =
  process.env.CAPACITOR_SERVER_URL ??
  process.env.BASE44_APP_URL ??
  'https://my-finance-bro-c7438db0.base44.app';

const config: CapacitorConfig = {
  appId: 'com.syslab.myfinancebro',
  appName: 'MyFinanceBro',
  webDir: 'dist',
  backgroundColor: '#020617',
  ios: {
    contentInset: 'never',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
  server: {
    url: base44AppUrl,
    cleartext: false,
    androidScheme: 'https',
  },
};

export default config;
