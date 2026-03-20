import type { CapacitorConfig } from '@capacitor/cli';

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
    androidScheme: 'https',
  },
};

export default config;
