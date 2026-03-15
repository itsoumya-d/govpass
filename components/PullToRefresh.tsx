import React from 'react';
import { ScrollView, RefreshControl, StyleSheet, ViewStyle, ScrollViewProps } from 'react-native';

interface PullToRefreshProps extends Omit<ScrollViewProps, 'refreshControl'> { onRefresh: () => Promise<void>; refreshing: boolean; children: React.ReactNode; tintColor?: string; style?: ViewStyle; }

export function PullToRefresh({ onRefresh, refreshing, children, tintColor = '#3B82F6', style, ...scrollProps }: PullToRefreshProps) {
  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tintColor} colors={[tintColor]} progressBackgroundColor="#FFFFFF" />} {...scrollProps}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
