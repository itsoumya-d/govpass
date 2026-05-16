import { useEffect, useState, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import PressableScale from '@/components/PressableScale';
import GradientCard from '@/components/GradientCard';
import Animated, {
  FadeInDown,
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { SkeletonFeed, SkeletonKPI } from '@/components/SkeletonLoader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { getEligiblePrograms, getUserApplications, getNotifications } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import Toast from '@/components/Toast';

interface Program {
  id: string;
  name: string;
  annual_value?: number | null;
  max_benefit_annual?: number | null;
  icon?: string | null;
  iconColor?: string | null;
  status?: string | null;
  eligibility_status?: string | null;
  color?: string | null;
  bg_color?: string | null;
  completion_pct?: number | null;
  deadline_days?: number | null;
}

interface Application {
  id: string;
  status: string;
  program_id?: string | null;
}

interface NotificationRow {
  id: string;
  is_read: boolean;
}

const PRIMARY = '#1E40AF';
const SECONDARY = '#059669';

const STATUS_CONFIG: Record<string, { labelKey: string; color: string; bg: string }> = {
  in_review: { labelKey: 'home.statusInReview', color: '#1E40AF', bg: 'rgba(30, 64, 175, 0.15)' },
  approved: { labelKey: 'home.statusApproved', color: '#059669', bg: 'rgba(5, 150, 105, 0.15)' },
  pending: { labelKey: 'home.statusPending', color: '#D97706', bg: 'rgba(217, 119, 6, 0.15)' },
  denied: { labelKey: 'home.statusDenied', color: '#B91C1C', bg: 'rgba(185, 28, 28, 0.15)' },
};

const ELIGIBILITY_CONFIG: Record<string, { labelKey: string; color: string }> = {
  eligible: { labelKey: 'home.eligLikely', color: '#059669' },
  possibly_eligible: { labelKey: 'home.eligMayQualify', color: '#D97706' },
  not_eligible: { labelKey: 'home.eligNotEligible', color: '#B91C1C' },
};

function getDeadlineUrgency(daysRemaining: number): { color: string; bg: string; label: string } {
  if (daysRemaining <= 7) {
    return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', label: `${daysRemaining}d left` };
  } else if (daysRemaining <= 30) {
    return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', label: `${daysRemaining}d left` };
  }
  return { color: '#22C55E', bg: 'rgba(34, 197, 94, 0.15)', label: `${daysRemaining}d left` };
}

// Animated counter that counts up from 0 to target with ease-out cubic
function AnimatedCounter({ target, prefix = '$', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    const STEPS = 60;
    const DURATION_MS = 1400;
    let step = 0;
    const handle = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - step / STEPS, 3);
      setDisplayed(Math.round(target * eased));
      if (step >= STEPS) {
        setDisplayed(target);
        clearInterval(handle);
      }
    }, DURATION_MS / STEPS);
    return () => clearInterval(handle);
  }, [target]);

  return <>{prefix}{displayed.toLocaleString()}{suffix}</>;
}

// Total annual benefits value card
function TotalBenefitsCard({ programs }: { programs: Program[] }) {
  const totalAnnual = programs.length > 0
    ? programs.reduce((sum, p) => sum + (p.annual_value ?? p.max_benefit_annual ?? 0), 0)
    : 0;
  const monthly = Math.round(totalAnnual / 12);
  const eligibleCount = programs.length;

  return (
    <Animated.View entering={FadeInDown.duration(450).delay(200)} style={styles.totalBenefitsCard}>
      <View style={styles.totalBenefitsHeader}>
        <View style={styles.totalBenefitsIconWrap}>
          <Ionicons name="cash" size={20} color="#059669" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.totalBenefitsLabel}>ESTIMATED ANNUAL BENEFITS</Text>
          <Text style={styles.totalBenefitsHint}>Based on {eligibleCount} eligible programs</Text>
        </View>
      </View>
      <Text style={styles.totalBenefitsValue}>
        {totalAnnual > 0 ? <AnimatedCounter target={totalAnnual} prefix="$" suffix="/yr" /> : 'Varies by program'}
      </Text>
      <View style={styles.totalBenefitsDivider} />
      <View style={styles.totalBenefitsStats}>
        <View style={styles.totalBenefitsStat}>
          <Text style={styles.totalBenefitsStatValue}>
            {monthly > 0 ? <AnimatedCounter target={monthly} prefix="$" suffix="" /> : '—'}
          </Text>
          <Text style={styles.totalBenefitsStatLabel}>Est. / month</Text>
        </View>
        <View style={styles.totalBenefitsStatSep} />
        <View style={styles.totalBenefitsStat}>
          <Text style={[styles.totalBenefitsStatValue, { color: '#1E40AF' }]}>{eligibleCount}</Text>
          <Text style={styles.totalBenefitsStatLabel}>Programs</Text>
        </View>
        <View style={styles.totalBenefitsStatSep} />
        <View style={styles.totalBenefitsStat}>
          <Ionicons name="trending-up" size={18} color="#059669" />
          <Text style={styles.totalBenefitsStatLabel}>Unclaimed</Text>
        </View>
      </View>
    </Animated.View>
  );
}

function AnimatedProgressBar({ progress, color }: { progress: number; color: string }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.min(Math.max(progress, 0), 100), {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animStyle = useAnimatedStyle(() => ({
    width: `${width.value}%` as any,
  }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { backgroundColor: color }, animStyle]} />
    </View>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'warning' }>({ visible: false, message: '', type: 'error' });

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      getEligiblePrograms(),
      getUserApplications(user.id),
      getNotifications(user.id),
    ])
      .then(([{ data: programsData }, { data: appsData }, { data: notifs }]) => {
        if (programsData) setPrograms(programsData);
        if (appsData) setApplications(appsData);
        if (notifs) setHasUnreadAlerts((notifs as NotificationRow[]).some((n) => !n.is_read));
      })
      .catch(() => setToast({ visible: true, message: t('common.loadError', { defaultValue: 'Failed to load benefits data' }), type: 'error' }))
      .finally(() => setLoading(false));
  }, [user]);

  const activeApplications = applications.filter(a => a.status === 'in_review' || a.status === 'pending');
  const approvedCount = applications.filter(a => a.status === 'approved').length;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1C1E' }} edges={['top']}>
        <SkeletonKPI />
        <SkeletonFeed count={4} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              Gov<Text style={{ color: PRIMARY }}>Pass</Text>
            </Text>
            <Text style={styles.headerSubtitle}>{t('home.benefitsNavigator')}</Text>
          </View>
          <PressableScale haptic="light" accessibilityRole="button" accessibilityLabel="View alerts" style={styles.notifBtn} onPress={() => router.push('/(tabs)/alerts')}>
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            <View style={styles.notifDot} />
          </PressableScale>
        </View>

        {/* New Benefits Available Banner */}
        {hasUnreadAlerts && (
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.alertBanner}>
            <View style={styles.alertIconWrap}>
              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>{t('home.newBenefitsAvailable')}</Text>
              <Text style={styles.alertSub}>{t('home.programsMatchProfile')}</Text>
            </View>
            <PressableScale haptic="light" accessibilityRole="button" accessibilityLabel="View new benefits" style={styles.alertAction} onPress={() => router.push('/(tabs)/eligibility')}>
              <Text style={styles.alertActionText}>{t('home.view')}</Text>
            </PressableScale>
          </Animated.View>
        )}

        {/* Benefits Summary Card */}
        <Animated.View entering={FadeInDown.duration(450).delay(150)}>
          <GradientCard color="#1E40AF" style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>{t('home.youMayQualifyFor')}</Text>
              <Text style={styles.summaryNumber}>{programs.length} program{programs.length !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="shield-checkmark" size={28} color={PRIMARY} />
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{programs.length}</Text>
              <Text style={styles.statLabel}>{t('home.estPrograms')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{activeApplications.length}</Text>
              <Text style={styles.statLabel}>{t('home.activeApplications')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#059669' }]}>{approvedCount}</Text>
              <Text style={styles.statLabel}>{t('home.approved')}</Text>
            </View>
          </View>
          </GradientCard>
        </Animated.View>

        {/* Total Estimated Annual Benefits */}
        <TotalBenefitsCard programs={programs} />

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
        </View>
        <View style={styles.quickActionsRow}>
          <PressableScale haptic="light"
            accessibilityRole="button"
            accessibilityLabel="Scan document"
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/scan')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(30, 64, 175, 0.15)' }]}>
              <Ionicons name="camera" size={22} color={PRIMARY} />
            </View>
            <Text style={styles.quickActionText}>{t('home.scanDoc')}</Text>
          </PressableScale>

          <PressableScale haptic="light" accessibilityRole="button" accessibilityLabel="Browse benefits" style={styles.quickAction} onPress={() => router.push('/(tabs)/eligibility')}>
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(5, 150, 105, 0.15)' }]}>
              <Ionicons name="search" size={22} color={SECONDARY} />
            </View>
            <Text style={styles.quickActionText}>{t('home.browseBenefits')}</Text>
          </PressableScale>

          <PressableScale haptic="light"
            accessibilityRole="button"
            accessibilityLabel="View my applications"
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/applications')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(124, 58, 237, 0.15)' }]}>
              <Ionicons name="document-text" size={22} color="#7C3AED" />
            </View>
            <Text style={styles.quickActionText}>{t('home.myApplications')}</Text>
          </PressableScale>
        </View>

        {/* Benefits You May Qualify For */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.benefitsYouMayQualifyFor')}</Text>
          <PressableScale haptic="light" accessibilityRole="button" accessibilityLabel="See all programs" onPress={() => router.push('/(tabs)/eligibility')}>
            <Text style={styles.seeAllText}>{t('home.seeAll')}</Text>
          </PressableScale>
        </View>

        {programs.length === 0 ? (
          <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
            <Text style={{ color: '#8E8E93', fontSize: 14, textAlign: 'center' }}>
              {t('home.noPrograms')}
            </Text>
          </View>
        ) : (
          programs.slice(0, 4).map((program, index) => {
            const eligibilityStatus = (program.eligibility_status ?? 'eligible').toLowerCase();
            const eligibility = ELIGIBILITY_CONFIG[eligibilityStatus] ?? ELIGIBILITY_CONFIG['eligible'];
            const programColor = program.color ?? PRIMARY;
            const programBgColor = program.bg_color ?? 'rgba(30, 64, 175, 0.12)';
            const completionPct = program.completion_pct ?? (30 + (index * 17) % 50);
            const daysRemaining = program.deadline_days ?? (25 + index * 12);
            const urgency = getDeadlineUrgency(daysRemaining);

            return (
              <Animated.View
                key={program.id}
                entering={FadeInDown.duration(400).delay(200 + index * 80)}
              >
                <PressableScale haptic="light"
                  accessibilityRole="button"
                  accessibilityLabel={`Apply for ${program.name}`}
                  style={styles.benefitCard}
                  onPress={() => router.push('/(tabs)/eligibility')}
                >
                  <View style={[styles.benefitIconContainer, { backgroundColor: programBgColor }]}>
                    <Ionicons name={(program.icon ?? 'shield-checkmark-outline') as any} size={24} color={programColor} />
                  </View>

                  <View style={styles.benefitInfo}>
                    <View style={styles.benefitTopRow}>
                      <Text style={styles.benefitName}>{program.name}</Text>
                      <View style={styles.benefitRightCol}>
                        {/* Deadline countdown badge */}
                        <View style={[styles.deadlineBadge, { backgroundColor: urgency.bg }]}>
                          <Ionicons name="time-outline" size={11} color={urgency.color} />
                          <Text style={[styles.deadlineText, { color: urgency.color }]}>
                            {urgency.label}
                          </Text>
                        </View>
                        <View style={styles.benefitAmountContainer}>
                          <Text style={[styles.benefitAmount, { color: programColor }]}>
                            {program.benefit_amount ?? ''}
                          </Text>
                          <Text style={styles.benefitFrequency}>{program.benefit_frequency ?? ''}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.benefitFullName} numberOfLines={1}>
                      {program.full_name ?? program.description ?? ''}
                    </Text>

                    {/* Animated completion progress bar */}
                    <View style={styles.completionRow}>
                      <Text style={styles.completionLabel}>{t('home.applicationCompletion')}</Text>
                      <Text style={[styles.completionPct, { color: programColor }]}>{completionPct}%</Text>
                    </View>
                    <AnimatedProgressBar progress={completionPct} color={programColor} />

                    <View style={[styles.benefitBottom, { marginTop: 8 }]}>
                      <View
                        style={[
                          styles.eligibilityBadge,
                          { backgroundColor: eligibilityStatus === 'eligible'
                              ? 'rgba(5, 150, 105, 0.15)'
                              : 'rgba(217, 119, 6, 0.15)' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.eligibilityText,
                            { color: eligibility.color },
                          ]}
                        >
                          {t(eligibility.labelKey)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#636366" />
                    </View>
                  </View>
                </PressableScale>
              </Animated.View>
            );
          })
        )}

        {/* Active Applications */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.activeApps')}</Text>
          <PressableScale haptic="light" accessibilityRole="button" accessibilityLabel="See all applications" onPress={() => router.push('/(tabs)/applications')}>
            <Text style={styles.seeAllText}>{t('home.seeAll')}</Text>
          </PressableScale>
        </View>

        {applications.length === 0 ? (
          <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
            <Text style={{ color: '#8E8E93', fontSize: 14, textAlign: 'center' }}>
              {t('home.noApps')}
            </Text>
          </View>
        ) : (
          applications.slice(0, 5).map((app, index) => {
            const statusKey = app.status ?? 'pending';
            const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG['pending'];
            return (
              <Animated.View
                key={app.id}
                entering={FadeInDown.duration(400).delay(300 + index * 70)}
              >
                <PressableScale haptic="light" accessibilityRole="button" accessibilityLabel={`View ${app.program_name ?? app.program ?? 'program'} application`} style={styles.applicationCard} onPress={() => router.push('/(tabs)/applications')}>
                  <View style={styles.appCardLeft}>
                    <Text style={styles.appProgramName}>{app.program_name ?? app.program ?? 'Program'}</Text>
                    <Text style={styles.appRef}>{app.reference_number ?? app.ref ?? ''}</Text>
                    <Text style={styles.appDate}>Submitted {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : app.date ?? ''}</Text>
                  </View>
                  <View
                    style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}
                  >
                    <Text style={[styles.statusText, { color: statusCfg.color }]}>
                      {t(statusCfg.labelKey)}
                    </Text>
                  </View>
                </PressableScale>
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(t => ({ ...t, visible: false }))}
      />
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B91C1C',
    borderWidth: 1.5,
    borderColor: '#1C1C1E',
  },
  // New Benefits Banner
  alertBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(30, 64, 175, 0.2)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  alertIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  alertSub: {
    fontSize: 12,
    color: '#A5B4FC',
  },
  alertAction: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9,
  },
  alertActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(30, 64, 175, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#38383A',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#38383A',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  seeAllText: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: '600',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 12,
    color: '#EBEBF5',
    fontWeight: '600',
    textAlign: 'center',
  },
  benefitCard: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2E',
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    alignItems: 'flex-start',
    gap: 14,
  },
  benefitIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  benefitInfo: {
    flex: 1,
  },
  benefitTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  benefitRightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  // Deadline countdown badge
  deadlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  deadlineText: {
    fontSize: 11,
    fontWeight: '700',
  },
  benefitName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  benefitAmountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  benefitAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  benefitFrequency: {
    fontSize: 12,
    color: '#8E8E93',
  },
  benefitFullName: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
  },
  // Animated progress bar
  completionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  completionLabel: {
    fontSize: 11,
    color: '#636366',
  },
  completionPct: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#3A3A3C',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 2,
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
  },
  benefitBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eligibilityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eligibilityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  applicationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  appCardLeft: {
    flex: 1,
    gap: 3,
  },
  appProgramName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  appRef: {
    fontSize: 12,
    color: '#636366',
    fontFamily: 'monospace',
  },
  appDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Total Benefits Card
  totalBenefitsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.35)',
    padding: 18,
  },
  totalBenefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  totalBenefitsIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalBenefitsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.6,
  },
  totalBenefitsHint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 1,
  },
  totalBenefitsValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  totalBenefitsDivider: {
    height: 1,
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    marginBottom: 12,
  },
  totalBenefitsStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalBenefitsStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  totalBenefitsStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  totalBenefitsStatLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },
  totalBenefitsStatSep: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
  },
});
