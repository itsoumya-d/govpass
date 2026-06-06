import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';

export interface Avatar { id: string; name: string; imageUrl?: string; color?: string; }

interface AvatarGroupProps { avatars: Avatar[]; max?: number; size?: number; style?: ViewStyle; }

const DEFAULT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899'];

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('');
}

export function AvatarGroup({ avatars, max = 4, size = 36, style }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - max;
  const overlap = size * 0.35;
  return (
    <View style={[styles.container, { height: size }, style]}>
      {visible.map((avatar, i) => {
        const bg = avatar.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
        return (
          <View key={avatar.id} style={[styles.avatarWrapper, { width: size, height: size, borderRadius: size / 2, marginLeft: i === 0 ? 0 : -overlap, zIndex: visible.length - i }]}>
            {avatar.imageUrl ? (
              <Image source={{ uri: avatar.imageUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} resizeMode="cover" />
            ) : (
              <View style={[styles.initialsCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
                <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{getInitials(avatar.name)}</Text>
              </View>
            )}
          </View>
        );
      })}
      {overflow > 0 && (
        <View style={[styles.overflow, { width: size, height: size, borderRadius: size / 2, marginLeft: -overlap }]}>
          <Text style={[styles.overflowText, { fontSize: size * 0.32 }]}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  avatarWrapper: { borderWidth: 2, borderColor: '#FFFFFF', overflow: 'hidden' },
  initialsCircle: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#FFFFFF', fontWeight: '700' },
  overflow: { backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  overflowText: { color: '#6B7280', fontWeight: '700' },
});
