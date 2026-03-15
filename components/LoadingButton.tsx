import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface LoadingButtonProps {
  onPress: () => void;
  label: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function LoadingButton({
  onPress,
  label,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
}: LoadingButtonProps) {
  const isDisabled = loading || disabled;
  const containerStyle = [
    styles.button,
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'danger' && styles.danger,
    isDisabled && styles.disabled,
    style,
  ];
  const labelStyle = [styles.label, variant === 'secondary' && styles.labelSecondary, textStyle];
  return (
    <TouchableOpacity accessibilityRole="button" style={containerStyle} onPress={onPress} disabled={isDisabled} activeOpacity={0.75}>
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'secondary' ? '#3B82F6' : '#FFFFFF'} />
      ) : (
        <Text style={labelStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  primary: { backgroundColor: '#3B82F6' },
  secondary: { backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: '#E5E7EB' },
  danger: { backgroundColor: '#EF4444' },
  disabled: { opacity: 0.5 },
  label: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  labelSecondary: { color: '#374151' },
});
