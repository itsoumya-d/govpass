import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

const PRIMARY = '#1E40AF';
const BG = '#0F172A';
const CARD = '#1E293B';
const BORDER = '#334155';
const SUCCESS = '#10B981';

const PROGRAMS = [
  { id: '1', name: 'SNAP Food Assistance', agency: 'USDA', value: '$288/month' },
  { id: '2', name: 'Medicaid Health Coverage', agency: 'CMS', value: 'Comprehensive coverage' },
  { id: '5', name: 'Pell Grant', agency: 'Dept of Ed', value: 'Up to $7,395/year' },
  { id: '3', name: 'LIHEAP Energy Assistance', agency: 'HHS', value: 'Up to $900/year' },
];

const DOCUMENTS = [
  { id: 'id', label: 'Government-issued ID', required: true, icon: 'card' as const },
  { id: 'income', label: 'Proof of Income (last 30 days)', required: true, icon: 'document-text' as const },
  { id: 'address', label: 'Proof of Address', required: true, icon: 'home' as const },
  { id: 'ssn', label: 'Social Security Card', required: true, icon: 'shield-checkmark' as const },
  { id: 'bank', label: 'Bank statements (3 months)', required: false, icon: 'wallet' as const },
  { id: 'tax', label: 'Last year\'s tax return', required: false, icon: 'receipt' as const },
];

export default function NewApplicationScreen() {
  const params = useLocalSearchParams<{ programId?: string; programName?: string }>();

  const [step, setStep] = useState(1);
  const [selectedProgram, setSelectedProgram] = useState(params.programId || '');
  const [uploadedDocs, setUploadedDocs] = useState<Set<string>>(new Set());

  // Step 2 personal info
  const [firstName, setFirstName] = useState('John');
  const [lastName, setLastName] = useState('Davis');
  const [dob, setDob] = useState('1985-06-15');
  const [ssn, setSsn] = useState('***-**-****');
  const [address, setAddress] = useState('123 Main St, Austin, TX 78701');
  const [phone, setPhone] = useState('(512) 555-0192');
  const [email, setEmail] = useState('john.davis@email.com');

  const TOTAL_STEPS = 4;
  const progress = (step / TOTAL_STEPS) * 100;

  const program = PROGRAMS.find(p => p.id === selectedProgram);

  const toggleDoc = (id: string) => {
    const updated = new Set(uploadedDocs);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setUploadedDocs(updated);
  };

  const handleNext = () => {
    if (step === 1 && !selectedProgram) {
      Alert.alert('Select Program', 'Please select a program to apply for.');
      return;
    }
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleSubmit = () => {
    Alert.alert(
      'Application Submitted',
      `Your ${program?.name} application has been submitted. You will receive a confirmation email within 24 hours.`,
      [{ text: 'Done', onPress: () => router.replace('/(tabs)/applications') }]
    );
  };

  const STEP_LABELS = ['Program', 'Personal Info', 'Documents', 'Review'];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => step === 1 ? router.back() : setStep(step - 1)}
          style={s.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>New Application</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress */}
      <View style={s.progressContainer}>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${progress}%` as any }]} />
        </View>
        <View style={s.stepsRow}>
          {STEP_LABELS.map((label, i) => (
            <View key={label} style={s.stepItem}>
              <View style={[
                s.stepCircle,
                i + 1 < step && s.stepDone,
                i + 1 === step && s.stepActive,
              ]}>
                {i + 1 < step
                  ? <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  : <Text style={[s.stepNum, i + 1 === step && { color: '#FFFFFF' }]}>{i + 1}</Text>
                }
              </View>
              <Text style={[s.stepLabel, i + 1 === step && { color: '#FFFFFF' }]}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>

        {/* Step 1: Program Selection */}
        {step === 1 && (
          <View>
            <Text style={s.stepTitle}>Select a Program</Text>
            <Text style={s.stepSubtitle}>Choose the benefit program you want to apply for.</Text>
            {PROGRAMS.map(prog => (
              <TouchableOpacity
                key={prog.id}
                style={[s.programCard, selectedProgram === prog.id && s.programCardSelected]}
                onPress={() => setSelectedProgram(prog.id)}
              >
                <View style={s.programCardInner}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.programName}>{prog.name}</Text>
                    <Text style={s.programAgency}>{prog.agency}</Text>
                    <Text style={s.programValue}>{prog.value}</Text>
                  </View>
                  <View style={[
                    s.radioCircle,
                    selectedProgram === prog.id && { backgroundColor: PRIMARY, borderColor: PRIMARY },
                  ]}>
                    {selectedProgram === prog.id && (
                      <View style={s.radioDot} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 2: Personal Info */}
        {step === 2 && (
          <View>
            <Text style={s.stepTitle}>Personal Information</Text>
            <Text style={s.stepSubtitle}>We've pre-filled from your profile. Please verify.</Text>
            {[
              { label: 'First Name', value: firstName, setter: setFirstName },
              { label: 'Last Name', value: lastName, setter: setLastName },
              { label: 'Date of Birth', value: dob, setter: setDob },
              { label: 'SSN (masked)', value: ssn, setter: setSsn },
              { label: 'Home Address', value: address, setter: setAddress },
              { label: 'Phone Number', value: phone, setter: setPhone },
              { label: 'Email Address', value: email, setter: setEmail },
            ].map(field => (
              <View key={field.label} style={s.fieldGroup}>
                <Text style={s.fieldLabel}>{field.label}</Text>
                <TextInput
                  style={s.fieldInput}
                  value={field.value}
                  onChangeText={field.setter}
                  placeholderTextColor="#475569"
                />
              </View>
            ))}
          </View>
        )}

        {/* Step 3: Documents */}
        {step === 3 && (
          <View>
            <Text style={s.stepTitle}>Required Documents</Text>
            <Text style={s.stepSubtitle}>Upload or mark as ready. Required items marked with *</Text>
            {DOCUMENTS.map(doc => {
              const uploaded = uploadedDocs.has(doc.id);
              return (
                <View key={doc.id} style={s.docCard}>
                  <View style={[s.docIcon, uploaded && { backgroundColor: SUCCESS + '20' }]}>
                    <Ionicons name={doc.icon} size={20} color={uploaded ? SUCCESS : '#64748B'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.docLabel}>
                      {doc.label}{doc.required ? ' *' : ''}
                    </Text>
                    <Text style={[s.docStatus, { color: uploaded ? SUCCESS : '#64748B' }]}>
                      {uploaded ? 'Uploaded' : doc.required ? 'Required' : 'Optional'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[s.uploadBtn, uploaded && { backgroundColor: SUCCESS + '20', borderColor: SUCCESS }]}
                    onPress={() => toggleDoc(doc.id)}
                  >
                    <Ionicons
                      name={uploaded ? 'checkmark' : 'cloud-upload-outline'}
                      size={16}
                      color={uploaded ? SUCCESS : '#64748B'}
                    />
                    <Text style={[s.uploadBtnText, uploaded && { color: SUCCESS }]}>
                      {uploaded ? 'Done' : 'Upload'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <View>
            <Text style={s.stepTitle}>Review & Submit</Text>
            <Text style={s.stepSubtitle}>Review your application before submitting.</Text>

            <View style={s.reviewCard}>
              <Text style={s.reviewSectionTitle}>Program</Text>
              <Text style={s.reviewValue}>{program?.name || 'Not selected'}</Text>
              <Text style={s.reviewMeta}>{program?.agency} · {program?.value}</Text>
            </View>

            <View style={s.reviewCard}>
              <Text style={s.reviewSectionTitle}>Applicant</Text>
              <Text style={s.reviewValue}>{firstName} {lastName}</Text>
              <Text style={s.reviewMeta}>{email}</Text>
              <Text style={s.reviewMeta}>{phone}</Text>
              <Text style={s.reviewMeta}>{address}</Text>
            </View>

            <View style={s.reviewCard}>
              <Text style={s.reviewSectionTitle}>Documents</Text>
              <Text style={s.reviewValue}>{uploadedDocs.size} of {DOCUMENTS.length} uploaded</Text>
              {DOCUMENTS.filter(d => d.required && !uploadedDocs.has(d.id)).length > 0 && (
                <View style={s.warningRow}>
                  <Ionicons name="warning" size={14} color="#F59E0B" />
                  <Text style={s.warningText}>
                    {DOCUMENTS.filter(d => d.required && !uploadedDocs.has(d.id)).length} required documents missing — you can still submit and upload later.
                  </Text>
                </View>
              )}
            </View>

            <View style={s.reviewCard}>
              <Text style={s.reviewSectionTitle}>Certification</Text>
              <Text style={s.certText}>
                By submitting, I certify that all information provided is true, correct, and complete to the best of my knowledge. I understand that providing false information may result in denial or termination of benefits.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={s.bottomBar}>
        <TouchableOpacity
          style={s.nextBtn}
          onPress={step === TOTAL_STEPS ? handleSubmit : handleNext}
        >
          <Text style={s.nextBtnText}>
            {step === TOTAL_STEPS ? 'Submit Application' : 'Continue'}
          </Text>
          <Ionicons
            name={step === TOTAL_STEPS ? 'send' : 'arrow-forward'}
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  progressContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  progressTrack: { height: 4, backgroundColor: CARD, borderRadius: 2, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', backgroundColor: PRIMARY, borderRadius: 2 },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#334155', backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' },
  stepDone: { backgroundColor: SUCCESS, borderColor: SUCCESS },
  stepActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  stepNum: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  stepLabel: { fontSize: 10, color: '#475569', fontWeight: '500' },
  stepTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginTop: 16, marginBottom: 6 },
  stepSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 20 },
  programCard: { backgroundColor: CARD, borderRadius: 14, borderWidth: 2, borderColor: BORDER, padding: 16, marginBottom: 10 },
  programCardSelected: { borderColor: PRIMARY },
  programCardInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  programName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  programAgency: { fontSize: 12, color: '#64748B' },
  programValue: { fontSize: 13, color: '#10B981', fontWeight: '600', marginTop: 4 },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase' },
  fieldInput: { backgroundColor: CARD, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, padding: 14, fontSize: 15, color: '#FFFFFF' },
  docCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 14, marginBottom: 10 },
  docIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },
  docLabel: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginBottom: 3 },
  docStatus: { fontSize: 12 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  uploadBtnText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  reviewCard: { backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 12 },
  reviewSectionTitle: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: 8 },
  reviewValue: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  reviewMeta: { fontSize: 13, color: '#94A3B8', marginBottom: 2 },
  warningRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8 },
  warningText: { flex: 1, fontSize: 12, color: '#F59E0B', lineHeight: 18 },
  certText: { fontSize: 12, color: '#64748B', lineHeight: 18 },
  bottomBar: { padding: 20, borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: BG },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: PRIMARY, borderRadius: 16, padding: 16 },
  nextBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
