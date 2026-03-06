import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signInWithGoogle, signInWithApple, signInWithMagicLink } from '@/lib/auth';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRIMARY = '#1E40AF';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  const handleMagicLink = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    const { error } = await signInWithMagicLink(email);
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setMagicLinkSent(true);
    }
  };

  const handleGoogle = async () => {
    setSocialLoading('google');
    const { error } = await signInWithGoogle();
    setSocialLoading(null);
    if (error) Alert.alert('Error', 'Failed to sign in with Google.');
  };

  const handleApple = async () => {
    setSocialLoading('apple');
    const { error } = await signInWithApple();
    setSocialLoading(null);
    if (error) Alert.alert('Error', 'Failed to sign in with Apple.');
  };

  if (magicLinkSent) {
    return (
      <View style={styles.checkEmailContainer}>
        <View style={styles.emailIconContainer}>
          <Ionicons name="mail" size={40} color="#059669" />
        </View>
        <Text style={styles.checkEmailTitle}>Check Your Email</Text>
        <Text style={styles.checkEmailBody}>
          We sent a magic link to{'\n'}
          <Text style={styles.emailHighlight}>{email}</Text>
          {'\n\n'}Tap the link in your email to sign in instantly.
        </Text>
        <TouchableOpacity
          onPress={() => setMagicLinkSent(false)}
          style={styles.differentEmailBtn}
        >
          <Text style={styles.differentEmailText}>Use Different Email</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoSection}>
              <View style={styles.logoContainer}>
                <Ionicons name="shield-checkmark" size={36} color={PRIMARY} />
              </View>
              <Text style={styles.logoText}>
                Gov<Text style={{ color: PRIMARY }}>Pass</Text>
              </Text>
            </View>

            {/* Heading */}
            <View style={styles.headingSection}>
              <Text style={styles.heading}>Welcome back</Text>
              <Text style={styles.headingSubtext}>
                Sign in to access your benefits dashboard.
              </Text>
            </View>

            {/* Social buttons */}
            <View style={styles.socialSection}>
              <TouchableOpacity
                onPress={handleApple}
                disabled={socialLoading !== null}
                style={[styles.appleBtn, { opacity: socialLoading === 'apple' ? 0.7 : 1 }]}
                activeOpacity={0.85}
              >
                {socialLoading === 'apple' ? (
                  <ActivityIndicator color="#000000" size="small" />
                ) : (
                  <Ionicons name="logo-apple" size={20} color="#000000" />
                )}
                <Text style={styles.appleBtnText}>Continue with Apple</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleGoogle}
                disabled={socialLoading !== null}
                style={[styles.googleBtn, { opacity: socialLoading === 'google' ? 0.7 : 1 }]}
                activeOpacity={0.85}
              >
                {socialLoading === 'google' ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="logo-google" size={20} color="#FFFFFF" />
                )}
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email */}
            <View style={styles.emailSection}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#636366"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.emailInput, email ? styles.emailInputActive : null]}
              />

              <TouchableOpacity
                onPress={handleMagicLink}
                disabled={loading || !email}
                style={[styles.magicLinkBtn, !email && styles.magicLinkBtnDisabled]}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="mail" size={18} color={email ? '#FFFFFF' : '#636366'} />
                    <Text style={[styles.magicLinkBtnText, !email && styles.magicLinkBtnTextDisabled]}>
                      Send Magic Link
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Sign up */}
            <View style={styles.signupRow}>
              <Text style={styles.signupRowText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/onboarding/signup')}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  checkEmailContainer: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emailIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  checkEmailTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  checkEmailBody: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emailHighlight: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  differentEmailBtn: {
    borderWidth: 1,
    borderColor: '#38383A',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  differentEmailText: {
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '600',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: PRIMARY,
    marginBottom: 14,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  logoText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  headingSection: {
    marginBottom: 28,
  },
  heading: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 6,
  },
  headingSubtext: {
    fontSize: 15,
    color: '#8E8E93',
  },
  socialSection: {
    gap: 12,
    marginBottom: 24,
  },
  appleBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  appleBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  googleBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#3A3A3C',
  },
  googleBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#3A3A3C',
  },
  dividerText: {
    color: '#636366',
    fontSize: 13,
    fontWeight: '500',
  },
  emailSection: {
    gap: 12,
    marginBottom: 24,
  },
  inputLabel: {
    color: '#EBEBF5',
    fontSize: 14,
    fontWeight: '600',
  },
  emailInput: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#3A3A3C',
  },
  emailInputActive: {
    borderColor: PRIMARY,
  },
  magicLinkBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  magicLinkBtnDisabled: {
    backgroundColor: '#2C2C2E',
    shadowOpacity: 0,
    elevation: 0,
  },
  magicLinkBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  magicLinkBtnTextDisabled: {
    color: '#636366',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  signupRowText: {
    color: '#8E8E93',
    fontSize: 15,
  },
  signupLink: {
    color: PRIMARY,
    fontSize: 15,
    fontWeight: '600',
  },
});
