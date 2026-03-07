import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const PRIMARY = '#1E40AF';
const BG = '#0F172A';
const CARD = '#1E293B';
const BORDER = '#334155';

type EligibilityStatus = 'eligible' | 'maybe' | 'ineligible';
type FilterTab = 'all' | EligibilityStatus;

const STATUS_CONFIG = {
  eligible: { label: 'Likely Eligible', color: '#10B981', bg: '#10B98120', icon: 'checkmark-circle' as const },
  maybe: { label: 'May Qualify', color: '#F59E0B', bg: '#F59E0B20', icon: 'help-circle' as const },
  ineligible: { label: 'Not Eligible', color: '#EF4444', bg: '#EF444420', icon: 'close-circle' as const },
};

const PROGRAMS = [
  {
    id: '1',
    name: 'SNAP Food Assistance',
    agency: 'USDA',
    agencyIcon: 'leaf',
    status: 'eligible' as EligibilityStatus,
    annualValue: 3456,
    metReqs: ['Income below 130% FPL', 'US Citizen', 'State resident'],
    unmetReqs: [],
    description: 'Monthly food assistance benefits loaded onto an EBT card.',
  },
  {
    id: '2',
    name: 'Medicaid Health Coverage',
    agency: 'CMS',
    agencyIcon: 'medical',
    status: 'eligible' as EligibilityStatus,
    annualValue: 8400,
    metReqs: ['Income qualifies', 'Family size verified', 'State enrolled'],
    unmetReqs: [],
    description: 'Comprehensive health coverage for eligible individuals.',
  },
  {
    id: '3',
    name: 'LIHEAP Energy Assistance',
    agency: 'HHS',
    agencyIcon: 'flash',
    status: 'maybe' as EligibilityStatus,
    annualValue: 900,
    metReqs: ['Income level', 'Household size'],
    unmetReqs: ['Energy burden verification needed'],
    description: 'Help paying home energy bills for low-income households.',
  },
  {
    id: '4',
    name: 'Section 8 Housing Voucher',
    agency: 'HUD',
    agencyIcon: 'home',
    status: 'maybe' as EligibilityStatus,
    annualValue: 9600,
    metReqs: ['Income below 50% AMI'],
    unmetReqs: ['Local waiting list varies', 'Background check required'],
    description: 'Rental assistance voucher for private market housing.',
  },
  {
    id: '5',
    name: 'Pell Grant (Education)',
    agency: 'Dept of Ed',
    agencyIcon: 'school',
    status: 'eligible' as EligibilityStatus,
    annualValue: 7395,
    metReqs: ['Enrolled in college', 'Financial need demonstrated', 'FAFSA submitted'],
    unmetReqs: [],
    description: 'Federal grant for undergraduate students with financial need.',
  },
  {
    id: '6',
    name: 'Veterans Benefits (VA)',
    agency: 'VA',
    agencyIcon: 'medal',
    status: 'ineligible' as EligibilityStatus,
    annualValue: 0,
    metReqs: [],
    unmetReqs: ['Veteran status required', 'Service record not found'],
    description: 'Benefits for military veterans and their families.',
  },
];

const FILTERS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'eligible', label: 'Eligible' },
  { id: 'maybe', label: 'May Qualify' },
  { id: 'ineligible', label: 'Not Eligible' },
];

export default function EligibilityResultsScreen() {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = filter === 'all' ? PROGRAMS : PROGRAMS.filter(p => p.status === filter);
  const totalAnnual = PROGRAMS.filter(p => p.status === 'eligible').reduce((sum, p) => sum + p.annualValue, 0);
  const eligibleCount = PROGRAMS.filter(p => p.status === 'eligible').length;
  const maybeCount = PROGRAMS.filter(p => p.status === 'maybe').length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Eligibility Results</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Total Benefit Banner */}
      <View style={s.bannerCard}>
        <Text style={s.bannerLabel}>Estimated Annual Benefit</Text>
        <Text style={s.bannerAmount}>${totalAnnual.toLocaleString()}/year</Text>
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
          const cfg = STATUS_CONFIG[prog.status];
          const isExpanded = expanded === prog.id;
          return (
            <TouchableOpacity
              key={prog.id}
              style={s.programCard}
              onPress={() => setExpanded(isExpanded ? null : prog.id)}
              activeOpacity={0.8}
            >
              {/* Program Header */}
              <View style={s.programHeader}>
                <View style={[s.agencyIcon, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={prog.agencyIcon as any} size={20} color={cfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.programName}>{prog.name}</Text>
                  <Text style={s.agencyName}>{prog.agency}</Text>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#64748B"
                />
              </View>

              {/* Status & Value */}
              <View style={s.statusValueRow}>
                <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={cfg.icon} size={13} color={cfg.color} />
                  <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
                {prog.annualValue > 0 && (
                  <Text style={s.valueText}>${prog.annualValue.toLocaleString()}/year</Text>
                )}
              </View>

              {/* Expanded Details */}
              {isExpanded && (
                <View style={s.expandedContent}>
                  <Text style={s.descText}>{prog.description}</Text>

                  {prog.metReqs.length > 0 && (
                    <View style={s.reqSection}>
                      <Text style={s.reqTitle}>Requirements Met</Text>
                      {prog.metReqs.map((req, i) => (
                        <View key={i} style={s.reqRow}>
                          <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                          <Text style={s.reqText}>{req}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {prog.unmetReqs.length > 0 && (
                    <View style={s.reqSection}>
                      <Text style={[s.reqTitle, { color: '#F59E0B' }]}>May Need</Text>
                      {prog.unmetReqs.map((req, i) => (
                        <View key={i} style={s.reqRow}>
                          <Ionicons name="alert-circle" size={14} color="#F59E0B" />
                          <Text style={s.reqText}>{req}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {prog.status !== 'ineligible' && (
                    <TouchableOpacity
                      style={[s.applyBtn, { backgroundColor: PRIMARY }]}
                      onPress={() => router.push({ pathname: '/applications/new', params: { programId: prog.id, programName: prog.name } })}
                    >
                      <Text style={s.applyBtnText}>Apply Now</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
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
  agencyName: { fontSize: 12, color: '#64748B' },
  statusValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999 },
  statusText: { fontSize: 12, fontWeight: '700' },
  valueText: { fontSize: 15, fontWeight: '700', color: '#10B981' },
  expandedContent: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: BORDER },
  descText: { fontSize: 13, color: '#94A3B8', lineHeight: 20, marginBottom: 12 },
  reqSection: { marginBottom: 12 },
  reqTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, textTransform: 'uppercase' },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  reqText: { fontSize: 13, color: '#CBD5E1' },
  applyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, padding: 14, marginTop: 8 },
  applyBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
