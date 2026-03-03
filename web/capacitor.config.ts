import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mandimitra.app',
  appName: 'MANDIMITRA',
  webDir: 'out',
  server: {
    // For APK builds the JS bundle already uses NEXT_PUBLIC_API_URL for API calls.
    // Leave `url` undefined so Capacitor loads the local static export from `out/`.
    // If you need the WebView to load from a remote server instead, set `url` below:
    //   url: 'http://192.168.1.100:3000',   // remote dev server
    //   url: 'https://app.mandimitra.com',   // production web app
    url: undefined,
    cleartext: true, // Allow HTTP (non-HTTPS) connections for local dev
    androidScheme: 'https', // Required for Capacitor 5+ to avoid CORS issues
  },
  android: {
    backgroundColor: '#FFFFFF',
    allowMixedContent: true,
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
