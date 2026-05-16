import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from '@/components/PressableScale';
import EmptyState from '@/components/EmptyState';
import { SkeletonListItem } from '@/components/SkeletonLoader';
import { useAuthStore } from '@/store/auth';
import { getNotifications } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AlertsScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getNotifications(user.id).then(({ data }) => {
      if (data) setAlerts(data);
    }).finally(() => setLoading(false));
  }, [user]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
  }, [user]);

  const markOneRead = useCallback(async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  }, []);

  const unreadCount = alerts.filter(a => !a.is_read).length;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0F1E' }}>
        <ScrollView className="flex-1 px-4 pt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonListItem key={i} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0F1E' }}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Alerts</Text>
          {unreadCount > 0 && (
            <Text style={s.unreadBadge}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <PressableScale accessibilityRole="button" haptic="light" onPress={markAllRead}>
            <Text style={s.markRead}>Mark All Read</Text>
          </PressableScale>
        )}
      </View>
      {alerts.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="No alerts"
          description="We'll notify you about deadlines and new programs you qualify for"
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {alerts.map((alert, index) => (
            <Animated.View key={alert.id} entering={FadeInDown.delay(index * 45).duration(260).springify()}>
              <PressableScale
                accessibilityRole="button"
                haptic="light"
                style={[s.card, !alert.is_read && s.cardUnread]}
                onPress={() => markOneRead(alert.id)}
              >
                <View style={[s.iconBox, { backgroundColor: (alert.color || '#1E40AF') + '20' }]}>
                  <Ionicons name={(alert.icon as any) || 'notifications'} size={22} color={alert.color || '#1E40AF'} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.cardTitle}>{alert.title}</Text>
                  <Text style={s.cardSub}>{alert.subtitle}</Text>
                  <Text style={s.time}>{alert.created_at ? timeAgo(alert.created_at) : ''}</Text>
                </View>
                {!alert.is_read && <View style={s.unreadDot} />}
              </PressableScale>
            </Animated.View>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  unreadBadge: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  markRead: { color: '#60A5FA', fontSize: 14, fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: 20, marginBottom: 10, padding: 16, borderRadius: 12, backgroundColor: '#0F1B35', borderWidth: 1, borderColor: '#1A2744' },
  cardUnread: { borderColor: '#1E40AF', backgroundColor: '#0F1B35' },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#94A3B8', lineHeight: 18 },
  time: { fontSize: 12, color: '#475569', marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', alignSelf: 'center', marginLeft: 8 },
});
