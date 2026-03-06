import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#1E40AF';

type AppStatus = 'pending' | 'approved' | 'denied' | 'in_review' | 'draft';

interface ApplicationItem {
  id: string;
  program: string;
  agency: string;
  status: AppStatus;
  submittedDate: string;
  updatedDate: string;
  ref: string;
  icon: string;
  iconColor: string;
  iconBg: string;
}

const MOCK_APPLICATIONS: ApplicationItem[] = [
  {
    id: '1',
    program: 'SNAP Benefits',
    agency: 'USDA / State DHS',
    status: 'in_review',
    submittedDate: 'Mar 1, 2026',
    updatedDate: 'Mar 4, 2026',
    ref: '#SN-2026-4421',
    icon: 'fast-food-outline',
    iconColor: '#059669',
    iconBg: 'rgba(5, 150, 105, 0.12)',
  },
  {
    id: '2',
    program: 'Medicaid',
    agency: 'State Dept. of Health',
    status: 'approved',
    submittedDate: 'Feb 15, 2026',
    updatedDate: 'Mar 2, 2026',
    ref: '#MC-2026-8823',
    icon: 'medkit-outline',
    iconColor: '#1E40AF',
    iconBg: 'rgba(30, 64, 175, 0.12)',
  },
  {
    id: '3',
    program: 'LIHEAP Energy Assistance',
    agency: 'Dept. of Energy',
    status: 'pending',
    submittedDate: 'Mar 3, 2026',
    updatedDate: 'Mar 3, 2026',
    ref: '#LH-2026-2201',
    icon: 'flash-outline',
    iconColor: '#7C3AED',
    iconBg: 'rgba(124, 58, 237, 0.12)',
  },
  {
    id: '4',
    program: 'Earned Income Tax Credit',
    agency: 'IRS',
    status: 'draft',
    submittedDate: '-',
    updatedDate: 'Feb 28, 2026',
    ref: '#EITC-DRAFT',
    icon: 'cash-outline',
    iconColor: '#D97706',
    iconBg: 'rgba(217, 119, 6, 0.12)',
  },
  {
    id: '5',
    program: 'WIC Program',
    agency: 'USDA',
    status: 'denied',
    submittedDate: 'Jan 10, 2026',
    updatedDate: 'Feb 1, 2026',
    ref: '#WC-2026-0992',
    icon: 'heart-outline',
    iconColor: '#B91C1C',
    iconBg: 'rgba(185, 28, 28, 0.12)',
  },
];

const STATUS_CONFIG: Record<AppStatus, { label: string; color: string; bg: string; icon: string }> = {
  in_review: { label: 'In Review', color: '#1E40AF', bg: 'rgba(30, 64, 175, 0.15)', icon: 'hourglass-outline' },
  approved: { label: 'Approved', color: '#059669', bg: 'rgba(5, 150, 105, 0.15)', icon: 'checkmark-circle-outline' },
  pending: { label: 'Pending', color: '#D97706', bg: 'rgba(217, 119, 6, 0.15)', icon: 'time-outline' },
  denied: { label: 'Denied', color: '#B91C1C', bg: 'rgba(185, 28, 28, 0.15)', icon: 'close-circle-outline' },
  draft: { label: 'Draft', color: '#636366', bg: 'rgba(99, 99, 102, 0.15)', icon: 'create-outline' },
};

const FILTER_OPTIONS: { key: AppStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in_review', label: 'In Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'pending', label: 'Pending' },
  { key: 'denied', label: 'Denied' },
  { key: 'draft', label: 'Draft' },
];

export default function ApplicationsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<AppStatus | 'all'>('all');

  const filtered = MOCK_APPLICATIONS.filter((app) => {
    const matchesSearch =
      app.program.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.agency.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || app.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Applications</Text>
        <Text style={styles.headerCount}>{MOCK_APPLICATIONS.length} total</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#636366" style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search applications..."
          placeholderTextColor="#636366"
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#636366" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTER_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            onPress={() => setActiveFilter(opt.key)}
            style={[
              styles.filterChip,
              activeFilter === opt.key && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === opt.key && styles.filterChipTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Applications list */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#3A3A3C" />
            <Text style={styles.emptyStateText}>No applications found</Text>
            <Text style={styles.emptyStateSubtext}>Try adjusting your search or filter</Text>
          </View>
        ) : (
          filtered.map((app) => {
            const statusCfg = STATUS_CONFIG[app.status];
            return (
              <TouchableOpacity key={app.id} style={styles.appCard} activeOpacity={0.8}>
                {/* Top row */}
                <View style={styles.appCardTop}>
                  <View style={[styles.appIconContainer, { backgroundColor: app.iconBg }]}>
                    <Ionicons name={app.icon as any} size={22} color={app.iconColor} />
                  </View>
                  <View style={styles.appCardInfo}>
                    <Text style={styles.appProgramName}>{app.program}</Text>
                    <Text style={styles.appAgency}>{app.agency}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                    <Ionicons name={statusCfg.icon as any} size={12} color={statusCfg.color} />
                    <Text style={[styles.statusText, { color: statusCfg.color }]}>
                      {statusCfg.label}
                    </Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.cardDivider} />

                {/* Bottom row */}
                <View style={styles.appCardBottom}>
                  <View style={styles.appMeta}>
                    <Text style={styles.appMetaLabel}>Reference</Text>
                    <Text style={styles.appMetaValue}>{app.ref}</Text>
                  </View>
                  <View style={styles.appMeta}>
                    <Text style={styles.appMetaLabel}>Submitted</Text>
                    <Text style={styles.appMetaValue}>{app.submittedDate}</Text>
                  </View>
                  <View style={styles.appMeta}>
                    <Text style={styles.appMetaLabel}>Updated</Text>
                    <Text style={styles.appMetaValue}>{app.updatedDate}</Text>
                  </View>
                </View>

                {/* View details arrow */}
                <View style={styles.viewDetails}>
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={14} color={PRIMARY} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>New Application</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    marginBottom: 12,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#38383A',
  },
  filterChipActive: {
    backgroundColor: 'rgba(30, 64, 175, 0.15)',
    borderColor: PRIMARY,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  filterChipTextActive: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3A3A3C',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#3A3A3C',
  },
  appCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  appCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  appIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  appCardInfo: {
    flex: 1,
  },
  appProgramName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  appAgency: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#38383A',
    marginBottom: 12,
  },
  appCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  appMeta: {
    gap: 2,
  },
  appMetaLabel: {
    fontSize: 11,
    color: '#636366',
    fontWeight: '500',
  },
  appMetaValue: {
    fontSize: 12,
    color: '#EBEBF5',
    fontWeight: '500',
  },
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: PRIMARY,
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
