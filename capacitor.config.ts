import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.atypik.driver',
  appName: 'Atypik Driver',
  webDir: 'public',
  server: {
    url: 'https://app.atypik-driver.com',
    errorPath: 'index.html',
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      'accounts.google.com',
      '*.google.com',
      '*.googleusercontent.com',
      '*.googleapis.com',
      '*.firebaseapp.com',
      'atypik-f78a1.firebaseapp.com',
      'atypik-driver.com',
      'www.atypik-driver.com',
      'app.atypik-driver.com',
      '*.atypik-driver.com',
    ],
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      showSpinner: false,
      androidSplashResourceName: 'splash',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
