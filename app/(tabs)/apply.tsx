import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { triggerReview } from '@/lib/review';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

const PRIMARY = '#1E40AF';
const STEPS = ['Personal Info', 'Household', 'Income', 'Documents', 'Review'];

interface FormData {
  firstName: string; lastName: string; dob: string; ssnLast4: string;
  phone: string; email: string;
  householdSize: string; address: string; city: string; state: string;
  zip: string; housingStatus: string;
  employmentStatus: string; monthlyIncome: string; otherIncome: string;
  receivingBenefits: boolean; benefitsDetails: string;
  hasId: boolean; hasSsCard: boolean; hasProofOfIncome: boolean;
  hasProofOfAddress: boolean; hasProofOfCitizenship: boolean;
}

const INITIAL: FormData = {
  firstName: '', lastName: '', dob: '', ssnLast4: '', phone: '', email: '',
  householdSize: '', address: '', city: '', state: '', zip: '', housingStatus: '',
  employmentStatus: '', monthlyIncome: '', otherIncome: '',
  receivingBenefits: false, benefitsDetails: '',
  hasId: false, hasSsCard: false, hasProofOfIncome: false,
  hasProofOfAddress: false, hasProofOfCitizenship: false,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function SelectRow({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          accessibilityRole="button"
          style={[styles.selectChip, value === opt && styles.selectChipActive]}
          onPress={() => onChange(opt)}
        >
          <Text style={[styles.selectChipText, value === opt && styles.selectChipTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function DocItem({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity accessibilityRole="checkbox" style={styles.docRow} onPress={onToggle}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
      <Text style={styles.docLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ReviewSection({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <View style={styles.reviewSection}>
      <Text style={styles.reviewSectionTitle}>{title}</Text>
      {rows.filter(([, v]) => v).map(([k, v]) => (
        <View key={k} style={styles.reviewRow}>
          <Text style={styles.reviewKey}>{k}</Text>
          <Text style={styles.reviewVal}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ApplicationFlowScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof FormData) => (val: string | boolean) =>
    setForm(f => ({ ...f, [key]: val }));

  const canProceed = () => {
    if (step === 0) return !!(form.firstName && form.lastName && form.dob && form.ssnLast4.length === 4);
    if (step === 1) return !!(form.householdSize && form.address && form.city && form.state && form.zip);
    if (step === 2) return !!(form.employmentStatus && form.monthlyIncome);
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      await supabase.from('applications').insert({
        user_id: user.id,
        program: 'SNAP',
        status: 'submitted',
        first_name: form.firstName,
        last_name: form.lastName,
        date_of_birth: form.dob,
        ssn_last4: form.ssnLast4,
        phone: form.phone,
        email: form.email,
        household_size: Number(form.householdSize) || 1,
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        housing_status: form.housingStatus,
        employment_status: form.employmentStatus,
        monthly_income: Number(form.monthlyIncome) || 0,
        other_income: Number(form.otherIncome) || 0,
        receiving_benefits: form.receivingBenefits,
        submitted_at: new Date().toISOString(),
      });

      triggerReview();
      Alert.alert(
        'Application Submitted! 🎉',
        "Your SNAP application has been submitted. You'll receive a confirmation soon.",
        [{ text: 'View Applications', onPress: () => router.replace('/(tabs)/applications') }],
      );
    } catch {
      Alert.alert('Submission Failed', 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SNAP Application</Text>
        <Text style={styles.stepLabel}>Step {step + 1} of {STEPS.length}</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` as any }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.stepTitle}>{STEPS[step]}</Text>

        {/* ─── Step 0: Personal Info ─── */}
        {step === 0 && (
          <View>
            <Field label="First Name">
              <TextInput style={styles.input} value={form.firstName} onChangeText={set('firstName')} placeholder="First name" placeholderTextColor="#9CA3AF" />
            </Field>
            <Field label="Last Name">
              <TextInput style={styles.input} value={form.lastName} onChangeText={set('lastName')} placeholder="Last name" placeholderTextColor="#9CA3AF" />
            </Field>
            <Field label="Date of Birth">
              <TextInput style={styles.input} value={form.dob} onChangeText={set('dob')} placeholder="MM/DD/YYYY" placeholderTextColor="#9CA3AF" keyboardType="numbers-and-punctuation" />
            </Field>
            <Field label="SSN (last 4 digits)">
              <TextInput style={styles.input} value={form.ssnLast4} onChangeText={set('ssnLast4')} placeholder="XXXX" placeholderTextColor="#9CA3AF" keyboardType="numeric" maxLength={4} secureTextEntry />
            </Field>
            <Field label="Phone Number">
              <TextInput style={styles.input} value={form.phone} onChangeText={set('phone')} placeholder="(555) 555-5555" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" />
            </Field>
            <Field label="Email Address">
              <TextInput style={styles.input} value={form.email} onChangeText={set('email')} placeholder="you@example.com" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" />
            </Field>
          </View>
        )}

        {/* ─── Step 1: Household ─── */}
        {step === 1 && (
          <View>
            <Field label="Household Size">
              <SelectRow options={['1', '2', '3', '4', '5', '6+']} value={form.householdSize} onChange={set('householdSize')} />
            </Field>
            <Field label="Street Address">
              <TextInput style={styles.input} value={form.address} onChangeText={set('address')} placeholder="123 Main St" placeholderTextColor="#9CA3AF" />
            </Field>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 2 }}>
                <Field label="City">
                  <TextInput style={styles.input} value={form.city} onChangeText={set('city')} placeholder="City" placeholderTextColor="#9CA3AF" />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="State">
                  <TextInput style={styles.input} value={form.state} onChangeText={set('state')} placeholder="CA" placeholderTextColor="#9CA3AF" maxLength={2} autoCapitalize="characters" />
                </Field>
              </View>
            </View>
            <Field label="ZIP Code">
              <TextInput style={styles.input} value={form.zip} onChangeText={set('zip')} placeholder="90210" placeholderTextColor="#9CA3AF" keyboardType="numeric" maxLength={5} />
            </Field>
            <Field label="Housing Status">
              <SelectRow options={['Renting', 'Owning', 'Homeless', 'Shelter', 'With Family']} value={form.housingStatus} onChange={set('housingStatus')} />
            </Field>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={PRIMARY} />
              <Text style={styles.infoText}>SNAP income limits vary by household size. A family of 4 may qualify with up to $3,250/mo gross income.</Text>
            </View>
          </View>
        )}

        {/* ─── Step 2: Income ─── */}
        {step === 2 && (
          <View>
            <Field label="Employment Status">
              <SelectRow options={['Employed', 'Self-Employed', 'Unemployed', 'Disabled', 'Retired']} value={form.employmentStatus} onChange={set('employmentStatus')} />
            </Field>
            <Field label="Monthly Income (before taxes)">
              <TextInput style={styles.input} value={form.monthlyIncome} onChangeText={set('monthlyIncome')} placeholder="$0.00" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />
            </Field>
            <Field label="Other Monthly Income (optional)">
              <TextInput style={styles.input} value={form.otherIncome} onChangeText={set('otherIncome')} placeholder="$0.00" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />
            </Field>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Currently receiving benefits?</Text>
                <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>e.g. SSI, TANF, Medicaid</Text>
              </View>
              <Switch
                value={form.receivingBenefits}
                onValueChange={set('receivingBenefits')}
                trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                thumbColor={form.receivingBenefits ? PRIMARY : '#9CA3AF'}
              />
            </View>
            {form.receivingBenefits && (
              <Field label="Which benefits?">
                <TextInput style={styles.input} value={form.benefitsDetails} onChangeText={set('benefitsDetails')} placeholder="SSI, Medicaid..." placeholderTextColor="#9CA3AF" />
              </Field>
            )}
          </View>
        )}

        {/* ─── Step 3: Documents ─── */}
        {step === 3 && (
          <View>
            <Text style={styles.docIntro}>Check the documents you have available. Missing documents may delay processing.</Text>
            <DocItem label="Government-issued Photo ID (Driver's License, Passport)" checked={form.hasId} onToggle={() => set('hasId')(!form.hasId)} />
            <DocItem label="Social Security Card" checked={form.hasSsCard} onToggle={() => set('hasSsCard')(!form.hasSsCard)} />
            <DocItem label="Proof of Income (pay stubs, tax return)" checked={form.hasProofOfIncome} onToggle={() => set('hasProofOfIncome')(!form.hasProofOfIncome)} />
            <DocItem label="Proof of Address (utility bill, lease)" checked={form.hasProofOfAddress} onToggle={() => set('hasProofOfAddress')(!form.hasProofOfAddress)} />
            <DocItem label="Proof of Citizenship or Legal Residency" checked={form.hasProofOfCitizenship} onToggle={() => set('hasProofOfCitizenship')(!form.hasProofOfCitizenship)} />
            <View style={styles.infoBox}>
              <Ionicons name="scan-outline" size={16} color={PRIMARY} />
              <Text style={styles.infoText}>Use the Scan tab to capture documents and have them auto-attached to your application.</Text>
            </View>
          </View>
        )}

        {/* ─── Step 4: Review & Submit ─── */}
        {step === 4 && (
          <View>
            <ReviewSection title="Personal Info" rows={[
              ['Name', `${form.firstName} ${form.lastName}`],
              ['Date of Birth', form.dob],
              ['Phone', form.phone],
              ['Email', form.email],
            ]} />
            <ReviewSection title="Household" rows={[
              ['Size', form.householdSize ? `${form.householdSize} person(s)` : ''],
              ['Address', form.address ? `${form.address}, ${form.city}, ${form.state} ${form.zip}` : ''],
              ['Housing', form.housingStatus],
            ]} />
            <ReviewSection title="Income" rows={[
              ['Employment', form.employmentStatus],
              ['Monthly Income', form.monthlyIncome ? `$${form.monthlyIncome}` : ''],
              ['Other Income', form.otherIncome ? `$${form.otherIncome}` : ''],
              ['Receiving Benefits', form.receivingBenefits ? (form.benefitsDetails || 'Yes') : 'No'],
            ]} />
            <Text style={styles.certText}>
              By submitting this application I certify that all information provided is true and accurate to the best of my knowledge. I understand that providing false information may result in disqualification and legal penalties.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity accessibilityRole="button" style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.nextBtn, { backgroundColor: canProceed() ? PRIMARY : '#9CA3AF' }]}
          onPress={() => {
            if (step < STEPS.length - 1) setStep(s => s + 1);
            else handleSubmit();
          }}
          disabled={!canProceed() || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextBtnText}>{step === STEPS.length - 1 ? 'Submit Application' : 'Continue'}</Text>
          )}
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
  scroll: { padding: 16, paddingTop: 20, paddingBottom: 10 },
  stepTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },
  selectChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  selectChipActive: { borderColor: PRIMARY, backgroundColor: '#EFF6FF' },
  selectChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  selectChipTextActive: { color: PRIMARY },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginBottom: 14 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, marginTop: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  infoText: { flex: 1, fontSize: 12, color: PRIMARY, lineHeight: 17 },
  docIntro: { fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 19 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  docLabel: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 18 },
  reviewSection: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  reviewSectionTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  reviewKey: { fontSize: 13, color: '#6B7280' },
  reviewVal: { fontSize: 13, fontWeight: '600', color: '#111827', textAlign: 'right', flex: 1, marginLeft: 12 },
  certText: { fontSize: 12, color: '#9CA3AF', lineHeight: 17, marginTop: 8 },
  footer: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  backBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: '#F3F4F6' },
  backBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  nextBtn: { flex: 2, borderRadius: 12, padding: 14, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
