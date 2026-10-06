import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.skinlab.pos',
  appName: 'Skin-Lab POS',
  webDir: 'public',
  server: {
    url: 'https://skinlabb.vercel.app',
    cleartext: true
  }
};

export default config;
