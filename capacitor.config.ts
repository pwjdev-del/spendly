import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.spendly.app',
  appName: 'Spendly',
  webDir: 'public',
  server: {
    // For development, use your local Next.js server
    // For production, replace with your deployed URL (e.g., 'https://spendly.vercel.app')
    url: 'http://localhost:3000',
    cleartext: true // Required for non-HTTPS localhost
  }
};

export default config;
