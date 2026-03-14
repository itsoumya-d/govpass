import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  checkEligibility, type UserProfile, type EligibleProgram,
} from '../../lib/eligibility-engine';
import { shareMultipleResults } from '../../lib/share';

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

  // Accept serialized profile from navigation params (set by eligibility.tsx if navigating here)
  const params = useLocalSearchParams<{ profile?: string }>();

  const programs = useMemo<EligibleProgram[]>(() => {
    if (params.profile) {
      try {
        const profile = JSON.parse(params.profile) as UserProfile;
        return checkEligibility(profile);
      } catch {
        // fall through to defaults
      }
    }
    // Default demo profile: single adult, $20k income, CA renter
    const defaultProfile: UserProfile = {
      householdSize: 1, annualIncome: 20000, state: 'CA', age: 30,
      hasChildren: false, childrenUnder5: false, childrenUnder18: 0,
      pregnant: false, disabled: false, veteran: false, elderly: false,
      citizen: true, legalResident: false, unemployed: false,
      receivingSSI: false, receivingTANF: false,
      housingType: 'renting', monthlyRent: 1200,
      hasHealthInsurance: false, selfEmployed: false,
    };
    return checkEligibility(defaultProfile);
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
        <TouchableOpacity accessibilityRole="button" onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Eligibility Results</Text>
        <TouchableOpacity
          accessibilityRole="button"
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
                benefit: p.uiStatus !== 'ineligible' ? p.estimatedBenefit : undefined,
              }))
            )
          }
        >
          <Ionicons name="share-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
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
          <TouchableOpacity
            accessibilityRole="button"
            key={f.id}
            onPress={() => setFilter(f.id)}
            style={[s.filterTab, filter === f.id && s.filterTabActive]}
          >
            <Text style={[s.filterTabText, filter === f.id && s.filterTabTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {filtered.map(prog => {
          const status = prog.uiStatus;
          const cfg = STATUS_CONFIG[status];
          const isExpanded = expanded === prog.id;
          const catIcon = (CATEGORY_ICONS[prog.category] ?? 'star') as never;

          return (
            <TouchableOpacity
              accessibilityRole="button"
              key={prog.id}
              style={s.programCard}
              onPress={() => setExpanded(isExpanded ? null : prog.id)}
              activeOpacity={0.8}
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

                  {/* Apply Now button — opens real USAGov / federal application URL */}
                  {status !== 'ineligible' && (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Apply for ${prog.name} on government website`}
                      style={[s.applyBtn, { backgroundColor: status === 'eligible' ? PRIMARY : WARN }]}
                      onPress={() => Linking.openURL(prog.applicationUrl)}
                    >
                      <Text style={s.applyBtnText}>Apply Now</Text>
                      <Ionicons name="open-outline" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
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
