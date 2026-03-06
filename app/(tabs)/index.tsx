import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const PRIMARY = '#1E40AF';
const SECONDARY = '#059669';

const MOCK_BENEFITS = [
  {
    id: '1',
    name: 'SNAP',
    fullName: 'Supplemental Nutrition Assistance Program',
    icon: 'fast-food-outline',
    amount: '$291',
    frequency: '/month',
    status: 'eligible',
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.12)',
  },
  {
    id: '2',
    name: 'Medicaid',
    fullName: 'Health Coverage for Low-Income Adults',
    icon: 'medkit-outline',
    amount: 'Free',
    frequency: 'coverage',
    status: 'eligible',
    color: '#1E40AF',
    bgColor: 'rgba(30, 64, 175, 0.12)',
  },
  {
    id: '3',
    name: 'EITC',
    fullName: 'Earned Income Tax Credit',
    icon: 'cash-outline',
    amount: '$3,584',
    frequency: '/year',
    status: 'possibly_eligible',
    color: '#D97706',
    bgColor: 'rgba(217, 119, 6, 0.12)',
  },
  {
    id: '4',
    name: 'LIHEAP',
    fullName: 'Energy Assistance Program',
    icon: 'flash-outline',
    amount: '$500',
    frequency: '/year',
    status: 'possibly_eligible',
    color: '#7C3AED',
    bgColor: 'rgba(124, 58, 237, 0.12)',
  },
];

const MOCK_APPLICATIONS = [
  {
    id: '1',
    program: 'SNAP Benefits',
    status: 'in_review',
    date: 'Mar 1, 2026',
    ref: '#SN-2026-4421',
  },
  {
    id: '2',
    program: 'Medicaid',
    status: 'approved',
    date: 'Feb 15, 2026',
    ref: '#MC-2026-8823',
  },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  in_review: { label: 'In Review', color: '#1E40AF', bg: 'rgba(30, 64, 175, 0.15)' },
  approved: { label: 'Approved', color: '#059669', bg: 'rgba(5, 150, 105, 0.15)' },
  pending: { label: 'Pending', color: '#D97706', bg: 'rgba(217, 119, 6, 0.15)' },
  denied: { label: 'Denied', color: '#B91C1C', bg: 'rgba(185, 28, 28, 0.15)' },
};

const ELIGIBILITY_CONFIG: Record<string, { label: string; color: string }> = {
  eligible: { label: 'Likely Eligible', color: '#059669' },
  possibly_eligible: { label: 'May Qualify', color: '#D97706' },
  not_eligible: { label: 'Not Eligible', color: '#B91C1C' },
};

export default function HomeScreen() {
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
            <Text style={styles.headerSubtitle}>Your benefits navigator</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* Benefits Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>You may qualify for</Text>
              <Text style={styles.summaryNumber}>4 programs</Text>
            </View>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="shield-checkmark" size={28} color={PRIMARY} />
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>$4,375</Text>
              <Text style={styles.statLabel}>Est. annual value</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>2</Text>
              <Text style={styles.statLabel}>Active applications</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#059669' }]}>1</Text>
              <Text style={styles.statLabel}>Approved</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/scan')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(30, 64, 175, 0.15)' }]}>
              <Ionicons name="camera" size={22} color={PRIMARY} />
            </View>
            <Text style={styles.quickActionText}>Scan Doc</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} activeOpacity={0.8}>
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(5, 150, 105, 0.15)' }]}>
              <Ionicons name="search" size={22} color={SECONDARY} />
            </View>
            <Text style={styles.quickActionText}>Browse Benefits</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/applications')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(124, 58, 237, 0.15)' }]}>
              <Ionicons name="document-text" size={22} color="#7C3AED" />
            </View>
            <Text style={styles.quickActionText}>My Applications</Text>
          </TouchableOpacity>
        </View>

        {/* Benefits You May Qualify For */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Benefits You May Qualify For</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        {MOCK_BENEFITS.map((benefit) => {
          const eligibility = ELIGIBILITY_CONFIG[benefit.status];
          return (
            <TouchableOpacity
              key={benefit.id}
              style={styles.benefitCard}
              activeOpacity={0.8}
            >
              <View style={[styles.benefitIconContainer, { backgroundColor: benefit.bgColor }]}>
                <Ionicons name={benefit.icon as any} size={24} color={benefit.color} />
              </View>

              <View style={styles.benefitInfo}>
                <View style={styles.benefitTopRow}>
                  <Text style={styles.benefitName}>{benefit.name}</Text>
                  <View style={styles.benefitAmountContainer}>
                    <Text style={[styles.benefitAmount, { color: benefit.color }]}>
                      {benefit.amount}
                    </Text>
                    <Text style={styles.benefitFrequency}>{benefit.frequency}</Text>
                  </View>
                </View>
                <Text style={styles.benefitFullName} numberOfLines={1}>
                  {benefit.fullName}
                </Text>
                <View style={styles.benefitBottom}>
                  <View
                    style={[
                      styles.eligibilityBadge,
                      { backgroundColor: benefit.status === 'eligible'
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
                      {eligibility.label}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#636366" />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Active Applications */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Applications</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/applications')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        {MOCK_APPLICATIONS.map((app) => {
          const statusCfg = STATUS_CONFIG[app.status];
          return (
            <TouchableOpacity key={app.id} style={styles.applicationCard} activeOpacity={0.8}>
              <View style={styles.appCardLeft}>
                <Text style={styles.appProgramName}>{app.program}</Text>
                <Text style={styles.appRef}>{app.ref}</Text>
                <Text style={styles.appDate}>Submitted {app.date}</Text>
              </View>
              <View
                style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}
              >
                <Text style={[styles.statusText, { color: statusCfg.color }]}>
                  {statusCfg.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  summaryCard: {
    marginHorizontal: 20,
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.3)',
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
    alignItems: 'center',
    marginBottom: 2,
  },
  benefitName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
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
});
