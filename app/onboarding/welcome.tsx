import { useEffect } from 'react';
import { View, Text, Dimensions, StatusBar, StyleSheet } from 'react-native';
import PressableScale from '@/components/PressableScale';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  FadeInDown,
  FadeInUp,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const PRIMARY = '#1D4ED8';
const BG = '#030B1A';

const FEATURES = [
  { icon: 'search-outline' as const, label: 'Benefits discovery' },
  { icon: 'camera-outline' as const, label: 'Document scan' },
  { icon: 'globe-outline' as const, label: 'Multilingual' },
];

export default function WelcomeScreen() {
  const glowOpacity = useSharedValue(0.1);
  const logoScale = useSharedValue(0.75);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 90, mass: 0.8 });
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.22, { duration: 2400 }),
        withTiming(0.1, { duration: 2400 })
      ),
      -1,
      false
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/language');
  };

  const handleSignIn = () => {
    Haptics.selectionAsync();
    router.push('/auth/login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Animated.View style={[styles.glowBlob, { backgroundColor: PRIMARY }, glowStyle]} />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`h${i}`} style={[styles.gridH, { top: (i + 1) * (height / 9) }]} />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={`v${i}`} style={[styles.gridV, { left: (i + 1) * (width / 6) }]} />
        ))}
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <View style={[styles.logoBox, { borderColor: PRIMARY, shadowColor: PRIMARY }]}>
            <Ionicons name="document-text" size={48} color={PRIMARY} />
          </View>
          <Text style={styles.appName}>
            Gov<Text style={{ color: PRIMARY }}>Pass</Text>
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).springify().damping(14)} style={styles.taglineWrap}>
          <Text style={styles.tagline}>{'Discover the benefits\nyou qualify for'}</Text>
          <Text style={styles.subtext}>
            Answer a few questions. AI matches you to government programs, guides your application, and tracks your status.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220).springify().damping(14)} style={styles.pillRow}>
          {FEATURES.map(({ icon, label }) => (
            <View key={label} style={[styles.pill, { borderColor: `${PRIMARY}55`, backgroundColor: `${PRIMARY}18` }]}>
              <Ionicons name={icon} size={14} color={PRIMARY} />
              <Text style={[styles.pillText, { color: PRIMARY }]}>{label}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify().damping(14)} style={styles.trustRow}>
          <Ionicons name="people" size={14} color={PRIMARY} />
          <Text style={styles.trustText}>  500,000+ families found benefits they didn't know about</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(350).springify().damping(14)} style={styles.ctaWrap}>
          <PressableScale
            haptic="medium"
            accessibilityRole="button"
            accessibilityLabel="Find My Benefits"
            onPress={handleGetStarted}
            style={[styles.primaryBtn, { backgroundColor: PRIMARY, shadowColor: PRIMARY }]}
          >
            <Text style={styles.primaryBtnText}>Find My Benefits</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </PressableScale>

          <PressableScale
            haptic="light"
            accessibilityRole="button"
            accessibilityLabel="Sign in to existing account"
            onPress={handleSignIn}
            style={styles.secondaryBtn}
          >
            <Text style={styles.secondaryBtnText}>Already have an account?  Sign in</Text>
          </PressableScale>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(450).duration(400)} style={styles.securityRow}>
          <Ionicons name="lock-closed" size={12} color="#34D399" />
          <Text style={styles.securityText}>  Free to use · Your data is never sold</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  glowBlob: {
    position: 'absolute',
    top: height * 0.05,
    left: width * 0.05,
    right: width * 0.05,
    height: height * 0.45,
    borderRadius: 9999,
  },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(29, 78, 216, 0.07)' },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(29, 78, 216, 0.07)' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 16 },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(29,78,216,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  appName: { fontSize: 42, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1.5 },
  taglineWrap: { alignItems: 'center', marginBottom: 24 },
  tagline: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F1F5F9',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  subtext: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 18 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
  trustRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  trustText: { color: '#475569', fontSize: 13 },
  ctaWrap: { width: '100%', gap: 12 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  secondaryBtn: { alignItems: 'center', paddingVertical: 10 },
  secondaryBtnText: { color: '#475569', fontSize: 14 },
  securityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  securityText: { color: '#374151', fontSize: 12 },
});
