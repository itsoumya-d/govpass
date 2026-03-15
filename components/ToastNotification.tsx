import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastNotificationProps { message: string; variant?: ToastVariant; visible: boolean; onHide: () => void; duration?: number; }

const VARIANT_CONFIG = {
  success: { bg: '#10B981', icon: 'checkmark-circle' },
  error:   { bg: '#EF4444', icon: 'close-circle' },
  warning: { bg: '#F59E0B', icon: 'warning' },
  info:    { bg: '#3B82F6', icon: 'information-circle' },
} as const;

export function ToastNotification({ message, variant = 'success', visible, onHide, duration = 3000 }: ToastNotificationProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const config = VARIANT_CONFIG[variant];
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
        ]).start(() => onHide());
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, opacity, translateY, onHide]);
  if (!visible) return null;
  return (
    <Animated.View style={[styles.container, { backgroundColor: config.bg, opacity, transform: [{ translateY }] }]}>
      <Ionicons name={config.icon as 'checkmark-circle'} size={18} color="#FFFFFF" />
      <Text style={styles.message} numberOfLines={2}>{message}</Text>
      <TouchableOpacity accessibilityRole="button" onPress={onHide} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, gap: 10, zIndex: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  message: { flex: 1, fontSize: 14, fontWeight: '500', color: '#FFFFFF', lineHeight: 20 },
});
