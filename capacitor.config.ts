import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.holamotor.app',
  appName: 'HolaMotor',
  webDir: 'dist/holamotor-taller',
  server: {
    url: 'http://orange-os-1.tail72b52c.ts.net:8080',
    cleartext: true
  }
};

export default config;
