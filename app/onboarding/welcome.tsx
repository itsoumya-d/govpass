import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const PRIMARY = '#1E40AF';
const SECONDARY = '#059669';

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      router.push('/onboarding/language');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    router.push('/onboarding/language');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1C1C1E' }}>
      {/* Background grid pattern */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={{
              position: 'absolute',
              top: i * (height / 20),
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: `rgba(30, 64, 175, 0.05)`,
            }}
          />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <View
            key={`v-${i}`}
            style={{
              position: 'absolute',
              left: i * (width / 12),
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: `rgba(30, 64, 175, 0.05)`,
            }}
          />
        ))}
      </View>

      {/* Blue glow */}
      <View
        style={{
          position: 'absolute',
          top: height * 0.1,
          left: width * 0.05,
          right: width * 0.05,
          height: height * 0.5,
          borderRadius: 9999,
          backgroundColor: 'rgba(30, 64, 175, 0.07)',
        }}
      />

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        {/* Logo */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            alignItems: 'center',
            marginBottom: 32,
          }}
        >
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              backgroundColor: '#2C2C2E',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: PRIMARY,
              shadowColor: PRIMARY,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              elevation: 12,
              marginBottom: 20,
            }}
          >
            <Ionicons name="shield-checkmark" size={48} color={PRIMARY} />
          </View>

          <Text
            style={{
              fontSize: 42,
              fontWeight: '800',
              color: '#FFFFFF',
              letterSpacing: -1,
            }}
          >
            Gov
            <Text style={{ color: PRIMARY }}>Pass</Text>
          </Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              color: '#EBEBF5',
              textAlign: 'center',
              lineHeight: 30,
              fontWeight: '600',
              marginBottom: 12,
            }}
          >
            Navigate benefits, not bureaucracy.
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#8E8E93',
              textAlign: 'center',
              lineHeight: 24,
              maxWidth: 290,
            }}
          >
            Discover programs you qualify for. Scan documents. Apply with confidence.
          </Text>
        </Animated.View>

        {/* Feature pills */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: 56,
          }}
        >
          {['AI-Powered', 'Free to Use', 'Multilingual', 'Secure'].map((feature) => (
            <View
              key={feature}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 9999,
                backgroundColor: 'rgba(30, 64, 175, 0.15)',
                borderWidth: 1,
                borderColor: 'rgba(30, 64, 175, 0.35)',
                margin: 4,
              }}
            >
              <Text style={{ color: '#60A5FA', fontSize: 13, fontWeight: '600' }}>{feature}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Continue button */}
        <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
          <TouchableOpacity accessibilityRole="button"
            onPress={handleContinue}
            style={{
              backgroundColor: PRIMARY,
              paddingVertical: 17,
              borderRadius: 14,
              alignItems: 'center',
              shadowColor: PRIMARY,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.45,
              shadowRadius: 14,
              elevation: 10,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 }}>
              Get Started
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Civic trust badge */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 20,
            gap: 6,
          }}
        >
          <Ionicons name="lock-closed" size={13} color={SECONDARY} />
          <Text style={{ color: '#8E8E93', fontSize: 13 }}>
            Your data is private and never sold
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
