import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#1E40AF';
const STEPS = ['Personal Info', 'Household', 'Income', 'Documents', 'Review'];

export default function ApplicationFlowScreen() {
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SNAP Application</Text>
        <Text style={styles.stepLabel}>Step {step + 1} of {STEPS.length}</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.stepTitle}>{STEPS[step]}</Text>

        {step === 0 && (
          <View style={styles.form}>
            <Text style={styles.label}>First Name</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>Last Name</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>Date of Birth</Text>
            <TextInput style={styles.input} placeholder="MM/DD/YYYY" placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>SSN (last 4 digits)</Text>
            <TextInput style={styles.input} placeholder="XXXX" placeholderTextColor="#9CA3AF" keyboardType="numeric" />
          </View>
        )}

        {step !== 0 && (
          <View style={styles.placeholder}>
            <Ionicons name="document-text" size={48} color="#D1D5DB" />
            <Text style={styles.placeholderText}>{STEPS[step]} fields</Text>
            <Text style={styles.placeholderSub}>AI pre-fills from your profile</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity accessibilityRole="button" style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity accessibilityRole="button"
          style={[styles.nextBtn, { backgroundColor: PRIMARY }]}
          onPress={() => { if (step < STEPS.length - 1) setStep(s => s + 1); }}
        >
          <Text style={styles.nextBtnText}>{step === STEPS.length - 1 ? 'Submit Application' : 'Continue'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  stepLabel: { fontSize: 13, color: '#6B7280' },
  progressBar: { height: 4, backgroundColor: '#E5E7EB', marginHorizontal: 16 },
  progressFill: { height: '100%', backgroundColor: PRIMARY, borderRadius: 2 },
  scroll: { padding: 16, paddingTop: 20 },
  stepTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 20 },
  form: { gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },
  placeholder: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  placeholderText: { fontSize: 18, fontWeight: '600', color: '#6B7280' },
  placeholderSub: { fontSize: 13, color: '#9CA3AF' },
  footer: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  backBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: '#F3F4F6' },
  backBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  nextBtn: { flex: 2, borderRadius: 12, padding: 14, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
