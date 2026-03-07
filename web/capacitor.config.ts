import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mandimitra.app',
  appName: 'MANDIMITRA',
  webDir: 'out',
  server: {
    url: 'https://mandimitra-rose.vercel.app',
    androidScheme: 'https',
    allowNavigation: ['mandimitra-rose.vercel.app', '*.vercel.app'],
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
