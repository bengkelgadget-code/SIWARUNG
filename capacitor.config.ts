import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.siwarung.app',
  appName: 'SIWARUNG',
  webDir: 'dist',
  server: {
    allowNavigation: ['*']
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
