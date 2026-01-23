import type { CapacitorConfig } from '@capacitor/cli';
import dotenv from 'dotenv';

dotenv.config();

const googleClientId =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  process.env.GOOGLE_CLIENT_ID ||
  '';

const config: CapacitorConfig = {
  appId: 'com.fashionhub.app',
  appName: 'FashionHub',
  webDir: 'out',
  server: {
    androidScheme: 'http',
    hostname: 'localhost',
    cleartext: true,
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: googleClientId,
    },
  },
};

export default config;
