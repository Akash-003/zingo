import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguageStore } from '../../store/languageStore';

interface LanguageSelectScreenProps {
  onContinue: () => void;
}

// Shown once, right after login, before ProfileSetupScreen. Copy is bilingual
// and static (not driven by t()) since no language choice exists yet.
export default function LanguageSelectScreen({ onContinue }: LanguageSelectScreenProps) {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose your language</Text>
          <Text style={styles.titleHi}>अपनी भाषा चुनें</Text>
        </View>

        <View style={styles.options}>
          <TouchableOpacity
            style={[styles.option, language === 'en' && styles.optionActive]}
            onPress={() => setLanguage('en')}
            activeOpacity={0.85}
          >
            <Text style={[styles.optionText, language === 'en' && styles.optionTextActive]}>
              English
            </Text>
            {language === 'en' && <Ionicons name="checkmark-circle" size={22} color="#ffffff" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, language === 'hi' && styles.optionActive]}
            onPress={() => setLanguage('hi')}
            activeOpacity={0.85}
          >
            <Text style={[styles.optionText, language === 'hi' && styles.optionTextActive]}>
              हिन्दी
            </Text>
            {language === 'hi' && <Ionicons name="checkmark-circle" size={22} color="#ffffff" />}
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <LinearGradient
            colors={['#9d3d2c', '#bd5541']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientWrapper}
          >
            <TouchableOpacity style={styles.continueButton} onPress={onContinue} activeOpacity={0.85}>
              <Text style={styles.continueButtonText}>Continue · जारी रखें</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fcf9f4',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 40,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1c1c19',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  titleHi: {
    fontSize: 18,
    color: '#56423e',
    textAlign: 'center',
  },
  options: {
    width: '100%',
    maxWidth: 360,
    gap: 14,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#89726d',
    backgroundColor: '#ffffff',
  },
  optionActive: {
    backgroundColor: '#9d3d2c',
    borderColor: '#9d3d2c',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c19',
  },
  optionTextActive: {
    color: '#ffffff',
  },
  actions: {
    width: '100%',
    maxWidth: 360,
  },
  gradientWrapper: {
    width: '100%',
    borderRadius: 9999,
    shadowColor: '#9d3d2c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  continueButton: {
    width: '100%',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
});
