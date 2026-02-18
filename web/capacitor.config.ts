import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mandimitra.app',
  appName: 'MANDIMITRA',
  webDir: 'out',
  server: {
    // Change this to your backend server IP/URL when building the APK
    // e.g., 'http://192.168.1.100:8000' for local network
    // or 'https://api.mandimitra.com' for production
    url: undefined, // undefined = loads from local 'out' folder
    cleartext: true, // Allow HTTP (non-HTTPS) connections for local dev
  },
  android: {
    backgroundColor: '#000000',
    allowMixedContent: true,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
    },
  },
};

export default config;
