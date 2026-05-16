import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TextInput, Switch, Linking, ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from '@/components/PressableScale';
import {
  checkEligibility, estimateTotalBenefitValue,
  type UserProfile, type EligibleProgram,
} from '../../lib/eligibility-engine';
import { shareMultipleResults } from '../../lib/share';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { getBenefitsMaximizer, type BenefitsMaximizerResult } from '../../lib/api';

const PRIMARY = '#1E40AF';
const SUCCESS = '#059669';
const DANGER = '#DC2626';

// ── Step types ────────────────────────────────────────────────────────────────
type Step = 'household' | 'income' | 'family' | 'situation' | 'results';

const STEPS: Step[] = ['household', 'income', 'family', 'situation', 'results'];
const STEP_TITLE_KEYS: Record<Step, string> = {
  household: 'eligibility.stepHousehold',
  income: 'eligibility.stepIncome',
  family: 'eligibility.stepFamily',
  situation: 'eligibility.stepSituation',
  results: 'eligibility.stepResults',
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
        {suffix ? <Text style={[styles.inputAddon, { borderLeftWidth: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}>{suffix}</Text> : null}
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
          <PressableScale
            key={opt.value}
            accessibilityRole="button"
            haptic="light"
            style={[styles.optionBtn, value === opt.value && styles.optionBtnActive]}
            onPress={() => onSelect(opt.value)}
          >
            <Text style={[styles.optionBtnText, value === opt.value && styles.optionBtnTextActive]}>
              {opt.label}
            </Text>
          </PressableScale>
        ))}
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function EligibilityScreen() {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [results, setResults] = useState<EligibleProgram[] | null>(null);
  const [computing, setComputing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [aiMaximizer, setAiMaximizer] = useState<BenefitsMaximizerResult | null>(null);
  const [maximizerLoading, setMaximizerLoading] = useState(false);

  const currentStep = STEPS[stepIndex];

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) {
        setProfile((prev) => ({
          ...prev,
          householdSize: data.household_size ?? prev.householdSize,
          annualIncome: data.annual_income ?? prev.annualIncome,
          state: data.state ?? prev.state,
          age: data.age ?? prev.age,
          hasChildren: data.has_children ?? prev.hasChildren,
          childrenUnder5: data.children_under5 ?? prev.childrenUnder5,
          childrenUnder18: data.children_under18 ?? prev.childrenUnder18,
          pregnant: data.pregnant ?? prev.pregnant,
          disabled: data.disabled ?? prev.disabled,
          veteran: data.veteran ?? prev.veteran,
          elderly: data.elderly ?? prev.elderly,
          citizen: data.citizen ?? prev.citizen,
          legalResident: data.legal_resident ?? prev.legalResident,
          unemployed: data.unemployed ?? prev.unemployed,
          receivingSSI: data.receiving_ssi ?? prev.receivingSSI,
          receivingTANF: data.receiving_tanf ?? prev.receivingTANF,
          housingType: data.housing_type ?? prev.housingType,
          monthlyRent: data.monthly_rent ?? prev.monthlyRent,
          hasHealthInsurance: data.has_health_insurance ?? prev.hasHealthInsurance,
          selfEmployed: data.self_employed ?? prev.selfEmployed,
        }));
      }
    })();
  }, []);

  const set = useCallback(<K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  }, []);

  const saveProfileToSupabase = useCallback(async (p: UserProfile) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').upsert({
      id: user.id,
      household_size: p.householdSize,
      annual_income: p.annualIncome,
      state: p.state,
      age: p.age,
      has_children: p.hasChildren,
      children_under5: p.childrenUnder5,
      children_under18: p.childrenUnder18,
      pregnant: p.pregnant,
      disabled: p.disabled,
      veteran: p.veteran,
      elderly: p.elderly,
      citizen: p.citizen,
      legal_resident: p.legalResident,
      unemployed: p.unemployed,
      receiving_ssi: p.receivingSSI,
      receiving_tanf: p.receivingTANF,
      housing_type: p.housingType,
      monthly_rent: p.monthlyRent,
      has_health_insurance: p.hasHealthInsurance,
      self_employed: p.selfEmployed,
    }, { onConflict: 'id' });
  }, []);

  const goNext = useCallback(async () => {
    if (stepIndex === STEPS.length - 2) {
      // Last questionnaire step → compute results and save profile
      setComputing(true);
      setStepIndex(STEPS.length - 1);
      await new Promise(r => setTimeout(r, 300));
      const programs = checkEligibility(profile);
      setResults(programs);
      // Persist profile in background
      saveProfileToSupabase(profile).catch(() => {});
      setComputing(false);
      // Trigger AI benefits maximizer asynchronously
      setMaximizerLoading(true);
      const eligible = programs.filter(p => p.eligible);
      const nearMiss = programs.filter(p => !p.eligible);
      getBenefitsMaximizer({
        profile: profile as unknown as Record<string, unknown>,
        eligiblePrograms: eligible.map(p => ({ name: p.name })),
        nearMissPrograms: nearMiss.slice(0, 5).map(p => ({ name: p.name })),
      }).then(m => { setAiMaximizer(m); setMaximizerLoading(false); })
        .catch(() => setMaximizerLoading(false));
    } else {
      setStepIndex(i => i + 1);
    }
  }, [stepIndex, profile, saveProfileToSupabase]);

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
    setAiMaximizer(null);
    setMaximizerLoading(false);
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
            <Text style={styles.stepTitle}>{t(STEP_TITLE_KEYS.household)}</Text>
            <Text style={styles.stepSub}>{t('eligibility.subHousehold')}</Text>
            <NumericInput
              label={t('eligibility.householdSize')}
              value={String(profile.householdSize)}
              onChange={v => set('householdSize', Math.max(1, parseInt(v) || 1))}
            />
            <NumericInput
              label={t('eligibility.yourAge')}
              value={String(profile.age)}
              onChange={v => set('age', parseInt(v) || 18)}
            />
            <OptionPicker
              label={t('eligibility.citizenshipStatus')}
              options={[
                { value: 'citizen', label: t('eligibility.usCitizen') },
                { value: 'resident', label: t('eligibility.legalResident') },
                { value: 'other', label: t('eligibility.other') },
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
            <Text style={styles.stepTitle}>{t(STEP_TITLE_KEYS.income)}</Text>
            <Text style={styles.stepSub}>{t('eligibility.subIncome')}</Text>
            <NumericInput
              label={t('eligibility.annualIncome')}
              value={String(profile.annualIncome)}
              onChange={v => set('annualIncome', parseInt(v) || 0)}
              prefix="$"
            />
            <OptionPicker
              label={t('eligibility.housingSituation')}
              options={[
                { value: 'renting', label: t('eligibility.housingRenting') },
                { value: 'owning', label: t('eligibility.housingOwning') },
                { value: 'homeless', label: t('eligibility.housingUnhoused') },
                { value: 'other', label: t('eligibility.other') },
              ]}
              value={profile.housingType}
              onSelect={v => set('housingType', v as UserProfile['housingType'])}
            />
            {profile.housingType === 'renting' && (
              <NumericInput
                label={t('eligibility.monthlyRent')}
                value={String(profile.monthlyRent)}
                onChange={v => set('monthlyRent', parseInt(v) || 0)}
                prefix="$"
              />
            )}
            <ToggleRow
              label={t('eligibility.selfEmployed')}
              value={profile.selfEmployed}
              onToggle={v => set('selfEmployed', v)}
            />
          </View>
        );

      case 'family':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t(STEP_TITLE_KEYS.family)}</Text>
            <Text style={styles.stepSub}>{t('eligibility.subFamily')}</Text>
            <ToggleRow
              label={t('eligibility.hasDependentChildren')}
              value={profile.hasChildren}
              onToggle={v => {
                set('hasChildren', v);
                if (!v) { set('childrenUnder18', 0); set('childrenUnder5', false); }
              }}
            />
            {profile.hasChildren && (
              <>
                <NumericInput
                  label={t('eligibility.childrenUnder18')}
                  value={String(profile.childrenUnder18)}
                  onChange={v => set('childrenUnder18', parseInt(v) || 0)}
                />
                <ToggleRow
                  label={t('eligibility.childrenUnder5')}
                  sub={t('eligibility.childrenUnder5Sub')}
                  value={profile.childrenUnder5}
                  onToggle={v => set('childrenUnder5', v)}
                />
              </>
            )}
            <ToggleRow
              label={t('eligibility.currentlyPregnant')}
              value={profile.pregnant}
              onToggle={v => set('pregnant', v)}
            />
          </View>
        );

      case 'situation':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t(STEP_TITLE_KEYS.situation)}</Text>
            <Text style={styles.stepSub}>{t('eligibility.subSituation')}</Text>
            <ToggleRow
              label={t('eligibility.hasDisability')}
              sub={t('eligibility.hasDisabilitySub')}
              value={profile.disabled}
              onToggle={v => set('disabled', v)}
            />
            <ToggleRow
              label={t('eligibility.isVeteran')}
              sub={t('eligibility.isVeteranSub')}
              value={profile.veteran}
              onToggle={v => set('veteran', v)}
            />
            <ToggleRow
              label={t('eligibility.isSenior')}
              sub={t('eligibility.isSeniorSub')}
              value={profile.elderly}
              onToggle={v => set('elderly', v)}
            />
            <ToggleRow
              label={t('eligibility.isUnemployed')}
              sub={t('eligibility.isUnemployedSub')}
              value={profile.unemployed}
              onToggle={v => set('unemployed', v)}
            />
            <ToggleRow
              label={t('eligibility.hasHealthInsurance')}
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
          <Text style={styles.loadingText}>{t('eligibility.checkingPrograms', { count: 15 })}</Text>
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
              <Text style={styles.summaryLabel}>{t('eligibility.programsQualified')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryBig}>${monthlyValue.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>{t('eligibility.estMonthlyValue')}</Text>
            </View>
          </View>
          <View style={styles.summaryActions}>
            <PressableScale accessibilityRole="button" haptic="light" style={styles.restartBtn} onPress={restart}>
              <Ionicons name="refresh" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.restartBtnText}>{t('eligibility.updateMyProfile')}</Text>
            </PressableScale>
            <PressableScale
              accessibilityRole="button"
              haptic="light"
              style={styles.shareBtn}
              onPress={() =>
                shareMultipleResults(
                  results.map((r) => ({
                    programName: r.name,
                    status: r.eligible ? 'eligible' : 'ineligible' as 'eligible' | 'ineligible',
                    benefit: r.estimatedBenefit ?? undefined,
                  }))
                )
              }
            >
              <Ionicons name="share-outline" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.restartBtnText}>{t('eligibility.shareResults')}</Text>
            </PressableScale>
          </View>
        </View>

        {/* AI Benefits Maximizer Card */}
        {(maximizerLoading || aiMaximizer) && (
          <View style={styles.maximizerCard}>
            <View style={styles.maximizerHeader}>
              <Text style={{ fontSize: 18 }}>🤖</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.maximizerTitle}>AI Benefits Maximizer</Text>
                {aiMaximizer?.estimatedUnclaimedValue ? (
                  <Text style={styles.maximizerSub}>~${aiMaximizer.estimatedUnclaimedValue.toLocaleString()}/mo potential unclaimed</Text>
                ) : null}
              </View>
              {maximizerLoading && <ActivityIndicator color={PRIMARY} size="small" />}
            </View>

            {maximizerLoading && !aiMaximizer && (
              <Text style={styles.maximizerLoadingText}>Analyzing your profile for hidden opportunities...</Text>
            )}

            {aiMaximizer && (
              <>
                {aiMaximizer.urgentDeadline && (
                  <View style={styles.urgentBanner}>
                    <Ionicons name="alarm" size={14} color="#DC2626" />
                    <Text style={styles.urgentText}>{aiMaximizer.urgentDeadline}</Text>
                  </View>
                )}

                <Text style={styles.maximizerSectionLabel}>Priority Actions</Text>
                {aiMaximizer.priorityActions.map((action, i) => (
                  <View key={i} style={styles.maximizerItem}>
                    <View style={styles.priorityNum}><Text style={styles.priorityNumText}>{i + 1}</Text></View>
                    <Text style={styles.maximizerItemText}>{action}</Text>
                  </View>
                ))}

                <Text style={styles.maximizerSectionLabel}>Hidden Opportunities</Text>
                {aiMaximizer.hiddenOpportunities.map((opp, i) => (
                  <View key={i} style={styles.maximizerItem}>
                    <Ionicons name="sparkles" size={14} color="#D97706" />
                    <Text style={styles.maximizerItemText}>{opp}</Text>
                  </View>
                ))}

                {aiMaximizer.nearMissStrategy ? (
                  <View style={styles.nearMissBox}>
                    <Text style={styles.nearMissLabel}>Near-Miss Strategy</Text>
                    <Text style={styles.nearMissText}>{aiMaximizer.nearMissStrategy}</Text>
                  </View>
                ) : null}

                {aiMaximizer.applicationTip ? (
                  <View style={styles.applicationTipBox}>
                    <Ionicons name="bulb" size={14} color="#4F46E5" />
                    <Text style={styles.applicationTipText}>{aiMaximizer.applicationTip}</Text>
                  </View>
                ) : null}
              </>
            )}
          </View>
        )}

        {/* Eligible programs */}
        {eligible.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('eligibility.youMayQualifyFor')}</Text>
            {eligible.map((p, index) => (
              <Animated.View key={p.id} entering={FadeInDown.delay(80 + index * 60).duration(350)}>
                <ProgramCard
                  program={p}
                  expanded={expandedId === p.id}
                  onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
                />
              </Animated.View>
            ))}
          </>
        )}

        {/* Not eligible */}
        {ineligible.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>{t('eligibility.notEligible')}</Text>
            {ineligible.map((p, index) => (
              <Animated.View key={p.id} entering={FadeInDown.delay(80 + index * 60).duration(350)}>
                <View style={[styles.programCard, styles.ineligibleCard]}>
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
              </Animated.View>
            ))}
          </>
        )}

        <Text style={styles.disclaimer}>{t('eligibility.disclaimer')}</Text>
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
          <PressableScale accessibilityRole="button" haptic="light" onPress={goBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={PRIMARY} />
          </PressableScale>
        )}
        <Text style={styles.headerTitle}>{isResults ? t('eligibility.yourResults') : t('eligibility.checkEligibility')}</Text>
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
            <PressableScale accessibilityRole="button" haptic="medium" style={styles.nextBtn} onPress={goNext}>
              <Text style={styles.nextBtnText}>
                {stepIndex === STEPS.length - 2 ? t('eligibility.checkMyEligibility') : t('eligibility.continueBtn')}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </PressableScale>
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
  const { t } = useTranslation();
  const catColor = CATEGORY_COLORS[p.category] ?? PRIMARY;
  return (
    <View style={[styles.programCard, styles.eligibleCard]}>
      <PressableScale accessibilityRole="button" haptic="light" onPress={onToggle} style={styles.programHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: `${catColor}20` }]}>
          <Ionicons name={(CATEGORY_ICONS[p.category] ?? 'star') as never} size={16} color={catColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.programName}>{p.name}</Text>
          <Text style={styles.programAmount}>{p.estimatedBenefit}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#9CA3AF" />
      </PressableScale>

      {expanded && (
        <View style={styles.programDetails}>
          <Text style={styles.programDesc}>{p.description}</Text>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{p.deadline}</Text>
          </View>
          <PressableScale
            accessibilityRole="button"
            haptic="medium"
            style={[styles.applyBtn, { backgroundColor: catColor }]}
            onPress={() => Linking.openURL(p.applicationUrl)}
          >
            <Text style={styles.applyBtnText}>{t('eligibility.startApplication')}</Text>
            <Ionicons name="open-outline" size={14} color="#fff" />
          </PressableScale>
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
  // AI Maximizer
  maximizerCard: { backgroundColor: '#EFF6FF', borderRadius: 14, borderWidth: 1, borderColor: '#BFDBFE', padding: 16, marginBottom: 20 },
  maximizerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  maximizerTitle: { fontSize: 15, fontWeight: '800', color: PRIMARY },
  maximizerSub: { fontSize: 12, color: '#1D4ED8', marginTop: 2 },
  maximizerLoadingText: { fontSize: 13, color: '#6B7280', fontStyle: 'italic' },
  urgentBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: 8, padding: 8, marginBottom: 10, borderWidth: 1, borderColor: '#FECACA' },
  urgentText: { fontSize: 12, color: '#DC2626', flex: 1, fontWeight: '600' },
  maximizerSectionLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 10 },
  maximizerItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  priorityNum: { width: 18, height: 18, borderRadius: 9, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  priorityNumText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  maximizerItemText: { fontSize: 13, color: '#374151', flex: 1, lineHeight: 18 },
  nearMissBox: { backgroundColor: '#FFFBEB', borderRadius: 8, padding: 10, marginTop: 10, borderWidth: 1, borderColor: '#FDE68A' },
  nearMissLabel: { fontSize: 11, fontWeight: '700', color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  nearMissText: { fontSize: 13, color: '#78350F', lineHeight: 18 },
  applicationTipBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#EEF2FF', borderRadius: 8, padding: 10, marginTop: 8, borderWidth: 1, borderColor: '#C7D2FE' },
  applicationTipText: { fontSize: 13, color: '#3730A3', flex: 1, lineHeight: 18 },
});
