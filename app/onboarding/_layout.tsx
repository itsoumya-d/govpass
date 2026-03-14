import { Stack, usePathname } from 'expo-router';
import { View, TouchableOpacity, Text } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const PAGES = [
  '/onboarding/welcome',
  '/onboarding/language',
  '/onboarding/household',
  '/onboarding/signup',
];

export default function OnboardingLayout() {
  const pathname = usePathname();
  const currentIndex = PAGES.indexOf(pathname);

  const handleSkip = () => {
    router.replace('/auth/login');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1C1C1E' }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header with skip button */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24, paddingTop: 8 }}>
          {currentIndex > 0 && currentIndex < PAGES.length - 1 && (
            <TouchableOpacity accessibilityRole="button" onPress={handleSkip} style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
              <Text style={{ color: '#8E8E93', fontSize: 16, fontWeight: '500' }}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stack content */}
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
        </View>

        {/* Progress dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 32, gap: 8 }}>
          {PAGES.map((_, index) => (
            <View
              key={index}
              style={{
                width: index === currentIndex ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: index === currentIndex ? '#1E40AF' : '#38383A',
              }}
            />
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}
