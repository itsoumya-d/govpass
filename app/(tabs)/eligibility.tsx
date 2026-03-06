import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#1E40AF';

const PROGRAMS = [
  { name: 'SNAP Food Assistance', eligible: true, amount: '$291/mo', deadline: 'Rolling' },
  { name: 'Medicaid', eligible: true, amount: 'Full coverage', deadline: 'Rolling' },
  { name: 'Housing Voucher (Section 8)', eligible: true, amount: 'Varies', deadline: 'Waitlist open' },
  { name: 'LIHEAP Energy Assistance', eligible: false, amount: 'N/A', deadline: 'Closed' },
  { name: 'WIC Program', eligible: false, amount: 'N/A', deadline: 'Not eligible' },
];

export default function EligibilityScreen() {
  const eligible = PROGRAMS.filter(p => p.eligible);
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Eligibility Results</Text>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryBig}>{eligible.length}</Text>
          <Text style={styles.summaryLabel}>Programs you qualify for</Text>
        </View>
        <Text style={styles.sectionTitle}>Eligible Programs</Text>
        {eligible.map((p, i) => (
          <View key={i} style={[styles.programCard, styles.eligibleCard]}>
            <View style={styles.programRow}>
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
              <Text style={styles.programName}>{p.name}</Text>
            </View>
            <Text style={styles.programAmount}>{p.amount}</Text>
            <Text style={styles.programDeadline}>Deadline: {p.deadline}</Text>
            <TouchableOpacity style={[styles.applyBtn, { backgroundColor: PRIMARY }]}>
              <Text style={styles.applyBtnText}>Start Application</Text>
            </TouchableOpacity>
          </View>
        ))}
        <Text style={styles.sectionTitle}>Not Eligible</Text>
        {PROGRAMS.filter(p => !p.eligible).map((p, i) => (
          <View key={i} style={[styles.programCard, styles.ineligibleCard]}>
            <View style={styles.programRow}>
              <Ionicons name="close-circle" size={20} color="#DC2626" />
              <Text style={[styles.programName, { color: '#6B7280' }]}>{p.name}</Text>
            </View>
            <Text style={styles.ineligibleReason}>{p.deadline}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', padding: 16 },
  scroll: { padding: 16, paddingTop: 0, gap: 12 },
  summaryCard: { backgroundColor: PRIMARY, borderRadius: 16, padding: 24, alignItems: 'center', gap: 4, marginBottom: 8 },
  summaryBig: { fontSize: 48, fontWeight: '800', color: '#fff' },
  summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 4 },
  programCard: { borderRadius: 14, padding: 14, gap: 6, borderWidth: 1 },
  eligibleCard: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  ineligibleCard: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  programRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  programName: { fontSize: 14, fontWeight: '700', color: '#1E3A8A', flex: 1 },
  programAmount: { fontSize: 16, fontWeight: '800', color: PRIMARY },
  programDeadline: { fontSize: 12, color: '#6B7280' },
  applyBtn: { borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 4 },
  applyBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  ineligibleReason: { fontSize: 12, color: '#9CA3AF' },
});
