'use client';
import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Switch, Linking, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  checkEligibility, estimateTotalBenefitValue,
  type UserProfile, type EligibleProgram,
} from '../../lib/eligibility-engine';
import { shareMultipleResults } from '../../lib/share';

const PRIMARY = '#1E40AF';
const SUCCESS = '#059669';
const DANGER = '#DC2626';

// ── Step types ────────────────────────────────────────────────────────────────
type Step = 'household' | 'income' | 'family' | 'situation' | 'results';

const STEPS: Step[] = ['household', 'income', 'family', 'situation', 'results'];
const STEP_TITLES: Record<Step, string> = {
  household: 'Your Household',
  income: 'Income & Housing',
  family: 'Family Situation',
  situation: 'Your Situation',
  results: 'Your Results',
};
const STEP_ICONS: Record<Step, string> = {
  household: 'people',
  income: 'cash',
  family: 'heart',
  situation: 'person',
  results: 'checkmark-circle',
};

const CATEGORY_ICONS: Record<string, string> = {
  food: 'restaurant',
  healthcare: 'medical',
  housing: 'home',
  childcare: 'people',
  cash: 'cash',
  energy: 'flash',
  education: 'school',
  employment: 'briefcase',
};
const CATEGORY_COLORS: Record<string, string> = {
  food: '#D97706', healthcare: '#7C3AED', housing: '#0891B2',
  childcare: '#DB2777', cash: '#059669', energy: '#EA580C',
  education: '#4F46E5', employment: '#0369A1',
};

// ── Default profile ───────────────────────────────────────────────────────────
const DEFAULT_PROFILE: UserProfile = {
  householdSize: 1,
  annualIncome: 0,
  state: 'CA',
  age: 30,
  hasChildren: false,
  childrenUnder5: false,
  childrenUnder18: 0,
  pregnant: false,
  disabled: false,
  veteran: false,
  elderly: false,
  citizen: true,
  legalResident: false,
  unemployed: false,
  receivingSSI: false,
  receivingTANF: false,
  housingType: 'renting',
  monthlyRent: 0,
  hasHealthInsurance: false,
  selfEmployed: false,
};

// ── UI helpers ────────────────────────────────────────────────────────────────
function ToggleRow({ label, sub, value, onToggle }: {
  label: string; sub?: string; value: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {sub ? <Text style={styles.toggleSub}>{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#D1D5DB', true: '#BFDBFE' }}
        thumbColor={value ? PRIMARY : '#9CA3AF'}
      />
    </View>
  );
}

function NumericInput({ label, value, onChange, prefix, suffix, keyboardType = 'numeric' }: {
  label: string; value: string; onChange: (v: string) => void;
  prefix?: string; suffix?: string; keyboardType?: 'numeric' | 'number-pad';
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputRow}>
        {prefix ? <Text style={styles.inputAddon}>{prefix}</Text> : null}
        <TextInput
          style={[styles.input, prefix ? { borderLeftWidth: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 } : undefined]}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          placeholder="0"
          placeholderTextColor="#9CA3AF"
        />
        {suffix ? <Text style={[styles.inputAddon, { borderLeft: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

function OptionPicker({ label, options, value, onSelect }: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            accessibilityRole="button"
            style={[styles.optionBtn, value === opt.value && styles.optionBtnActive]}
            onPress={() => onSelect(opt.value)}
          >
            <Text style={[styles.optionBtnText, value === opt.value && styles.optionBtnTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function EligibilityScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [results, setResults] = useState<EligibleProgram[] | null>(null);
  const [computing, setComputing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const currentStep = STEPS[stepIndex];

  const set = useCallback(<K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  }, []);

  const goNext = useCallback(async () => {
    if (stepIndex === STEPS.length - 2) {
      // Last questionnaire step → compute results
      setComputing(true);
      setStepIndex(STEPS.length - 1);
      // Small delay for UX
      await new Promise(r => setTimeout(r, 300));
      const programs = checkEligibility(profile);
      setResults(programs);
      setComputing(false);
    } else {
      setStepIndex(i => i + 1);
    }
  }, [stepIndex, profile]);

  const goBack = useCallback(() => {
    if (stepIndex === 0) return;
    if (currentStep === 'results') {
      setResults(null);
      setStepIndex(STEPS.length - 2);
    } else {
      setStepIndex(i => i - 1);
    }
  }, [stepIndex, currentStep]);

  const restart = useCallback(() => {
    setResults(null);
    setStepIndex(0);
    setProfile(DEFAULT_PROFILE);
    setExpandedId(null);
  }, []);

  // ── Step progress bar ────────────────────────────────────────────────────
  const progressBar = (
    <View style={styles.progressBar}>
      {STEPS.slice(0, -1).map((s, i) => (
        <View key={s} style={[styles.progressDot, i <= stepIndex - 1 && styles.progressDotDone, i === stepIndex && styles.progressDotActive]} />
      ))}
    </View>
  );

  // ── Questionnaire steps ──────────────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {
      case 'household':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{STEP_TITLES.household}</Text>
            <Text style={styles.stepSub}>Tell us about the people you live with</Text>
            <NumericInput
              label="Number of people in household"
              value={String(profile.householdSize)}
              onChange={v => set('householdSize', Math.max(1, parseInt(v) || 1))}
            />
            <NumericInput
              label="Your age"
              value={String(profile.age)}
              onChange={v => set('age', parseInt(v) || 18)}
            />
            <OptionPicker
              label="Citizenship status"
              options={[
                { value: 'citizen', label: 'US Citizen' },
                { value: 'resident', label: 'Legal Resident' },
                { value: 'other', label: 'Other' },
              ]}
              value={profile.citizen ? 'citizen' : profile.legalResident ? 'resident' : 'other'}
              onSelect={v => {
                set('citizen', v === 'citizen');
                set('legalResident', v === 'resident');
              }}
            />
          </View>
        );

      case 'income':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{STEP_TITLES.income}</Text>
            <Text style={styles.stepSub}>Used only to calculate eligibility</Text>
            <NumericInput
              label="Annual household income"
              value={String(profile.annualIncome)}
              onChange={v => set('annualIncome', parseInt(v) || 0)}
              prefix="$"
            />
            <OptionPicker
              label="Housing situation"
              options={[
                { value: 'renting', label: 'Renting' },
                { value: 'owning', label: 'Owning' },
                { value: 'homeless', label: 'Unhoused' },
                { value: 'other', label: 'Other' },
              ]}
              value={profile.housingType}
              onSelect={v => set('housingType', v as UserProfile['housingType'])}
            />
            {profile.housingType === 'renting' && (
              <NumericInput
                label="Monthly rent"
                value={String(profile.monthlyRent)}
                onChange={v => set('monthlyRent', parseInt(v) || 0)}
                prefix="$"
              />
            )}
            <ToggleRow
              label="Self-employed"
              value={profile.selfEmployed}
              onToggle={v => set('selfEmployed', v)}
            />
          </View>
        );

      case 'family':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{STEP_TITLES.family}</Text>
            <Text style={styles.stepSub}>Family structure affects many programs</Text>
            <ToggleRow
              label="Have dependent children"
              value={profile.hasChildren}
              onToggle={v => {
                set('hasChildren', v);
                if (!v) { set('childrenUnder18', 0); set('childrenUnder5', false); }
              }}
            />
            {profile.hasChildren && (
              <>
                <NumericInput
                  label="Children under 18"
                  value={String(profile.childrenUnder18)}
                  onChange={v => set('childrenUnder18', parseInt(v) || 0)}
                />
                <ToggleRow
                  label="Children under 5"
                  sub="Affects WIC, Head Start eligibility"
                  value={profile.childrenUnder5}
                  onToggle={v => set('childrenUnder5', v)}
                />
              </>
            )}
            <ToggleRow
              label="Currently pregnant"
              value={profile.pregnant}
              onToggle={v => set('pregnant', v)}
            />
          </View>
        );

      case 'situation':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{STEP_TITLES.situation}</Text>
            <Text style={styles.stepSub}>Personal circumstances that unlock benefits</Text>
            <ToggleRow
              label="Have a disability"
              sub="Qualifies for SSI, Medicaid, housing priority"
              value={profile.disabled}
              onToggle={v => set('disabled', v)}
            />
            <ToggleRow
              label="Veteran or military"
              sub="VA pension, healthcare, and more"
              value={profile.veteran}
              onToggle={v => set('veteran', v)}
            />
            <ToggleRow
              label="Age 60 or older"
              sub="Medicare Extra Help, senior programs"
              value={profile.elderly}
              onToggle={v => set('elderly', v)}
            />
            <ToggleRow
              label="Currently unemployed"
              sub="UI benefits, SNAP E&T, job training"
              value={profile.unemployed}
              onToggle={v => set('unemployed', v)}
            />
            <ToggleRow
              label="Have health insurance"
              value={profile.hasHealthInsurance}
              onToggle={v => set('hasHealthInsurance', v)}
            />
          </View>
        );

      default:
        return null;
    }
  };

  // ── Results view ─────────────────────────────────────────────────────────
  const renderResults = () => {
    if (computing || !results) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Checking 15+ programs…</Text>
        </View>
      );
    }

    const eligible = results.filter(p => p.eligible);
    const ineligible = results.filter(p => !p.eligible);
    const monthlyValue = estimateTotalBenefitValue(results);

    return (
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryBig}>{eligible.length}</Text>
              <Text style={styles.summaryLabel}>Programs qualified</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryBig}>${monthlyValue.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Est. monthly value</Text>
            </View>
          </View>
          <View style={styles.summaryActions}>
            <TouchableOpacity accessibilityRole="button" style={styles.restartBtn} onPress={restart}>
              <Ionicons name="refresh" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.restartBtnText}>Update my profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.shareBtn}
              onPress={() =>
                shareMultipleResults(
                  results.map((r) => ({
                    programName: r.name,
                    status: r.eligible ? 'eligible' : 'ineligible',
                    benefit: r.estimatedBenefit,
                  }))
                )
              }
            >
              <Ionicons name="share-outline" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.restartBtnText}>Share Results</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Eligible programs */}
        {eligible.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>You may qualify for</Text>
            {eligible.map(p => (
              <ProgramCard
                key={p.id}
                program={p}
                expanded={expandedId === p.id}
                onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
              />
            ))}
          </>
        )}

        {/* Not eligible */}
        {ineligible.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Not eligible</Text>
            {ineligible.map(p => (
              <View key={p.id} style={[styles.programCard, styles.ineligibleCard]}>
                <View style={styles.programRow}>
                  <Ionicons name="close-circle" size={18} color={DANGER} />
                  <Text style={[styles.programName, { color: '#6B7280', flex: 1 }]}>{p.shortName}</Text>
                  {p.category ? (
                    <View style={[styles.categoryBadge, { backgroundColor: `${CATEGORY_COLORS[p.category]}20` }]}>
                      <Text style={[styles.categoryBadgeText, { color: CATEGORY_COLORS[p.category] }]}>{p.category}</Text>
                    </View>
                  ) : null}
                </View>
                {p.ineligibilityReason ? (
                  <Text style={styles.ineligibleReason}>{p.ineligibilityReason}</Text>
                ) : null}
              </View>
            ))}
          </>
        )}

        <Text style={styles.disclaimer}>
          These results are informational estimates based on federal guidelines (FY 2024). Actual eligibility is determined by your state agency. Income and eligibility rules vary by state.
        </Text>
      </ScrollView>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────
  const isResults = currentStep === 'results';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {stepIndex > 0 && (
          <TouchableOpacity accessibilityRole="button" onPress={goBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={PRIMARY} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{isResults ? 'Your Eligibility Results' : 'Check Eligibility'}</Text>
        {!isResults && <View style={{ width: 36 }} />}
      </View>

      {!isResults && progressBar}

      {isResults ? (
        renderResults()
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {renderStep()}
          </ScrollView>

          {/* Next button */}
          <View style={styles.footer}>
            <TouchableOpacity accessibilityRole="button" style={styles.nextBtn} onPress={goNext}>
              <Text style={styles.nextBtnText}>
                {stepIndex === STEPS.length - 2 ? 'Check My Eligibility' : 'Continue'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

// ── Program card ─────────────────────────────────────────────────────────────
function ProgramCard({ program: p, expanded, onToggle }: {
  program: EligibleProgram; expanded: boolean; onToggle: () => void;
}) {
  const catColor = CATEGORY_COLORS[p.category] ?? PRIMARY;
  return (
    <View style={[styles.programCard, styles.eligibleCard]}>
      <TouchableOpacity accessibilityRole="button" onPress={onToggle} style={styles.programHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: `${catColor}20` }]}>
          <Ionicons name={(CATEGORY_ICONS[p.category] ?? 'star') as never} size={16} color={catColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.programName}>{p.name}</Text>
          <Text style={styles.programAmount}>{p.estimatedBenefit}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#9CA3AF" />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.programDetails}>
          <Text style={styles.programDesc}>{p.description}</Text>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{p.deadline}</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.applyBtn, { backgroundColor: catColor }]}
            onPress={() => Linking.openURL(p.applicationUrl)}
          >
            <Text style={styles.applyBtnText}>Start Application</Text>
            <Ionicons name="open-outline" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#EFF6FF' },
  progressBar: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  progressDotActive: { backgroundColor: PRIMARY, width: 20 },
  progressDotDone: { backgroundColor: '#BFDBFE' },
  scroll: { padding: 16, paddingBottom: 32 },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  nextBtn: { backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Step content
  stepContent: { gap: 16 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  stepSub: { fontSize: 14, color: '#6B7280', marginTop: -8 },

  // Input
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: '#111827' },
  inputAddon: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, borderTopRightRadius: 0, borderBottomRightRadius: 0, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: '#6B7280' },

  // Toggle
  toggleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, gap: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  toggleSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  // Option picker
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB' },
  optionBtnActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  optionBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  optionBtnTextActive: { color: '#fff' },

  // Results
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 15, color: '#6B7280', fontWeight: '500' },
  summaryCard: { backgroundColor: PRIMARY, borderRadius: 18, padding: 20, marginBottom: 16, gap: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)' },
  summaryBig: { fontSize: 28, fontWeight: '800', color: '#fff' },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  summaryActions: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  restartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  restartBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 8 },

  // Program cards
  programCard: { borderRadius: 14, borderWidth: 1, marginBottom: 8, overflow: 'hidden' },
  eligibleCard: { backgroundColor: '#fff', borderColor: '#E5E7EB' },
  ineligibleCard: { backgroundColor: '#F9FAFB', borderColor: '#F3F4F6', padding: 12 },
  programHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  categoryIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  programName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  programAmount: { fontSize: 13, color: SUCCESS, fontWeight: '600', marginTop: 2 },
  programRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  programDetails: { paddingHorizontal: 14, paddingBottom: 14, gap: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  programDesc: { fontSize: 13, color: '#6B7280', lineHeight: 19 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: '#6B7280' },
  applyBtn: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  applyBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  categoryBadgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  ineligibleReason: { fontSize: 12, color: '#9CA3AF', marginTop: 4, marginLeft: 26 },
  disclaimer: { fontSize: 11, color: '#9CA3AF', lineHeight: 16, marginTop: 16, textAlign: 'center' },
});
