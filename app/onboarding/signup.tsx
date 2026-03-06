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
import { useAuthStore } from '@/store/auth';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRIMARY = '#1E40AF';

export default function SignupScreen() {
  const { setOnboardingComplete } = useAuthStore();
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
          {'\n\n'}Tap the link in your email to create your account.
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
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="shield-checkmark" size={36} color={PRIMARY} />
            </View>
            <Text style={styles.title}>Create your free account</Text>
            <Text style={styles.subtitle}>
              Save your eligibility results and track your applications.
            </Text>
          </View>

          {/* Encryption note */}
          <View style={styles.encryptionBanner}>
            <Ionicons name="lock-closed" size={16} color="#059669" />
            <Text style={styles.encryptionText}>
              Your data is private and protected
            </Text>
          </View>

          {/* Social buttons */}
          <View style={styles.socialSection}>
            {/* Apple */}
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

            {/* Google */}
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
            <Text style={styles.dividerText}>or continue with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email input */}
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

          {/* Already have account */}
          <View style={styles.loginRow}>
            <Text style={styles.loginRowText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.replace('/auth/login')}>
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>

          {/* Privacy note */}
          <Text style={styles.privacyNote}>
            By creating an account, you agree to our Terms of Service and Privacy Policy.
            We never sell your data.
          </Text>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
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
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  checkEmailBody: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
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
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 64, 175, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(30, 64, 175, 0.3)',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  encryptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  encryptionText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
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
    borderColor: '#38383A',
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
    backgroundColor: '#38383A',
  },
  dividerText: {
    color: '#636366',
    fontSize: 13,
    fontWeight: '500',
  },
  emailSection: {
    gap: 12,
    marginBottom: 20,
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
    borderColor: '#1E40AF',
  },
  magicLinkBtn: {
    backgroundColor: '#1E40AF',
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1E40AF',
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
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  loginRowText: {
    color: '#8E8E93',
    fontSize: 15,
  },
  loginLink: {
    color: '#1E40AF',
    fontSize: 15,
    fontWeight: '600',
  },
  privacyNote: {
    fontSize: 12,
    color: '#636366',
    textAlign: 'center',
    lineHeight: 18,
  },
});
