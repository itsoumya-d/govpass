import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const translateY = useSharedValue(-60);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = !state.isConnected || !state.isInternetReachable;
      if (offline && !isOffline) setHasShown(true);
      setIsOffline(offline);
      translateY.value = withSpring(offline ? 0 : -60, {
        damping: 18,
        stiffness: 250,
      });
    });
    return unsubscribe;
  }, [isOffline]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!hasShown && !isOffline) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          backgroundColor: '#EF4444',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          gap: 8,
        },
        animatedStyle,
      ]}
    >
      <Ionicons name="wifi-outline" size={16} color="white" />
      <Text style={{ color: 'white', fontWeight: '600', fontSize: 13 }}>
        No internet connection
      </Text>
    </Animated.View>
  );
}
