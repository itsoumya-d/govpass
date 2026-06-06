import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput,
  StyleSheet, Switch, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import PressableScale from '@/components/PressableScale';
import { supabase } from '@/lib/supabase';
import { triggerReview } from '@/lib/review';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/lib/useToast';
import Toast from '@/components/Toast';

const PRIMARY = '#1E40AF';

// ── Program Definitions ─────────────────────────────────────────────────────

type ProgramId = 'SNAP' | 'Medicaid' | 'SSI' | 'LIHEAP' | 'WIC';

interface ProgramConfig {
  id: ProgramId;
  name: string;
  shortDesc: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  benefit: string;
  steps: string[];
  agency: string;
}

const PROGRAMS: ProgramConfig[] = [
  {
    id: 'SNAP',
    name: 'SNAP Food Benefits',
    shortDesc: 'Monthly grocery assistance for low-income households',
    icon: 'fast-food-outline',
    iconColor: '#059669',
    iconBg: 'rgba(5,150,105,0.12)',
    benefit: 'Up to $973/mo for family of 4',
    steps: ['Personal Info', 'Household', 'Income', 'Documents', 'Review'],
    agency: 'USDA / State DHS',
  },
  {
    id: 'Medicaid',
    name: 'Medicaid',
    shortDesc: 'Free or low-cost health coverage for eligible individuals',
    icon: 'medkit-outline',
    iconColor: '#1E40AF',
    iconBg: 'rgba(30,64,175,0.12)',
    benefit: 'Full healthcare, $0 premium',
    steps: ['Personal Info', 'Household', 'Income & Insurance', 'Documents', 'Review'],
    agency: 'State Dept. of Health',
  },
  {
    id: 'SSI',
    name: 'Supplemental Security Income',
    shortDesc: 'Monthly cash for disabled, blind, or elderly with limited income',
    icon: 'accessibility-outline',
    iconColor: '#7C3AED',
    iconBg: 'rgba(124,58,237,0.12)',
    benefit: 'Up to $943/month',
    steps: ['Personal Info', 'Disability', 'Income', 'Documents', 'Review'],
    agency: 'Social Security Administration',
  },
  {
    id: 'LIHEAP',
    name: 'LIHEAP Energy Assistance',
    shortDesc: 'Help paying heating and cooling energy bills',
    icon: 'flash-outline',
    iconColor: '#D97706',
    iconBg: 'rgba(217,119,6,0.12)',
    benefit: '$300–$1,500 per year',
    steps: ['Personal Info', 'Housing & Utilities', 'Income', 'Documents', 'Review'],
    agency: 'Dept. of Health & Human Services',
  },
  {
    id: 'WIC',
    name: 'WIC',
    shortDesc: 'Nutrition support for pregnant women and children under 5',
    icon: 'heart-outline',
    iconColor: '#B91C1C',
    iconBg: 'rgba(185,28,28,0.12)',
    benefit: '~$50–$100/month food benefits',
    steps: ['Personal Info', 'Eligibility Basis', 'Household & Income', 'Documents', 'Review'],
    agency: 'USDA Food & Nutrition Service',
  },
];

// ── Form Data ────────────────────────────────────────────────────────────────

interface BaseForm {
  firstName: string;
  lastName: string;
  dob: string;
  ssnLast4: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  householdSize: string;
  employmentStatus: string;
  monthlyIncome: string;
  otherIncome: string;
  housingStatus: string;
  receivingBenefits: boolean;
  benefitsDetails: string;
  // doc checklist
  hasId: boolean;
  hasSsCard: boolean;
  hasProofOfIncome: boolean;
  hasProofOfAddress: boolean;
  hasProofOfCitizenship: boolean;
  // Medicaid specific
  hasHealthInsurance: boolean;
  insuranceProvider: string;
  // SSI specific
  hasDisability: boolean;
  disabilityType: string;
  receivingSSI: boolean;
  hasMedicalRecords: boolean;
  // LIHEAP specific
  utilityType: string;
  utilityProvider: string;
  utilityAccountNumber: string;
  hasUtilityBill: boolean;
  // WIC specific
  isPregnant: boolean;
  dueDate: string;
  isBreastfeeding: boolean;
  hasInfant: boolean;
  infantDob: string;
  hasChildUnder5: boolean;
  childDob: string;
}

const INITIAL_FORM: BaseForm = {
  firstName: '', lastName: '', dob: '', ssnLast4: '', phone: '', email: '',
  address: '', city: '', state: '', zip: '',
  householdSize: '', employmentStatus: '', monthlyIncome: '', otherIncome: '',
  housingStatus: '', receivingBenefits: false, benefitsDetails: '',
  hasId: false, hasSsCard: false, hasProofOfIncome: false, hasProofOfAddress: false, hasProofOfCitizenship: false,
  hasHealthInsurance: false, insuranceProvider: '',
  hasDisability: false, disabilityType: '', receivingSSI: false, hasMedicalRecords: false,
  utilityType: '', utilityProvider: '', utilityAccountNumber: '', hasUtilityBill: false,
  isPregnant: false, dueDate: '', isBreastfeeding: false,
  hasInfant: false, infantDob: '', hasChildUnder5: false, childDob: '',
};

// K-174: Draft persistence key (per-program so drafts don't collide)
const FORM_CACHE_KEY = 'govpass-apply-form-draft';

// ── Sub-Components ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Input({
  value, onChangeText, placeholder, keyboardType = 'default', maxLength, secureTextEntry, autoCapitalize,
}: {
  value: string; onChangeText: (v: string) => void; placeholder?: string;
  keyboardType?: import('react-native').KeyboardTypeOptions; maxLength?: number; secureTextEntry?: boolean; autoCapitalize?: import('react-native').TextInputProps['autoCapitalize'];
}) {
  const focused = useSharedValue(0);
  const animBorder = useAnimatedStyle(() => ({
    borderColor: focused.value === 1 ? PRIMARY : '#E5E7EB',
  }));
  return (
    <Animated.View style={[styles.inputWrapper, animBorder]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        onFocus={() => { focused.value = withTiming(1, { duration: 200 }); }}
        onBlur={() => { focused.value = withTiming(0, { duration: 200 }); }}
      />
    </Animated.View>
  );
}

function SelectRow({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
      {options.map(opt => (
        <PressableScale
          key={opt}
          haptic="light"
          style={[styles.selectChip, value === opt && styles.selectChipActive]}
          onPress={() => onChange(opt)}
        >
          <Text style={[styles.selectChipText, value === opt && styles.selectChipTextActive]}>{opt}</Text>
        </PressableScale>
      ))}
    </ScrollView>
  );
}

function ToggleRow({ label, subLabel, value, onChange }: { label: string; subLabel?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        {subLabel && <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{subLabel}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onChange(v);
        }}
        trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
        thumbColor={value ? PRIMARY : '#9CA3AF'}
      />
    </View>
  );
}

function DocItem({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <PressableScale haptic="light" accessibilityRole="checkbox" style={styles.docRow} onPress={onToggle}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
      <Text style={styles.docLabel}>{label}</Text>
    </PressableScale>
  );
}

function ReviewSection({ title, rows }: { title: string; rows: [string, string][] }) {
  const filtered = rows.filter(([, v]) => v);
  if (!filtered.length) return null;
  return (
    <View style={styles.reviewSection}>
      <Text style={styles.reviewSectionTitle}>{title}</Text>
      {filtered.map(([k, v]) => (
        <View key={k} style={styles.reviewRow}>
          <Text style={styles.reviewKey}>{k}</Text>
          <Text style={styles.reviewVal}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

function InfoBox({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.infoBox}>
      <Ionicons name={icon as any} size={16} color={PRIMARY} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

// ── Program Selection Screen ──────────────────────────────────────────────────

function ProgramSelect({ onSelect }: { onSelect: (p: ProgramConfig) => void }) {
  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeInDown.delay(80).duration(500).springify()} style={styles.header}>
        <Text style={styles.title}>Apply for Benefits</Text>
        <Text style={styles.headerSub}>Choose a program to begin your application</Text>
      </Animated.View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {PROGRAMS.map((prog, i) => (
          <Animated.View
            key={prog.id}
            entering={FadeInDown.delay(200 + i * 60).duration(350)}
          >
            <PressableScale
              haptic="light"
              style={styles.programCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(prog);
              }}
            >
              <View style={[styles.programIconWrap, { backgroundColor: prog.iconBg }]}>
                <Ionicons name={prog.icon as any} size={26} color={prog.iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.programName}>{prog.name}</Text>
                <Text style={styles.programDesc}>{prog.shortDesc}</Text>
                <View style={styles.programBenefitRow}>
                  <Ionicons name="cash-outline" size={13} color={prog.iconColor} />
                  <Text style={[styles.programBenefit, { color: prog.iconColor }]}>{prog.benefit}</Text>
                </View>
                <Text style={styles.programAgency}>{prog.agency}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </PressableScale>
          </Animated.View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Per-Program Step Content ──────────────────────────────────────────────────

function StepPersonalInfo({ form, set }: { form: BaseForm; set: (k: keyof BaseForm) => (v: string | boolean) => void }) {
  return (
    <View>
      {/* Trust indicator chips */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[{icon:'🔒',label:'Secure'},{icon:'🛡️',label:'Encrypted'},{icon:'✓',label:'Gov Verified'}].map(b => (
          <View key={b.label} style={{ flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:10, paddingVertical:5, borderRadius:20, backgroundColor:'rgba(148,163,184,0.12)', borderWidth:1, borderColor:'rgba(148,163,184,0.2)' }}>
            <Text style={{fontSize:12}}>{b.icon}</Text>
            <Text style={{fontSize:11,color:'#94A3B8',fontWeight:'500'}}>{b.label}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="First Name">
            <Input value={form.firstName} onChangeText={set('firstName')} placeholder="First name" />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Last Name">
            <Input value={form.lastName} onChangeText={set('lastName')} placeholder="Last name" />
          </Field>
        </View>
      </View>
      <Field label="Date of Birth">
        <Input value={form.dob} onChangeText={set('dob')} placeholder="MM/DD/YYYY" keyboardType="numbers-and-punctuation" />
      </Field>
      <Field label="Last 4 of Social Security Number">
        <Input value={form.ssnLast4} onChangeText={set('ssnLast4')} placeholder="XXXX" keyboardType="numeric" maxLength={4} secureTextEntry />
      </Field>
      <Field label="Phone Number">
        <Input value={form.phone} onChangeText={set('phone')} placeholder="(555) 555-5555" keyboardType="phone-pad" />
      </Field>
      <Field label="Email Address">
        <Input value={form.email} onChangeText={set('email')} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
      </Field>
    </View>
  );
}

function StepHousehold({ form, set }: { form: BaseForm; set: (k: keyof BaseForm) => (v: string | boolean) => void }) {
  return (
    <View>
      <Field label="Household Size">
        <SelectRow options={['1', '2', '3', '4', '5', '6+']} value={form.householdSize} onChange={set('householdSize')} />
      </Field>
      <Field label="Street Address">
        <Input value={form.address} onChangeText={set('address')} placeholder="123 Main St" />
      </Field>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 2 }}>
          <Field label="City">
            <Input value={form.city} onChangeText={set('city')} placeholder="City" />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="State">
            <Input value={form.state} onChangeText={set('state')} placeholder="CA" maxLength={2} autoCapitalize="characters" />
          </Field>
        </View>
      </View>
      <Field label="ZIP Code">
        <Input value={form.zip} onChangeText={set('zip')} placeholder="90210" keyboardType="numeric" maxLength={5} />
      </Field>
      <Field label="Housing Status">
        <SelectRow options={['Renting', 'Owning', 'Homeless', 'Shelter', 'With Family']} value={form.housingStatus} onChange={set('housingStatus')} />
      </Field>
    </View>
  );
}

function StepIncome({ form, set }: { form: BaseForm; set: (k: keyof BaseForm) => (v: string | boolean) => void }) {
  return (
    <View>
      <Field label="Employment Status">
        <SelectRow options={['Employed', 'Self-Employed', 'Unemployed', 'Disabled', 'Retired']} value={form.employmentStatus} onChange={set('employmentStatus')} />
      </Field>
      <Field label="Monthly Gross Income">
        <Input value={form.monthlyIncome} onChangeText={set('monthlyIncome')} placeholder="$0.00" keyboardType="decimal-pad" />
      </Field>
      <Field label="Other Monthly Income (SSI, rental, etc.)">
        <Input value={form.otherIncome} onChangeText={set('otherIncome')} placeholder="$0.00" keyboardType="decimal-pad" />
      </Field>
      <ToggleRow
        label="Currently Receiving Benefits?"
        subLabel="SNAP, TANF, Medicaid, WIC, etc."
        value={form.receivingBenefits}
        onChange={set('receivingBenefits')}
      />
      {form.receivingBenefits && (
        <Field label="Which Programs?">
          <Input value={form.benefitsDetails} onChangeText={set('benefitsDetails')} placeholder="e.g. SSI, Medicaid" />
        </Field>
      )}
    </View>
  );
}

function StepMedicaidInsurance({ form, set }: { form: BaseForm; set: (k: keyof BaseForm) => (v: string | boolean) => void }) {
  return (
    <View>
      <StepIncome form={form} set={set} />
      <View style={styles.divider} />
      <Text style={styles.sectionHeader}>Health Insurance</Text>
      <ToggleRow
        label="Currently Have Health Insurance?"
        value={form.hasHealthInsurance}
        onChange={set('hasHealthInsurance')}
      />
      {form.hasHealthInsurance && (
        <Field label="Insurance Provider">
          <Input value={form.insuranceProvider} onChangeText={set('insuranceProvider')} placeholder="e.g. Blue Cross" />
        </Field>
      )}
      <InfoBox icon="information-circle-outline" text="Medicaid may be available even if you have other insurance." />
    </View>
  );
}

function StepDisability({ form, set }: { form: BaseForm; set: (k: keyof BaseForm) => (v: string | boolean) => void }) {
  return (
    <View>
      <ToggleRow
        label="Do you have a qualifying disability?"
        subLabel="Physical, mental, or developmental condition lasting 12+ months"
        value={form.hasDisability}
        onChange={set('hasDisability')}
      />
      {form.hasDisability && (
        <Field label="Type of Disability / Condition">
          <Input value={form.disabilityType} onChangeText={set('disabilityType')} placeholder="e.g. blindness, mobility impairment" />
        </Field>
      )}
      <ToggleRow
        label="Currently Receiving SSI or SSDI?"
        value={form.receivingSSI}
        onChange={set('receivingSSI')}
      />
      <InfoBox
        icon="information-circle-outline"
        text="SSI is for people with limited income. SSDI is for those with sufficient work history. You can apply for both."
      />
    </View>
  );
}

function StepLIHEAPHousing({ form, set }: { form: BaseForm; set: (k: keyof BaseForm) => (v: string | boolean) => void }) {
  return (
    <View>
      <StepHousehold form={form} set={set} />
      <View style={styles.divider} />
      <Text style={styles.sectionHeader}>Utility Information</Text>
      <Field label="Utility Type">
        <SelectRow options={['Electric', 'Gas', 'Both', 'Oil/Propane', 'Other']} value={form.utilityType} onChange={set('utilityType')} />
      </Field>
      <Field label="Utility Provider / Company">
        <Input value={form.utilityProvider} onChangeText={set('utilityProvider')} placeholder="e.g. Pacific Gas & Electric" />
      </Field>
      <Field label="Utility Account Number">
        <Input value={form.utilityAccountNumber} onChangeText={set('utilityAccountNumber')} placeholder="Your account number" />
      </Field>
      <InfoBox icon="flash-outline" text="LIHEAP can help pay your current bill or prevent shut-off." />
    </View>
  );
}

function StepWICEligibility({ form, set }: { form: BaseForm; set: (k: keyof BaseForm) => (v: string | boolean) => void }) {
  return (
    <View>
      <Text style={styles.stepSubtitle}>WIC is available if you are:</Text>
      <ToggleRow label="Pregnant" value={form.isPregnant} onChange={set('isPregnant')} />
      {form.isPregnant && (
        <Field label="Due Date (approximate)">
          <Input value={form.dueDate} onChangeText={set('dueDate')} placeholder="MM/DD/YYYY" keyboardType="numbers-and-punctuation" />
        </Field>
      )}
      <ToggleRow label="Breastfeeding (up to 1 year postpartum)" value={form.isBreastfeeding} onChange={set('isBreastfeeding')} />
      <ToggleRow label="Have an infant (under 12 months)" value={form.hasInfant} onChange={set('hasInfant')} />
      {form.hasInfant && (
        <Field label="Infant's Date of Birth">
          <Input value={form.infantDob} onChangeText={set('infantDob')} placeholder="MM/DD/YYYY" keyboardType="numbers-and-punctuation" />
        </Field>
      )}
      <ToggleRow label="Have a child under 5 years old" value={form.hasChildUnder5} onChange={set('hasChildUnder5')} />
      {form.hasChildUnder5 && (
        <Field label="Child's Date of Birth">
          <Input value={form.childDob} onChangeText={set('childDob')} placeholder="MM/DD/YYYY" keyboardType="numbers-and-punctuation" />
        </Field>
      )}
      <InfoBox
        icon="heart-outline"
        text="WIC provides healthy foods, nutrition counseling, and breastfeeding support at no cost."
      />
    </View>
  );
}

function StepWICHousehold({ form, set }: { form: BaseForm; set: (k: keyof BaseForm) => (v: string | boolean) => void }) {
  return (
    <View>
      <Field label="Household Size">
        <SelectRow options={['1', '2', '3', '4', '5', '6+']} value={form.householdSize} onChange={set('householdSize')} />
      </Field>
      <Field label="State">
        <Input value={form.state} onChangeText={set('state')} placeholder="CA" maxLength={2} autoCapitalize="characters" />
      </Field>
      <StepIncome form={form} set={set} />
    </View>
  );
}

// K-168: Document upload verification states
type DocState = 'pending' | 'uploading' | 'processing' | 'verified' | 'failed';

function DocUploadRow({
  docKey,
  label,
  state,
  onUpload,
}: {
  docKey: string;
  label: string;
  state: DocState;
  onUpload: (key: string) => void;
}) {
  const isPending = state === 'pending';
  const isUploading = state === 'uploading';
  const isProcessing = state === 'processing';
  const isVerified = state === 'verified';
  const isFailed = state === 'failed';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
      {/* Status indicator */}
      <View style={{ width: 28, alignItems: 'center' }}>
        {isPending && (
          <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', backgroundColor: 'transparent' }} />
        )}
        {isUploading && <ActivityIndicator size="small" color={PRIMARY} />}
        {isProcessing && <ActivityIndicator size="small" color="#F59E0B" />}
        {isVerified && <Ionicons name="checkmark-circle" size={22} color="#059669" />}
        {isFailed && <Ionicons name="close-circle" size={22} color="#EF4444" />}
      </View>

      {/* Label + status text */}
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: '500', color: '#111827', lineHeight: 18 }} numberOfLines={2}>{label}</Text>
        <Text style={{
          fontSize: 12, marginTop: 2, fontWeight: '500',
          color: isPending ? '#9CA3AF' : isUploading ? PRIMARY : isProcessing ? '#D97706' : isVerified ? '#059669' : '#EF4444',
        }}>
          {isPending ? 'Not uploaded' : isUploading ? 'Uploading...' : isProcessing ? 'Processing...' : isVerified ? 'Verified' : 'Failed'}
        </Text>
      </View>

      {/* Action button / badge */}
      {isVerified && (
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(5,150,105,0.15)', borderRadius: 10 }}>
          <Text style={{ fontSize: 11, color: '#059669', fontWeight: '700' }}>Verified</Text>
        </View>
      )}
      {isFailed && (
        <PressableScale haptic="light" onPress={() => onUpload(docKey)} style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' }}>
          <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '700' }}>Retry</Text>
        </PressableScale>
      )}
      {isPending && (
        <PressableScale haptic="light" onPress={() => onUpload(docKey)} style={{ paddingHorizontal: 12, paddingVertical: 5, backgroundColor: 'rgba(30,64,175,0.1)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(30,64,175,0.25)' }}>
          <Text style={{ fontSize: 11, color: PRIMARY, fontWeight: '700' }}>Upload</Text>
        </PressableScale>
      )}
    </View>
  );
}

function StepDocuments({ programId, form, set }: { programId: ProgramId; form: BaseForm; set: (k: keyof BaseForm) => (v: string | boolean) => void }) {
  const baseDocList: [keyof BaseForm, string, string][] = [
    ['hasId', 'id_proof', "Government-issued Photo ID (driver's license, passport, state ID)"],
    ['hasSsCard', 'ss_card', 'Social Security Card or proof of SSN'],
    ['hasProofOfIncome', 'income_proof', 'Proof of Income (pay stubs, tax return, benefit letters)'],
    ['hasProofOfAddress', 'address_proof', 'Proof of Address (utility bill, lease, bank statement)'],
  ];

  const extraDocs: Record<ProgramId, [keyof BaseForm, string, string][]> = {
    SNAP: [['hasProofOfCitizenship', 'citizenship_proof', 'Proof of citizenship or immigration status']],
    Medicaid: [['hasProofOfCitizenship', 'citizenship_proof', 'Proof of citizenship or legal residency']],
    SSI: [
      ['hasMedicalRecords', 'medical_records', 'Medical records documenting disability'],
      ['hasProofOfCitizenship', 'citizenship_proof', 'Proof of citizenship or residency'],
    ],
    LIHEAP: [['hasUtilityBill', 'utility_bill', 'Most recent utility bill showing account number']],
    WIC: [['hasProofOfCitizenship', 'citizenship_proof', 'Proof of residency in state']],
  };

  const allDocs = [...baseDocList, ...(extraDocs[programId] ?? [])];

  // K-168: Per-document upload state with timed simulation
  const [docStates, setDocStates] = useState<Record<string, DocState>>(() => {
    const initial: Record<string, DocState> = {};
    allDocs.forEach(([, docKey]) => { initial[docKey] = 'pending'; });
    return initial;
  });

  const handleUpload = (docKey: string) => {
    setDocStates(prev => ({ ...prev, [docKey]: 'uploading' }));
    setTimeout(() => {
      setDocStates(prev => ({ ...prev, [docKey]: 'processing' }));
      setTimeout(() => {
        setDocStates(prev => ({ ...prev, [docKey]: 'verified' }));
        // Also mark the form checkbox as checked once verified
        const entry = allDocs.find(([, k]) => k === docKey);
        if (entry) set(entry[0])(true);
      }, 1000);
    }, 1500);
  };

  return (
    <View>
      <Text style={styles.docIntro}>
        Upload your documents below. You can still apply without all documents — you'll receive a list of what to bring.
      </Text>

      {/* K-168: Upload verification status rows */}
      <View style={{ marginBottom: 20, backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 14, paddingTop: 4, borderWidth: 1, borderColor: '#E5E7EB' }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, paddingTop: 12, marginBottom: 4 }}>Document Verification</Text>
        {allDocs.map(([, docKey, label]) => (
          <DocUploadRow
            key={docKey}
            docKey={docKey}
            label={label}
            state={docStates[docKey] ?? 'pending'}
            onUpload={handleUpload}
          />
        ))}
      </View>

      {/* Legacy checkbox checklist */}
      {allDocs.map(([key, , label]) => (
        <DocItem
          key={key}
          label={label}
          checked={!!form[key]}
          onToggle={() => set(key)(!form[key])}
        />
      ))}
      <InfoBox icon="scan-outline" text="Tap Upload on any document above to verify it automatically." />
    </View>
  );
}

function StepReview({ programId, program, form }: { programId: ProgramId; program: ProgramConfig; form: BaseForm }) {
  const wicEligBasis = [
    form.isPregnant && 'Pregnant',
    form.isBreastfeeding && 'Breastfeeding',
    form.hasInfant && 'Infant',
    form.hasChildUnder5 && 'Child under 5',
  ].filter(Boolean).join(', ');

  return (
    <View>
      <View style={[styles.programCard, { marginBottom: 16 }]}>
        <View style={[styles.programIconWrap, { backgroundColor: program.iconBg }]}>
          <Ionicons name={program.icon as any} size={22} color={program.iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.programName}>{program.name}</Text>
          <Text style={styles.programAgency}>{program.agency}</Text>
        </View>
      </View>

      <ReviewSection title="Personal Information" rows={[
        ['Name', `${form.firstName} ${form.lastName}`.trim()],
        ['Date of Birth', form.dob],
        ['Phone', form.phone],
        ['Email', form.email],
      ]} />

      {(programId !== 'SSI') && (
        <ReviewSection title="Household" rows={[
          ['Household Size', form.householdSize ? `${form.householdSize} person(s)` : ''],
          ['Address', form.address ? `${form.address}, ${form.city}, ${form.state} ${form.zip}` : ''],
          ['Housing Status', form.housingStatus],
        ]} />
      )}

      <ReviewSection title="Income" rows={[
        ['Employment', form.employmentStatus],
        ['Monthly Income', form.monthlyIncome ? `$${form.monthlyIncome}` : ''],
        ['Other Income', form.otherIncome ? `$${form.otherIncome}` : ''],
        ['Receiving Benefits', form.receivingBenefits ? (form.benefitsDetails || 'Yes') : 'No'],
      ]} />

      {programId === 'SSI' && (
        <ReviewSection title="Disability" rows={[
          ['Has Disability', form.hasDisability ? 'Yes' : 'No'],
          ['Condition', form.disabilityType],
          ['Receiving SSI/SSDI', form.receivingSSI ? 'Yes' : 'No'],
        ]} />
      )}

      {programId === 'LIHEAP' && (
        <ReviewSection title="Utility Information" rows={[
          ['Utility Type', form.utilityType],
          ['Provider', form.utilityProvider],
          ['Account #', form.utilityAccountNumber],
        ]} />
      )}

      {programId === 'WIC' && (
        <ReviewSection title="WIC Eligibility" rows={[
          ['Eligible As', wicEligBasis],
          ['State', form.state],
        ]} />
      )}

      <Text style={styles.certText}>
        By submitting this application, I certify that all information provided is true and accurate to the best of my knowledge. I understand that providing false information may result in disqualification from benefits.
      </Text>
    </View>
  );
}

// ── Wizard ────────────────────────────────────────────────────────────────────

function ApplicationWizard({ program, onBack }: { program: ProgramConfig; onBack: () => void }) {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<BaseForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const totalSteps = program.steps.length;
  const progressAnim = useSharedValue((1 / totalSteps) * 100);
  const animProgressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value}%` as any,
  }));

  // K-174: Restore draft on mount
  useEffect(() => {
    AsyncStorage.getItem(`${FORM_CACHE_KEY}-${program.id}`).then(val => {
      if (val) {
        try {
          const saved = JSON.parse(val) as Partial<BaseForm>;
          setForm(f => ({ ...f, ...saved }));
        } catch {
          // Corrupted draft — ignore
        }
      }
    });
  }, [program.id]);

  // K-174: Persist draft on every form change
  useEffect(() => {
    AsyncStorage.setItem(`${FORM_CACHE_KEY}-${program.id}`, JSON.stringify(form));
  }, [form, program.id]);

  // K-174: Check if form has any non-empty field for "Draft saved" indicator
  const hasDraft = Object.entries(form).some(([, v]) => {
    if (typeof v === 'boolean') return v === true;
    return typeof v === 'string' && v.trim().length > 0;
  });

  // Attempt to pre-fill from user profile
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, email, address, city, state, zip')
        .eq('id', user.id)
        .maybeSingle();
      if (!profile) return;
      const [firstName, ...rest] = (profile.full_name ?? '').split(' ');
      setForm(f => ({
        ...f,
        firstName: firstName ?? f.firstName,
        lastName: rest.join(' ') || f.lastName,
        phone: profile.phone ?? f.phone,
        email: profile.email ?? user.email ?? f.email,
        address: profile.address ?? f.address,
        city: profile.city ?? f.city,
        state: profile.state ?? f.state,
        zip: profile.zip ?? f.zip,
      }));
    })();
  }, []);

  const set = useCallback((key: keyof BaseForm) => (val: string | boolean) =>
    setForm(f => ({ ...f, [key]: val })), []);

  const canProceed = (): boolean => {
    if (step === 0) return !!(form.firstName && form.lastName && form.dob && form.ssnLast4.length === 4);
    if (step === 1) {
      if (program.id === 'SSI') return true; // disability step is optional disclosure
      if (program.id === 'WIC') return form.isPregnant || form.isBreastfeeding || form.hasInfant || form.hasChildUnder5;
      if (program.id === 'LIHEAP') return !!(form.householdSize && form.state);
      return !!(form.householdSize && form.address && form.city && form.state && form.zip);
    }
    if (step === 2) {
      if (program.id === 'WIC') return !!(form.householdSize && form.state && form.employmentStatus);
      return !!(form.employmentStatus && form.monthlyIncome);
    }
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const payload: Record<string, any> = {
        user_id: user.id,
        program: program.id,
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
      };

      // Program-specific fields
      if (program.id === 'Medicaid') {
        payload.has_health_insurance = form.hasHealthInsurance;
        payload.insurance_provider = form.insuranceProvider;
      }
      if (program.id === 'SSI') {
        payload.has_disability = form.hasDisability;
        payload.disability_type = form.disabilityType;
        payload.receiving_ssi = form.receivingSSI;
      }
      if (program.id === 'LIHEAP') {
        payload.utility_type = form.utilityType;
        payload.utility_provider = form.utilityProvider;
        payload.utility_account = form.utilityAccountNumber;
      }
      if (program.id === 'WIC') {
        payload.is_pregnant = form.isPregnant;
        payload.due_date = form.dueDate || null;
        payload.is_breastfeeding = form.isBreastfeeding;
        payload.has_infant = form.hasInfant;
        payload.infant_dob = form.infantDob || null;
        payload.has_child_under5 = form.hasChildUnder5;
        payload.child_dob = form.childDob || null;
      }

      const { error } = await supabase.from('applications').insert(payload);
      if (error) throw error;

      triggerReview();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // K-174: Clear draft after successful submission
      AsyncStorage.removeItem(`${FORM_CACHE_KEY}-${program.id}`).catch(() => {});
      showToast(`Your ${program.name} application has been submitted. You will receive updates in the Alerts tab.`, 'success');
      router.replace('/(tabs)/applications');
    } catch {
      showToast('Submission Failed. Please check your connection and try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (program.id) {
      case 'SNAP':
        switch (step) {
          case 0: return <StepPersonalInfo form={form} set={set} />;
          case 1: return <StepHousehold form={form} set={set} />;
          case 2: return <StepIncome form={form} set={set} />;
          case 3: return <StepDocuments programId="SNAP" form={form} set={set} />;
          case 4: return <StepReview programId="SNAP" program={program} form={form} />;
        }
        break;
      case 'Medicaid':
        switch (step) {
          case 0: return <StepPersonalInfo form={form} set={set} />;
          case 1: return <StepHousehold form={form} set={set} />;
          case 2: return <StepMedicaidInsurance form={form} set={set} />;
          case 3: return <StepDocuments programId="Medicaid" form={form} set={set} />;
          case 4: return <StepReview programId="Medicaid" program={program} form={form} />;
        }
        break;
      case 'SSI':
        switch (step) {
          case 0: return <StepPersonalInfo form={form} set={set} />;
          case 1: return <StepDisability form={form} set={set} />;
          case 2: return <StepIncome form={form} set={set} />;
          case 3: return <StepDocuments programId="SSI" form={form} set={set} />;
          case 4: return <StepReview programId="SSI" program={program} form={form} />;
        }
        break;
      case 'LIHEAP':
        switch (step) {
          case 0: return <StepPersonalInfo form={form} set={set} />;
          case 1: return <StepLIHEAPHousing form={form} set={set} />;
          case 2: return <StepIncome form={form} set={set} />;
          case 3: return <StepDocuments programId="LIHEAP" form={form} set={set} />;
          case 4: return <StepReview programId="LIHEAP" program={program} form={form} />;
        }
        break;
      case 'WIC':
        switch (step) {
          case 0: return <StepPersonalInfo form={form} set={set} />;
          case 1: return <StepWICEligibility form={form} set={set} />;
          case 2: return <StepWICHousehold form={form} set={set} />;
          case 3: return <StepDocuments programId="WIC" form={form} set={set} />;
          case 4: return <StepReview programId="WIC" program={program} form={form} />;
        }
        break;
    }
    return null;
  };

  const proceed = canProceed();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.wizardHeader}>
        <PressableScale haptic="light" onPress={step === 0 ? onBack : () => setStep(s => s - 1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </PressableScale>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.wizardTitle}>{program.name}</Text>
          <Text style={styles.stepLabel}>Step {step + 1} of {totalSteps} · {program.steps[step]}</Text>
          {/* K-174: Draft saved indicator */}
          {hasDraft && <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>Draft saved</Text>}
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, animProgressStyle]} />
      </View>

      {/* Step content */}
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View key={step} entering={FadeInDown.delay(0).duration(260).springify()}>
          <Text style={styles.stepTitle}>{program.steps[step]}</Text>
          {renderStep()}
        </Animated.View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {step > 0 && (
          <PressableScale
            haptic="light"
            style={styles.backBtn}
            onPress={() => {
              const prevStep = step - 1;
              progressAnim.value = withSpring(((prevStep + 1) / totalSteps) * 100, { damping: 20, stiffness: 350 });
              setStep(prevStep);
            }}
          >
            <Text style={styles.backBtnText}>Back</Text>
          </PressableScale>
        )}
        <PressableScale
          haptic="medium"
          style={[styles.nextBtn, { backgroundColor: proceed ? PRIMARY : '#9CA3AF' }]}
          onPress={() => {
            if (step < totalSteps - 1) {
              const nextStep = step + 1;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              progressAnim.value = withSpring(((nextStep + 1) / totalSteps) * 100, { damping: 20, stiffness: 350 });
              setStep(nextStep);
            } else {
              handleSubmit();
            }
          }}
          disabled={!proceed || submitting}
        >
          <Text style={styles.nextBtnText}>
            {submitting ? 'Submitting...' : step === totalSteps - 1 ? 'Submit Application' : 'Continue'}
          </Text>
        </PressableScale>
      </View>
      <Toast {...toast} onHide={hideToast} />
    </SafeAreaView>
  );
}

// ── Root Screen ───────────────────────────────────────────────────────────────

export default function ApplyScreen() {
  const params = useLocalSearchParams<{ program?: string }>();
  const [selectedProgram, setSelectedProgram] = useState<ProgramConfig | null>(null);

  // Support navigating directly to a program via URL params
  useEffect(() => {
    if (params.program) {
      const prog = PROGRAMS.find(p => p.id === params.program);
      if (prog) setSelectedProgram(prog);
    }
  }, [params.program]);

  if (selectedProgram) {
    return <ApplicationWizard program={selectedProgram} onBack={() => setSelectedProgram(null)} />;
  }
  return <ProgramSelect onSelect={setSelectedProgram} />;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // Program select
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 4 },
  headerSub: { fontSize: 14, color: '#6B7280' },
  programCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#F9FAFB', borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB',
  },
  programIconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  programName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  programDesc: { fontSize: 12, color: '#6B7280', lineHeight: 16, marginBottom: 4 },
  programBenefitRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  programBenefit: { fontSize: 12, fontWeight: '600' },
  programAgency: { fontSize: 11, color: '#9CA3AF' },

  // Wizard
  wizardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  wizardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  stepLabel: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  progressBar: { height: 4, backgroundColor: '#E5E7EB', marginHorizontal: 16, borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: PRIMARY, borderRadius: 2 },
  scroll: { padding: 16, paddingTop: 20, paddingBottom: 10 },
  stepTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 20 },
  stepSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },

  // Form elements
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputWrapper: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    backgroundColor: '#F9FAFB', overflow: 'hidden',
  },
  input: {
    padding: 12, fontSize: 15, color: '#111827',
  },
  selectChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  selectChipActive: { borderColor: PRIMARY, backgroundColor: '#EFF6FF' },
  selectChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  selectChipTextActive: { color: PRIMARY },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginBottom: 14,
  },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12,
    marginTop: 8, borderWidth: 1, borderColor: '#BFDBFE',
  },
  infoText: { flex: 1, fontSize: 12, color: PRIMARY, lineHeight: 17 },

  // Documents
  docIntro: { fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 19 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  docLabel: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 18 },

  // Review
  reviewSection: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  reviewSectionTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  reviewKey: { fontSize: 13, color: '#6B7280' },
  reviewVal: { fontSize: 13, fontWeight: '600', color: '#111827', textAlign: 'right', flex: 1, marginLeft: 12 },
  certText: { fontSize: 12, color: '#9CA3AF', lineHeight: 17, marginTop: 8 },

  // Footer
  footer: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  backBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: '#F3F4F6' },
  backBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  nextBtn: { flex: 2, borderRadius: 12, padding: 14, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
