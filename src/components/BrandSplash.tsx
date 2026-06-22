// Full-screen branded splash shown immediately after launch. The native system
// splash (expo-splash-screen) can only render a centered, circle-masked icon on
// Android 12+, so the complete logo + name + tagline lockup is displayed here
// instead — full-screen, unmasked, on every platform. It holds briefly, then
// fades out to reveal the app.

import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

interface BrandSplashProps {
  onFinish: () => void;
}

// Timings (ms): how long the lockup holds fully visible, then the fade-out.
const HOLD_DURATION = 900;
const FADE_DURATION = 350;

export default function BrandSplash({ onFinish }: BrandSplashProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;

    // Reveal this overlay by hiding the native system splash underneath it.
    SplashScreen.hideAsync().catch(() => {});

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start(() => {
        if (!cancelled) onFinish();
      });
    }, HOLD_DURATION);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [opacity, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents="none">
      <Image
        source={require('../../assets/splash-icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fcf9f4',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  logo: {
    width: '70%',
    height: 160,
  },
});
