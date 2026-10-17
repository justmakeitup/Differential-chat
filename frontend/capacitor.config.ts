import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.differential.chat',
  appName: 'Differential',
  webDir: 'dist',
  backgroundColor: '#060709',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#060709'
  }
};

export default config;

