import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';

const { height: SCREEN_H } = Dimensions.get('window');
// ponytail: scale card down on short screens so it never overflows into button area
const CARD_WIDTH = Math.min(248, Math.floor(SCREEN_H * 0.3));
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import { showAlert } from '../../store/alertStore';

// Sample cards for the auto-cycling preview deck. Gradients use the Zingo
// brand ramp (amber → orange → rose).
const SAMPLES = [
  {
    tag: 'GOOD MORNING',
    quote: 'The simplest moments often hold the most profound weight.',
    author: 'A. RIVERA',
    colors: ['#FBBF24', '#F97316'] as const,
  },
  {
    tag: 'MOTIVATION',
    quote: 'Begin again. Every sunrise is a quiet invitation to start.',
    author: 'M. OKAFOR',
    colors: ['#F97316', '#E11D48'] as const,
  },
  {
    tag: 'LIFE',
    quote: 'You are the story you keep choosing to tell yourself.',
    author: 'S. KAPOOR',
    colors: ['#E11D48', '#9d3d2c'] as const,
  },
];

const CYCLE_MS = 2800; // time each card stays in front
const ANIM_MS = 600; // duration of the advance animation

// Visual params per stack position, indexed by position + 1 so we can address
// the exit (-1) and incoming (3) slots too: [exit, front, mid, back, incoming].
const POS = [
  { ty: -84, scale: 1.04, rot: -9, op: 0 },
  { ty: 0, scale: 1.0, rot: -3, op: 1 },
  { ty: 16, scale: 0.92, rot: 4, op: 1 },
  { ty: 30, scale: 0.84, rot: -4, op: 0.85 },
  { ty: 44, scale: 0.78, rot: 3, op: 0 },
];
const slot = (p: number) => POS[p + 1];

function QuoteDeck() {
  const [index, setIndex] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(anim, {
        toValue: 1,
        duration: ANIM_MS,
        // JS-driven on purpose: the per-cycle reset (setValue(0) in the layout
        // effect below) must apply atomically with the new index in one commit.
        // With the native driver the reset and the new interpolation configs are
        // separate UI-thread commands and intermittently tear → one-frame flicker.
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) setIndex((i) => (i + 1) % SAMPLES.length);
      });
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [anim]);

  // Reset the animation in the SAME commit as the new index (before paint), so
  // the end-of-cycle frame and the reset frame render identical output. Doing
  // this in the timing callback instead races the re-render and flickers.
  useLayoutEffect(() => {
    anim.setValue(0);
  }, [index, anim]);

  // Render 4 layers (back → front). The 4th duplicates the exiting card so the
  // loop is seamless: as slot j animates to slot j-1, slot j-1 starts the next
  // tick exactly where j left off.
  return (
    <View style={styles.deck}>
      {[3, 2, 1, 0].map((j) => {
        const sample = SAMPLES[(index + j) % SAMPLES.length];
        const from = slot(j);
        const to = slot(j - 1);
        const animatedStyle = {
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [from.op, to.op] }),
          zIndex: 10 - j,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [from.ty, to.ty] }) },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [from.scale, to.scale] }) },
            {
              rotate: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [`${from.rot}deg`, `${to.rot}deg`],
              }),
            },
          ],
        };
        return (
          <Animated.View key={j} style={[styles.deckCard, animatedStyle]}>
            <LinearGradient
              colors={sample.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.deckImage}
            >
              <Text style={styles.deckTag}>{sample.tag}</Text>
            </LinearGradient>
            <View style={styles.cardContent}>
              <Text style={styles.cardQuote} numberOfLines={3}>
                “{sample.quote}”
              </Text>
              <View style={styles.cardDividerRow}>
                <View style={styles.cardDivider} />
                <Text style={styles.cardAuthor}>{sample.author}</Text>
              </View>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { signInWithGoogle, signInAsGuest } = useAuth();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingGuest, setLoadingGuest] = useState(false);

  const handleGoogle = async () => {
    try {
      setLoadingGoogle(true);
      await signInWithGoogle();
    } catch {
      showAlert('Sign in failed', 'Could not sign in with Google. Please try again.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleGuest = async () => {
    try {
      setLoadingGuest(true);
      await signInAsGuest();
    } catch {
      showAlert('Sign in failed', 'Could not continue as guest. Please try again.');
    } finally {
      setLoadingGuest(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { paddingBottom: Math.max(insets.bottom, 16) }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fcf9f4" />

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroText}>
          Daily Status,{'\n'}
          In Your <Text style={styles.heroAccent}>Style</Text>
        </Text>
      </View>

      {/* Auto-cycling card preview */}
      <QuoteDeck />

      {/* Auth Buttons */}
      <View style={styles.buttonGroup}>
        {/* Google Sign In */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogle}
          activeOpacity={0.85}
          disabled={loadingGoogle || loadingGuest}
        >
          {loadingGoogle ? (
            <ActivityIndicator size="small" color="#1c1c19" />
          ) : (
            <>
              <Image
                source={{ uri: 'https://www.google.com/favicon.ico' }}
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Guest / Skip */}
        <LinearGradient
          colors={['#9d3d2c', '#bd5541']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientWrapper}
        >
          <TouchableOpacity
            style={styles.gradientButton}
            onPress={handleGuest}
            activeOpacity={0.85}
            disabled={loadingGoogle || loadingGuest}
          >
            {loadingGuest ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.gradientButtonText}>Browse as Guest</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        By continuing, you agree to our{' '}
        <Text style={styles.footerLink}>Terms</Text>
        {' '}and{' '}
        <Text style={styles.footerLink}>Privacy</Text>.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fcf9f4',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  hero: {
    alignItems: 'center',
    gap: 4,
    marginTop: 24, // 24px below the status bar (safe-area top inset is added by SafeAreaView)
  },
  heroText: {
    fontSize: 36,
    fontWeight: '600',
    color: '#1c1c19',
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: -0.8,
    paddingHorizontal: 16,
  },
  heroAccent: {
    color: '#9d3d2c',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  deck: {
    flex: 1, // fills the space between the hero and the buttons
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  deckCard: {
    position: 'absolute',
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#1c1c19',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(221,192,187,0.15)',
    padding: 12,
    gap: 10,
  },
  deckImage: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 12,
  },
  deckTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.95)',
  },
  cardContent: {
    paddingHorizontal: 4,
    gap: 4,
  },
  cardQuote: {
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 19,
    color: '#1c1c19',
  },
  cardDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  cardDivider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(221,192,187,0.3)',
  },
  cardAuthor: {
    fontSize: 10,
    color: '#89726d',
    letterSpacing: 2,
    fontWeight: '600',
  },
  buttonGroup: {
    width: '100%',
    paddingHorizontal: 8,
    gap: 12,
    zIndex: 10,
  },
  googleButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#f6f3ee',
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(221,192,187,0.2)',
  },
  googleIcon: {
    width: 16,
    height: 16,
    borderRadius: 2,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1c19',
  },
  gradientWrapper: {
    borderRadius: 9999,
    shadowColor: '#9d3d2c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientButton: {
    width: '100%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  footer: {
    fontSize: 10,
    color: '#89726d',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 16,
    marginTop: 24, // 24px above the footer → below the buttons
    marginBottom: 24,
  },
  footerLink: {
    textDecorationLine: 'underline',
  },
});
