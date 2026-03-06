import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/auth';

export default function Index() {
  const { session, loading, onboardingComplete } = useAuthStore();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1C1C1E' }}>
        <ActivityIndicator color="#1E40AF" size="large" />
      </View>
    );
  }

  if (!onboardingComplete) return <Redirect href="/onboarding/welcome" />;
  if (!session) return <Redirect href="/auth/login" />;
  return <Redirect href="/(tabs)" />;
}
