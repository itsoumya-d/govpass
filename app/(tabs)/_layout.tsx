import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import AnimatedTabIcon from '@/components/AnimatedTabIcon';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();

  const activeColor = '#1D4ED8';
  const bgColor = isDark ? '#0A0F1E' : '#FFFFFF';
  const borderColor = isDark ? '#1E293B' : '#E5E7EB';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: bgColor,
          borderTopColor: borderColor,
          borderTopWidth: 0.5,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 64,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: isDark ? '#64748B' : '#94A3B8',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.2 },
      }}
      screenListeners={{
        tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} color={color}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="eligibility"
        options={{
          title: t('tabs.eligibility'),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} color={color}>
              <Ionicons name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'} size={24} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="apply"
        options={{
          title: t('tabs.apply'),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} color={color}>
              <Ionicons name={focused ? 'send' : 'send-outline'} size={24} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: t('tabs.applications'),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} color={color}>
              <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={24} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} color={color}>
              <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />

      {/* Hidden tabs — accessible via stack navigation */}
      <Tabs.Screen name="scan" options={{ href: null }} />
      <Tabs.Screen name="alerts" options={{ href: null }} />
    </Tabs>
  );
}
