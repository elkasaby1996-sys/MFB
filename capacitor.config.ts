import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.syslab.myfinancebro',
  appName: 'myFinanceBro',
  webDir: 'dist'
  server: {
       url: 'https://my-finance-bro-c7438db0.base44.app',
       cleartext: false
    }
};

export default config;
