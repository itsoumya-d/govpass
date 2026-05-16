import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '@/components/EmptyState';
import { SkeletonListItem } from '@/components/SkeletonLoader';
import { supabase } from '@/lib/supabase';
import { getUserApplications } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import PressableScale from '@/components/PressableScale';

const PRIMARY = '#1E40AF';

type AppStatus = 'pending' | 'approved' | 'denied' | 'in_review' | 'draft' | 'submitted';

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

const PROGRAM_CONFIG: Record<string, { agency: string; icon: string; iconColor: string; iconBg: string }> = {
  SNAP: { agency: 'USDA / State DHS', icon: 'fast-food-outline', iconColor: '#059669', iconBg: 'rgba(5,150,105,0.12)' },
  Medicaid: { agency: 'State Dept. of Health', icon: 'medkit-outline', iconColor: '#1E40AF', iconBg: 'rgba(30,64,175,0.12)' },
  LIHEAP: { agency: 'Dept. of Energy', icon: 'flash-outline', iconColor: '#7C3AED', iconBg: 'rgba(124,58,237,0.12)' },
  EITC: { agency: 'IRS', icon: 'cash-outline', iconColor: '#D97706', iconBg: 'rgba(217,119,6,0.12)' },
  WIC: { agency: 'USDA', icon: 'heart-outline', iconColor: '#B91C1C', iconBg: 'rgba(185,28,28,0.12)' },
};
const DEFAULT_PROGRAM = { agency: 'Government Agency', icon: 'document-text-outline', iconColor: '#6B7280', iconBg: 'rgba(107,114,128,0.12)' };

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface ApplicationRow {
  id: string;
  program: string;
  status?: string | null;
  submitted_at?: string | null;
  updated_at?: string | null;
}

function toAppItem(row: ApplicationRow): ApplicationItem {
  const cfg = PROGRAM_CONFIG[row.program] ?? DEFAULT_PROGRAM;
  const shortId = String(row.id).slice(-6).toUpperCase();
  return {
    id: row.id,
    program: row.program === 'SNAP' ? 'SNAP Benefits' : row.program,
    agency: cfg.agency,
    status: (row.status as AppStatus) ?? 'pending',
    submittedDate: formatDate(row.submitted_at ?? row.created_at),
    updatedDate: formatDate(row.updated_at ?? row.created_at),
    ref: `#${(row.program ?? 'APP').slice(0, 2).toUpperCase()}-${shortId}`,
    icon: cfg.icon,
    iconColor: cfg.iconColor,
    iconBg: cfg.iconBg,
  };
}

const STATUS_CONFIG: Record<AppStatus, { labelKey: string; color: string; bg: string; icon: string }> = {
  in_review: { labelKey: 'applications.statusInReview', color: '#1E40AF', bg: 'rgba(30,64,175,0.15)', icon: 'hourglass-outline' },
  approved: { labelKey: 'applications.statusApproved', color: '#059669', bg: 'rgba(5,150,105,0.15)', icon: 'checkmark-circle-outline' },
  pending: { labelKey: 'applications.statusPending', color: '#D97706', bg: 'rgba(217,119,6,0.15)', icon: 'time-outline' },
  submitted: { labelKey: 'applications.statusSubmitted', color: '#1E40AF', bg: 'rgba(30,64,175,0.15)', icon: 'paper-plane-outline' },
  denied: { labelKey: 'applications.statusDenied', color: '#B91C1C', bg: 'rgba(185,28,28,0.15)', icon: 'close-circle-outline' },
  draft: { labelKey: 'applications.statusDraft', color: '#636366', bg: 'rgba(99,99,102,0.15)', icon: 'create-outline' },
};

const FILTER_OPTIONS: { key: AppStatus | 'all'; labelKey: string }[] = [
  { key: 'all', labelKey: 'applications.filterAll' },
  { key: 'in_review', labelKey: 'applications.inReview' },
  { key: 'submitted', labelKey: 'applications.submitted' },
  { key: 'approved', labelKey: 'applications.approved' },
  { key: 'pending', labelKey: 'applications.pending' },
  { key: 'denied', labelKey: 'applications.denied' },
  { key: 'draft', labelKey: 'applications.draft' },
];

const PAGE_SIZE = 20;

export default function ApplicationsScreen() {
  const { t } = useTranslation();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<AppStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      const { data } = await getUserApplications(user.id, 0, PAGE_SIZE - 1);
      const items = data ?? [];
      setApplications(items.map(toAppItem));
      setHasMore(items.length === PAGE_SIZE);
      setLoading(false);
    })();
  }, []);

  const onRefresh = async () => {
    if (!userId) return;
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    const { data } = await getUserApplications(userId, 0, PAGE_SIZE - 1);
    const items = data ?? [];
    setApplications(items.map(toAppItem));
    setHasMore(items.length === PAGE_SIZE);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore || !userId) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const from = nextPage * PAGE_SIZE;
    const { data } = await getUserApplications(userId, from, from + PAGE_SIZE - 1);
    const items = data ?? [];
    setApplications(prev => [...prev, ...items.map(toAppItem)]);
    setPage(nextPage);
    setHasMore(items.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  const filtered = applications.filter((app) => {
    const matchesSearch =
      app.program.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.agency.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || app.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView className="flex-1 px-4 pt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonListItem key={i} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(80).duration(500).springify()} style={styles.header}>
        <Text style={styles.headerTitle}>{t('applications.title')}</Text>
        <Text style={styles.headerCount}>{t('applications.total', { count: applications.length })}</Text>
      </Animated.View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#636366" style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('applications.searchApplications')}
          placeholderTextColor="#636366"
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <PressableScale haptic="light" accessibilityRole="button" onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#636366" />
          </PressableScale>
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
          <PressableScale haptic="light"
            key={opt.key}
            onPress={() => setActiveFilter(opt.key)}
            style={[styles.filterChip, activeFilter === opt.key && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, activeFilter === opt.key && styles.filterChipTextActive]}>
              {t(opt.labelKey)}
            </Text>
          </PressableScale>
        ))}
      </ScrollView>

      {/* Applications list */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} colors={[PRIMARY]} />}
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title={t('applications.noApplications')}
            description={t('applications.noApplicationsDesc')}
            actionLabel="Check Eligibility"
            onAction={() => router.push('/(tabs)/eligibility')}
          />
        ) : (
          filtered.map((app, index) => {
            const statusCfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
            return (
              <Animated.View key={app.id} entering={FadeInDown.delay(index * 45).duration(260).springify()}>
                <PressableScale haptic="light" style={styles.appCard} onPress={() => router.push({ pathname: '/applications/new', params: { programId: app.id, programName: app.program } })}>
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
                        {t(statusCfg.labelKey)}
                      </Text>
                    </View>
                  </View>

                  {/* Divider */}
                  <View style={styles.cardDivider} />

                  {/* Bottom row */}
                  <View style={styles.appCardBottom}>
                    <View style={styles.appMeta}>
                      <Text style={styles.appMetaLabel}>{t('applications.reference')}</Text>
                      <Text style={styles.appMetaValue}>{app.ref}</Text>
                    </View>
                    <View style={styles.appMeta}>
                      <Text style={styles.appMetaLabel}>{t('applications.submitted')}</Text>
                      <Text style={styles.appMetaValue}>{app.submittedDate}</Text>
                    </View>
                    <View style={styles.appMeta}>
                      <Text style={styles.appMetaLabel}>{t('applications.updatedLabel')}</Text>
                      <Text style={styles.appMetaValue}>{app.updatedDate}</Text>
                    </View>
                  </View>

                  {/* View details arrow */}
                  <View style={styles.viewDetails}>
                    <Text style={styles.viewDetailsText}>{t('applications.viewDetails')}</Text>
                    <Ionicons name="chevron-forward" size={14} color={PRIMARY} />
                  </View>
                </PressableScale>
              </Animated.View>
            );
          })
        )}
        {hasMore && filtered.length > 0 && (
          <PressableScale
            haptic="light"
            accessibilityRole="button"
            style={{ alignItems: 'center', paddingVertical: 16 }}
            onPress={loadMore}
            disabled={loadingMore}
          >
            {loadingMore
              ? <ActivityIndicator color={PRIMARY} />
              : <Text style={{ color: PRIMARY, fontSize: 14, fontWeight: '600' }}>Load More</Text>}
          </PressableScale>
        )}
      </ScrollView>

      {/* FAB */}
      <PressableScale haptic="medium" style={styles.fab} onPress={() => router.push('/(tabs)/apply')}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>{t('applications.newApplication')}</Text>
      </PressableScale>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1C1E' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  headerCount: { fontSize: 14, color: '#8E8E93' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', marginHorizontal: 20, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, gap: 10, marginBottom: 12 },
  searchIcon: { flexShrink: 0 },
  searchInput: { flex: 1, fontSize: 16, color: '#FFFFFF' },
  filterScroll: { marginBottom: 16 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#2C2C2E', borderWidth: 1, borderColor: '#38383A' },
  filterChipActive: { backgroundColor: 'rgba(30,64,175,0.15)', borderColor: PRIMARY },
  filterChipText: { fontSize: 13, fontWeight: '500', color: '#8E8E93' },
  filterChipTextActive: { color: '#60A5FA', fontWeight: '600' },
  appCard: { backgroundColor: '#2C2C2E', borderRadius: 14, padding: 16, marginBottom: 12 },
  appCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  appIconContainer: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  appCardInfo: { flex: 1 },
  appProgramName: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  appAgency: { fontSize: 12, color: '#8E8E93' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 4, flexShrink: 0 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardDivider: { height: 1, backgroundColor: '#38383A', marginBottom: 12 },
  appCardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  appMeta: { gap: 2 },
  appMetaLabel: { fontSize: 11, color: '#636366', fontWeight: '500' },
  appMetaValue: { fontSize: 12, color: '#EBEBF5', fontWeight: '500' },
  viewDetails: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  viewDetailsText: { fontSize: 13, color: PRIMARY, fontWeight: '600' },
  fab: { position: 'absolute', bottom: 24, right: 20, backgroundColor: PRIMARY, borderRadius: 28, paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 10 },
  fabText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
