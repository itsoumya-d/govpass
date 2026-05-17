import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/auth';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const { session, loading, onboardingComplete } = useAuthStore();
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  const [eligibilityRun, setEligibilityRun] = useState(true);

  useEffect(() => {
    if (session) {
      AsyncStorage.getItem('eligibility_run').then(val => {
        setEligibilityRun(val === 'true');
        setEligibilityChecked(true);
      });
    }
  }, [session]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1C1C1E' }}>
        <ActivityIndicator color="#1E40AF" size="large" />
      </View>
    );
  }

  if (!onboardingComplete) return <Redirect href="/onboarding/welcome" />;
  if (!session) return <Redirect href="/auth/login" />;
  if (!eligibilityChecked) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1C1C1E' }}>
        <ActivityIndicator color="#1E40AF" size="large" />
      </View>
    );
  }
  if (!eligibilityRun) return <Redirect href="/(tabs)/eligibility" />;
  return <Redirect href="/(tabs)" />;
}
