import 'dotenv/config';

export default {
  expo: {
    name: 'Zingo',
    slug: 'quoteflow',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.footprint.quoteflow',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundImage: './assets/adaptive-background.png',
        backgroundColor: '#F97316',
      },
      package: 'com.footprint.quoteflow',
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    scheme: 'quoteflow',
    plugins: [
      'expo-web-browser',
      [
        // System splash (incl. the Android 12+ SplashScreen API): the brand
        // mark on cream. The full logo+name+tagline lockup is shown right after
        // launch by the in-app <BrandSplash> overlay (Android 12 only allows a
        // centered, circle-masked icon here — never a wide lockup).
        'expo-splash-screen',
        {
          image: './assets/splash-mark.png',
          imageWidth: 120,
          resizeMode: 'contain',
          backgroundColor: '#fcf9f4',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#F97316',
          androidMode: 'default',
        },
      ],
    ],
    extra: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      REMOVE_BG_API_KEY: process.env.REMOVE_BG_API_KEY,
      // Public Razorpay key id only. The key SECRET and webhook secret live
      // in Supabase Edge Function secrets — never in the app bundle.
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
      eas: {
        projectId: process.env.EAS_PROJECT_ID,
      },
    },
  },
};
