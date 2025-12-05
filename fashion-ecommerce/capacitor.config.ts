import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stylecraft.app',
  appName: 'StyleCraft',
  webDir: 'out',
  server: {
    // في التطوير، يمكنك استخدام localhost
    // في الإنتاج، استخدم URL الخادم الخاص بك
    // url: 'http://localhost:3000',
    // cleartext: true,
    
    // أو اتركه فارغاً لاستخدام الملفات المحلية
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;

