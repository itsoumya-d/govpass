import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#1E40AF';

export default function AuthCallback() {
  const { setSession, setUser } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
        setUser(session.user);
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1000);
      } else {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            setSession(session);
            setUser(session.user);
            subscription.unsubscribe();
            setTimeout(() => {
              router.replace('/(tabs)');
            }, 1000);
          }
        });

        setTimeout(() => {
          subscription.unsubscribe();
          router.replace('/auth/login');
        }, 10000);
      }
    };

    checkAuth();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#1C1C1E',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          backgroundColor: '#2C2C2E',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: PRIMARY,
          shadowColor: PRIMARY,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <Ionicons name="shield-checkmark" size={36} color={PRIMARY} />
      </View>

      <ActivityIndicator color={PRIMARY} size="large" />

      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 18, color: '#FFFFFF', fontWeight: '600' }}>Signing you in...</Text>
        <Text style={{ fontSize: 14, color: '#8E8E93' }}>Just a moment</Text>
      </View>
    </View>
  );
}
