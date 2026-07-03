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
      // Resize the window when the keyboard opens so bottom-anchored actions
      // (e.g. ProfileSetup's Continue button) rise to sit just above the
      // keyboard, letting the user continue without dismissing it.
      softwareKeyboardLayoutMode: 'resize',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    scheme: 'quoteflow',
    plugins: [
      'expo-web-browser',
      // Native Google Sign-In (in-app account picker). Android needs an OAuth
      // Android client registered with the build's SHA-1; iOS later needs an
      // iosUrlScheme option here.
      '@react-native-google-signin/google-signin',
      [
        // Native Truecaller OAuth (Android only). Injects the
        // com.truecaller.android.sdk.ClientId <meta-data> into AndroidManifest.
        // The clientId is baked at prebuild — set TRUECALLER_CLIENT_ID in .env
        // first. Register the build's package name + SHA-1 against this Client
        // ID in the Truecaller developer console or the consent sheet won't show.
        '@ajitpatel28/react-native-truecaller',
        { androidClientId: process.env.TRUECALLER_CLIENT_ID },
      ],
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
      // Google Web (OAuth) client ID — used as the audience for the native
      // ID token that Supabase verifies. Not the Android client ID.
      GOOGLE_WEB_CLIENT_ID: process.env.GOOGLE_WEB_CLIENT_ID,
      // Truecaller OAuth SDK 3.0 Android Client ID. Public PKCE client id —
      // safe in the bundle. The token exchange is re-verified server-side in
      // the `truecaller-auth` Edge Function (trust boundary).
      TRUECALLER_CLIENT_ID: process.env.TRUECALLER_CLIENT_ID,
      // Public Razorpay key id only. The key SECRET and webhook secret live
      // in Supabase Edge Function secrets — never in the app bundle.
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
      eas: {
        projectId: process.env.EAS_PROJECT_ID,
      },
    },
  },
};
