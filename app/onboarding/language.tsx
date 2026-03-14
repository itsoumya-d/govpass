import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth';

const PRIMARY = '#1E40AF';

const languages = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇺🇸',
    description: 'Continue in English',
  },
  {
    code: 'es',
    label: 'Spanish',
    nativeLabel: 'Español',
    flag: '🇲🇽',
    description: 'Continuar en Español',
  },
];

export default function LanguageScreen() {
  const { setLanguage } = useAuthStore();
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    setLanguage(selected);
    router.push('/onboarding/household');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="globe-outline" size={32} color={PRIMARY} />
          </View>
          <Text style={styles.title}>Choose Your Language</Text>
          <Text style={styles.subtitle}>
            Select the language you'd like to use.{'\n'}
            Seleccione el idioma que desea usar.
          </Text>
        </View>

        {/* Language Cards */}
        <View style={styles.cardsContainer}>
          {languages.map((lang) => {
            const isSelected = selected === lang.code;
            return (
              <TouchableOpacity accessibilityRole="button"
                key={lang.code}
                onPress={() => setSelected(lang.code)}
                style={[
                  styles.languageCard,
                  isSelected && styles.languageCardSelected,
                ]}
                activeOpacity={0.8}
              >
                <View style={styles.cardLeft}>
                  <Text style={styles.flagEmoji}>{lang.flag}</Text>
                  <View style={styles.cardTextContainer}>
                    <Text style={[styles.nativeLabel, isSelected && styles.selectedText]}>
                      {lang.nativeLabel}
                    </Text>
                    <Text style={styles.description}>{lang.description}</Text>
                  </View>
                </View>

                {/* Checkmark */}
                <View
                  style={[
                    styles.checkCircle,
                    isSelected && styles.checkCircleSelected,
                  ]}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Continue Button */}
        <TouchableOpacity accessibilityRole="button"
          onPress={handleContinue}
          disabled={!selected}
          style={[styles.continueButton, !selected && styles.continueButtonDisabled]}
          activeOpacity={0.85}
        >
          <Text style={[styles.continueButtonText, !selected && styles.continueButtonTextDisabled]}>
            Continue
          </Text>
          <Ionicons
            name="arrow-forward"
            size={18}
            color={selected ? '#FFFFFF' : '#636366'}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 64, 175, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.3)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
  cardsContainer: {
    gap: 16,
  },
  languageCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#38383A',
  },
  languageCardSelected: {
    borderColor: '#1E40AF',
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  flagEmoji: {
    fontSize: 40,
  },
  cardTextContainer: {
    gap: 4,
  },
  nativeLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectedText: {
    color: '#60A5FA',
  },
  description: {
    fontSize: 15,
    color: '#8E8E93',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#38383A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  continueButton: {
    backgroundColor: '#1E40AF',
    paddingVertical: 17,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#2C2C2E',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  continueButtonTextDisabled: {
    color: '#636366',
  },
});
