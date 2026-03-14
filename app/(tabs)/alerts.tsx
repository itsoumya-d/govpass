import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '@/components/EmptyState';
import { SkeletonListItem } from '@/components/SkeletonLoader';

const ALERTS = [
  { id: '1', title: 'SNAP Benefit Renewal', subtitle: 'Your benefits renew in 7 days. Submit documents now.', time: '2h ago', icon: 'warning', color: '#F59E0B' },
  { id: '2', title: 'Medicaid Approved', subtitle: 'Your Medicaid application has been approved!', time: '1d ago', icon: 'checkmark-circle', color: '#22C55E' },
  { id: '3', title: 'Document Required', subtitle: 'Housing voucher requires proof of income.', time: '2d ago', icon: 'document-text', color: '#1E40AF' },
  { id: '4', title: 'New Benefit Available', subtitle: 'You may qualify for the Low Income Home Energy Assistance Program.', time: '3d ago', icon: 'star', color: '#1E40AF' },
];

export default function AlertsScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

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
        <Text style={s.title}>Alerts</Text>
        <TouchableOpacity>
          <Text style={s.markRead}>Mark All Read</Text>
        </TouchableOpacity>
      </View>
      {ALERTS.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="No alerts"
          description="We'll notify you about deadlines and new programs you qualify for"
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {ALERTS.map((alert) => (
            <TouchableOpacity accessibilityRole="button" key={alert.id} style={s.card}>
              <View style={[s.iconBox, { backgroundColor: alert.color + '20' }]}>
                <Ionicons name={alert.icon as any} size={22} color={alert.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.cardTitle}>{alert.title}</Text>
                <Text style={s.cardSub}>{alert.subtitle}</Text>
                <Text style={s.time}>{alert.time}</Text>
              </View>
            </TouchableOpacity>
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
  markRead: { color: '#1E40AF', fontSize: 14, fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: 20, marginBottom: 10, padding: 16, borderRadius: 12, backgroundColor: '#0F1B35', borderWidth: 1, borderColor: '#1A2744' },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#94A3B8', lineHeight: 18 },
  time: { fontSize: 12, color: '#475569', marginTop: 4 },
});
