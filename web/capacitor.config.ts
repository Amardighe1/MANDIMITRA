import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mandimitra.app',
  appName: 'MANDIMITRA',
  webDir: 'out',
  server: {
    // Load UI from Vercel — any GitHub push auto-updates the app UI
    url: 'https://mandimitra-rose.vercel.app',
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#FFFFFF',
    allowMixedContent: false,
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#FFFFFF',
    },
    Keyboard: {
      resize: 'body',
      style: 'LIGHT',
    },
  },
};

export default config;
