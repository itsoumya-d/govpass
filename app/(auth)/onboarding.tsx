import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet, Animated, StatusBar } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface Slide {
  emoji: string;
  title: string;
  description: string;
  bg: string;
  accentBg: string;
  tag: string;
}

const slides: Slide[] = [
  {
    emoji: '🏛️',
    title: 'Discover Benefits',
    description:
      'Find every government program you qualify for — SNAP, Medicaid, housing, and 2,000+ more. AI scans in seconds.',
    bg: '#0A0F18',
    accentBg: '#141C2E',
    tag: 'ELIGIBILITY SCAN',
  },
  {
    emoji: '📋',
    title: 'Apply in Minutes',
    description:
      'Complete complex government applications with AI guidance, document scanning, and auto-filled forms.',
    bg: '#080D14',
    accentBg: '#111928',
    tag: 'SMART APPLY',
  },
  {
    emoji: '🔔',
    title: 'Never Miss a Deadline',
    description:
      'Smart alerts keep you informed about application status, approval decisions, and renewal deadlines.',
    bg: '#060A10',
    accentBg: '#0E1520',
    tag: 'SMART ALERTS',
  },
];

export default function Onboarding() {
  const [current, setCurrent] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1 / slides.length)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (current + 1) / slides.length,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [current]);

  useEffect(() => {
    if (current === slides.length - 1) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: 0.85, duration: 1000, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [current]);

  const animateTransition = (nextIndex: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -24, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setCurrent(nextIndex);
      slideAnim.setValue(24);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 90, friction: 12 }),
      ]).start();
    });
  };

  async function handleNext() {
    if (current < slides.length - 1) {
      animateTransition(current + 1);
    } else {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      router.replace('/(auth)/login');
    }
  }

  function handleSkip() {
    AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/(auth)/login');
  }

  const slide = slides[current];
  const isLast = current === slides.length - 1;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: slide.bg }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.topAccent, { backgroundColor: slide.accentBg }]} />
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>
      {!isLast && (
        <Pressable style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}
      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.tag}>
          <Text style={styles.tagText}>{slide.tag}</Text>
        </View>
        <View style={[styles.emojiContainer, { backgroundColor: slide.accentBg }]}>
          <Text style={styles.emoji}>{slide.emoji}</Text>
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </Animated.View>
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              { width: i === current ? 28 : 8, opacity: i === current ? 1 : 0.35 },
            ]}
          />
        ))}
      </View>
      <Animated.View
        style={[
          styles.buttonWrap,
          isLast && {
            opacity: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
          },
        ]}
      >
        <Pressable
          style={[styles.button, isLast && { backgroundColor: 'rgba(255,255,255,0.95)' }]}
          onPress={handleNext}
          onPressIn={() =>
            Animated.spring(scaleAnim, {
              toValue: 0.97,
              useNativeDriver: true,
              tension: 200,
              friction: 10,
            }).start()
          }
          onPressOut={() =>
            Animated.spring(scaleAnim, {
              toValue: 1,
              useNativeDriver: true,
              tension: 200,
              friction: 10,
            }).start()
          }
        >
          <Text style={[styles.buttonText, isLast && { color: slide.bg }]}>
            {isLast ? '🚀  Get Started' : 'Continue →'}
          </Text>
        </Pressable>
      </Animated.View>
      <Text style={styles.stepCounter}>
        {current + 1} of {slides.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    opacity: 0.6,
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  progressFill: { height: 3, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 2 },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  skipText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600' },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  tagText: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  emoji: { fontSize: 56 },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 320,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 20,
  },
  dot: { height: 8, borderRadius: 4, backgroundColor: '#fff' },
  buttonWrap: { marginHorizontal: 24, marginBottom: 16 },
  button: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  stepCounter: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 36,
  },
});
