import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.kadig.app',
  appName: 'Kadig',
  webDir: 'dist',
  server: {
    url: 'https://kadig.com.br',
    cleartext: true
  }
};

export default config;
