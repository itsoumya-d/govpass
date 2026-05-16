import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Linking,
} from 'react-native';
import PressableScale from '@/components/PressableScale';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  checkEligibility, type UserProfile, type EligibleProgram,
} from '../../lib/eligibility-engine';
import { shareMultipleResults } from '../../lib/share';
import { supabase } from '../../lib/supabase';

const PRIMARY = '#1E40AF';
const BG = '#0F172A';
const CARD = '#1E293B';
const BORDER = '#334155';
const SUCCESS = '#10B981';
const WARN = '#F59E0B';
const DANGER = '#EF4444';

type FilterTab = 'all' | 'eligible' | 'maybe' | 'ineligible';

const STATUS_CONFIG = {
  eligible: { label: 'Likely Eligible', color: SUCCESS, bg: `${SUCCESS}20`, icon: 'checkmark-circle' as const },
  maybe: { label: 'May Qualify', color: WARN, bg: `${WARN}20`, icon: 'help-circle' as const },
  ineligible: { label: 'Not Eligible', color: DANGER, bg: `${DANGER}20`, icon: 'close-circle' as const },
};

const CATEGORY_ICONS: Record<string, string> = {
  food: 'restaurant', healthcare: 'medical', housing: 'home',
  childcare: 'people', cash: 'cash', energy: 'flash',
  education: 'school', employment: 'briefcase',
};

const FILTERS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'eligible', label: 'Eligible' },
  { id: 'maybe', label: 'May Qualify' },
  { id: 'ineligible', label: 'Not Eligible' },
];

/** Map an engine program to the three-way status used in this screen */
function programStatus(p: EligibleProgram): 'eligible' | 'maybe' | 'ineligible' {
  if (p.eligible) return 'eligible';
  // Mark as "maybe" if the only issue is a borderline condition
  if (p.ineligibilityReason?.toLowerCase().includes('check') || p.ineligibilityReason?.toLowerCase().includes('may')) return 'maybe';
  return 'ineligible';
}

export default function EligibilityResultsScreen() {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [programs, setPrograms] = useState<EligibleProgram[]>([]);

  // Accept serialized profile from navigation params (set by eligibility.tsx if navigating here)
  const params = useLocalSearchParams<{ profile?: string }>();

  useEffect(() => {
    if (params.profile) {
      try {
        const profile = JSON.parse(params.profile) as UserProfile;
        setPrograms(checkEligibility(profile));
        return;
      } catch {
        // fall through to fetching saved profile
      }
    }
    // Fetch the user's saved profile from Supabase
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => {
          if (!data) return;
          const profile: UserProfile = {
            householdSize: data.household_size ?? 1,
            annualIncome: data.annual_income ?? 0,
            state: data.state ?? 'CA',
            age: data.age ?? 18,
            hasChildren: data.has_children ?? false,
            childrenUnder5: data.children_under_5 ?? false,
            childrenUnder18: data.children_under_18 ?? 0,
            pregnant: data.pregnant ?? false,
            disabled: data.disabled ?? false,
            veteran: data.veteran ?? false,
            elderly: data.elderly ?? false,
            citizen: data.citizen ?? false,
            legalResident: data.legal_resident ?? false,
            unemployed: data.unemployed ?? false,
            receivingSSI: data.receiving_ssi ?? false,
            receivingTANF: data.receiving_tanf ?? false,
            housingType: data.housing_type ?? 'renting',
            monthlyRent: data.monthly_rent ?? 0,
            hasHealthInsurance: data.has_health_insurance ?? false,
            selfEmployed: data.self_employed ?? false,
          };
          setPrograms(checkEligibility(profile));
        });
    });
  }, [params.profile]);

  const withStatus = programs.map(p => ({ ...p, uiStatus: programStatus(p) }));

  const filtered = filter === 'all'
    ? withStatus
    : withStatus.filter(p => p.uiStatus === filter);

  const eligibleCount = withStatus.filter(p => p.uiStatus === 'eligible').length;
  const maybeCount = withStatus.filter(p => p.uiStatus === 'maybe').length;
  const totalAnnual = programs.filter(p => p.eligible).reduce((sum, p) => {
    const match = p.estimatedBenefit?.match(/\$(\d[\d,]*)/);
    if (!match) return sum;
    const monthly = parseInt(match[1].replace(',', ''), 10);
    return sum + (monthly * 12);
  }, 0);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <PressableScale haptic="light" onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </PressableScale>
        <Text style={s.headerTitle}>Eligibility Results</Text>
        <PressableScale haptic="light"
          accessibilityLabel="Share eligibility results"
          style={s.shareBtn}
          onPress={() =>
            shareMultipleResults(
              withStatus.map((p) => ({
                programName: p.name,
                status:
                  p.uiStatus === 'eligible'
                    ? 'eligible'
                    : p.uiStatus === 'maybe'
                    ? 'pending'
                    : 'ineligible',
                benefit: p.uiStatus !== 'ineligible' ? (p.estimatedBenefit ?? undefined) : undefined,
              }))
            )
          }
        >
          <Ionicons name="share-outline" size={22} color="#FFFFFF" />
        </PressableScale>
      </View>

      {/* Total Benefit Banner */}
      <View style={s.bannerCard}>
        <Text style={s.bannerLabel}>Estimated Annual Benefit</Text>
        <Text style={s.bannerAmount}>
          {totalAnnual > 0 ? `$${totalAnnual.toLocaleString()}/year` : 'See programs below'}
        </Text>
        <Text style={s.bannerSub}>
          {eligibleCount} programs eligible · {maybeCount} may qualify
        </Text>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}
      >
        {FILTERS.map(f => (
          <PressableScale haptic="light"
            key={f.id}
            onPress={() => setFilter(f.id)}
            style={[s.filterTab, filter === f.id && s.filterTabActive]}
          >
            <Text style={[s.filterTabText, filter === f.id && s.filterTabTextActive]}>{f.label}</Text>
          </PressableScale>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {filtered.map(prog => {
          const status = prog.uiStatus;
          const cfg = STATUS_CONFIG[status];
          const isExpanded = expanded === prog.id;
          const catIcon = (CATEGORY_ICONS[prog.category] ?? 'star') as never;

          return (
            <PressableScale haptic="light"
              key={prog.id}
              style={s.programCard}
              onPress={() => setExpanded(isExpanded ? null : prog.id)}
            >
              {/* Program Header */}
              <View style={s.programHeader}>
                <View style={[s.agencyIcon, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={catIcon} size={20} color={cfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.programName}>{prog.name}</Text>
                  <Text style={s.agencyName}>{prog.category.charAt(0).toUpperCase() + prog.category.slice(1)}</Text>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#64748B"
                />
              </View>

              {/* Status & Estimated Benefit */}
              <View style={s.statusValueRow}>
                <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={cfg.icon} size={13} color={cfg.color} />
                  <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
                {prog.estimatedBenefit && status !== 'ineligible' && (
                  <Text style={s.valueText}>{prog.estimatedBenefit}</Text>
                )}
              </View>

              {/* Expanded Details */}
              {isExpanded && (
                <View style={s.expandedContent}>
                  <Text style={s.descText}>{prog.description}</Text>

                  {/* Deadline */}
                  <View style={s.deadlineRow}>
                    <Ionicons name="calendar-outline" size={13} color="#64748B" />
                    <Text style={s.deadlineText}>{prog.deadline}</Text>
                  </View>

                  {/* Ineligibility reason */}
                  {prog.ineligibilityReason && status !== 'eligible' && (
                    <View style={s.reqSection}>
                      <Text style={[s.reqTitle, { color: status === 'maybe' ? WARN : DANGER }]}>
                        {status === 'maybe' ? 'May Need' : 'Not Eligible Because'}
                      </Text>
                      <View style={s.reqRow}>
                        <Ionicons name={status === 'maybe' ? 'alert-circle' : 'close-circle'} size={14} color={status === 'maybe' ? WARN : DANGER} />
                        <Text style={s.reqText}>{prog.ineligibilityReason}</Text>
                      </View>
                    </View>
                  )}

                  {/* Apply Now button — guided in-app application flow */}
                  {status !== 'ineligible' && (
                    <PressableScale haptic="medium"
                      accessibilityLabel={`Apply for ${prog.name}`}
                      style={[s.applyBtn, { backgroundColor: status === 'eligible' ? PRIMARY : WARN }]}
                      onPress={() => {
                        // Map eligibility-engine IDs to our 5 supported programs
                        const SUPPORTED_PROGRAMS: Record<string, string> = {
                          snap: 'SNAP', medicaid: 'Medicaid', ssi: 'SSI', liheap: 'LIHEAP', wic: 'WIC',
                        };
                        const programId = SUPPORTED_PROGRAMS[prog.id];
                        if (programId) {
                          router.push({ pathname: '/(tabs)/apply', params: { program: programId } });
                        } else {
                          // For programs without an in-app wizard, open the official site
                          Linking.openURL(prog.applicationUrl);
                        }
                      }}
                    >
                      <Text style={s.applyBtnText}>Apply Now</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </PressableScale>
                  )}
                </View>
              )}
            </PressableScale>
          );
        })}

        <Text style={s.disclaimer}>
          Results are informational estimates based on federal guidelines (FY 2024). Actual eligibility is determined by your state agency. Income and eligibility rules vary by state.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  shareBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  bannerCard: { marginHorizontal: 20, marginVertical: 16, backgroundColor: PRIMARY, borderRadius: 20, padding: 20, alignItems: 'center' },
  bannerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 },
  bannerAmount: { fontSize: 34, fontWeight: '800', color: '#FFFFFF' },
  bannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 6 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
  filterTabActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filterTabTextActive: { color: '#FFFFFF' },
  programCard: { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 12 },
  programHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  agencyIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  programName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  agencyName: { fontSize: 12, color: '#64748B', textTransform: 'capitalize' },
  statusValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999 },
  statusText: { fontSize: 12, fontWeight: '700' },
  valueText: { fontSize: 13, fontWeight: '700', color: SUCCESS },
  expandedContent: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: BORDER },
  descText: { fontSize: 13, color: '#94A3B8', lineHeight: 20, marginBottom: 10 },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  deadlineText: { fontSize: 12, color: '#64748B' },
  reqSection: { marginBottom: 12 },
  reqTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, textTransform: 'uppercase' },
  reqRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  reqText: { flex: 1, fontSize: 13, color: '#CBD5E1' },
  applyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, padding: 14, marginTop: 8 },
  applyBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  disclaimer: { fontSize: 11, color: '#475569', lineHeight: 16, marginTop: 8, textAlign: 'center', paddingHorizontal: 8 },
});
