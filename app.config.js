import 'dotenv/config';

export default {
  expo: {
    name: 'QuoteFlow',
    slug: 'quoteflow',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#fcf9f4',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.yourcompany.quoteflow',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#fcf9f4',
      },
      package: 'com.yourcompany.quoteflow',
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
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#9d3d2c',
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
