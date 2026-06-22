import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import { showAlert } from '../../store/alertStore';

export default function WelcomeScreen() {
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
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fcf9f4" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brandName}>Zingo</Text>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.welcomeLabel}>WELCOME</Text>
        <Text style={styles.heroText}>Your photo.{'\n'}Your words.{'\n'}Every day.</Text>
      </View>

      {/* Card Preview */}
      <View style={styles.cardWrapper}>
        <View style={styles.cardDecor} />
        <View style={styles.card}>
          <View style={styles.cardImageContainer}>
            <Image
              source={{ uri: 'https://placehold.co/400x600/f6f3ee/9d3d2c?text=Good+Morning' }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardQuote}>
              "The simplest moments often hold the most profound weight."
            </Text>
            <View style={styles.cardDividerRow}>
              <View style={styles.cardDivider} />
              <Text style={styles.cardAuthor}>A. RIVERA</Text>
            </View>
          </View>
        </View>
      </View>

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
  header: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 24,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#9d3d2c',
    letterSpacing: -0.5,
  },
  hero: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  welcomeLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
    color: '#56423e',
    textTransform: 'uppercase',
  },
  heroText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1c1c19',
    textAlign: 'center',
    lineHeight: 38,
    paddingHorizontal: 16,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
    marginBottom: 24,
  },
  cardDecor: {
    position: 'absolute',
    inset: -4,
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    backgroundColor: 'rgba(219,227,197,0.3)',
    borderRadius: 16,
    transform: [{ rotate: '-1deg' }],
    zIndex: 0,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#1c1c19',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(221,192,187,0.15)',
    padding: 12,
    gap: 12,
    zIndex: 1,
  },
  cardImageContainer: {
    aspectRatio: 4 / 5,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0ede9',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    paddingHorizontal: 4,
    gap: 4,
  },
  cardQuote: {
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 20,
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
    marginBottom: 12,
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
    paddingBottom: 16,
  },
  footerLink: {
    textDecorationLine: 'underline',
  },
});
