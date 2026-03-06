import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');
const PRIMARY = '#1E40AF';

type ScanPhase = 'select' | 'scanning' | 'results';

const DOCUMENT_TYPES = [
  {
    id: 'id',
    label: 'Government ID',
    description: "Driver's license, passport, state ID",
    icon: 'card-outline',
    color: '#1E40AF',
    bg: 'rgba(30, 64, 175, 0.12)',
  },
  {
    id: 'pay_stub',
    label: 'Pay Stub',
    description: 'Recent paycheck, income verification',
    icon: 'wallet-outline',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.12)',
  },
  {
    id: 'tax_return',
    label: 'Tax Return',
    description: 'W-2, 1099, or full tax return',
    icon: 'document-outline',
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.12)',
  },
  {
    id: 'utility_bill',
    label: 'Utility Bill',
    description: 'Proof of address, energy bills',
    icon: 'flash-outline',
    color: '#7C3AED',
    bg: 'rgba(124, 58, 237, 0.12)',
  },
];

const MOCK_RESULTS = [
  { program: 'SNAP Benefits', status: 'eligible', reason: 'Income within threshold' },
  { program: 'Medicaid', status: 'eligible', reason: 'Household size qualifies' },
  { program: 'EITC', status: 'possible', reason: 'Verify filing status' },
  { program: 'CHIP', status: 'not_eligible', reason: 'No children under 19' },
];

export default function ScanScreen() {
  const [phase, setPhase] = useState<ScanPhase>('select');
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  const handleStartScan = () => {
    if (!selectedDoc) return;
    setPhase('scanning');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => setPhase('results'), 400);
      }
    }, 200);
  };

  const handleReset = () => {
    setPhase('select');
    setSelectedDoc(null);
    setScanProgress(0);
  };

  if (phase === 'results') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleReset} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan Results</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Success banner */}
          <View style={styles.successBanner}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={32} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.successTitle}>Document Analyzed</Text>
              <Text style={styles.successSubtitle}>Based on your {DOCUMENT_TYPES.find(d => d.id === selectedDoc)?.label}</Text>
            </View>
          </View>

          <Text style={styles.resultsLabel}>Eligibility Assessment</Text>

          {MOCK_RESULTS.map((result, i) => {
            const statusColor = result.status === 'eligible'
              ? '#059669'
              : result.status === 'possible'
              ? '#D97706'
              : '#B91C1C';
            const statusBg = result.status === 'eligible'
              ? 'rgba(5, 150, 105, 0.12)'
              : result.status === 'possible'
              ? 'rgba(217, 119, 6, 0.12)'
              : 'rgba(185, 28, 28, 0.12)';
            const statusLabel = result.status === 'eligible'
              ? 'Likely Eligible'
              : result.status === 'possible'
              ? 'May Qualify'
              : 'Not Eligible';

            return (
              <View key={i} style={styles.resultCard}>
                <View style={styles.resultLeft}>
                  <Text style={styles.resultProgramName}>{result.program}</Text>
                  <Text style={styles.resultReason}>{result.reason}</Text>
                </View>
                <View style={[styles.resultBadge, { backgroundColor: statusBg }]}>
                  <Text style={[styles.resultBadgeText, { color: statusColor }]}>{statusLabel}</Text>
                </View>
              </View>
            );
          })}

          {/* CTA */}
          <View style={styles.ctaSection}>
            <TouchableOpacity style={styles.primaryCta} activeOpacity={0.85}>
              <Ionicons name="document-text" size={18} color="#FFFFFF" />
              <Text style={styles.primaryCtaText}>Start Applications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryCta} onPress={handleReset} activeOpacity={0.85}>
              <Text style={styles.secondaryCtaText}>Scan Another Document</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (phase === 'scanning') {
    return (
      <View style={styles.scanningContainer}>
        {/* Mock camera view */}
        <View style={styles.mockCamera}>
          {/* Corner guides */}
          <View style={[styles.cornerGuide, { top: 80, left: 30, borderTopWidth: 3, borderLeftWidth: 3 }]} />
          <View style={[styles.cornerGuide, { top: 80, right: 30, borderTopWidth: 3, borderRightWidth: 3 }]} />
          <View style={[styles.cornerGuide, { bottom: 80, left: 30, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
          <View style={[styles.cornerGuide, { bottom: 80, right: 30, borderBottomWidth: 3, borderRightWidth: 3 }]} />

          {/* Scan line animation overlay */}
          <View style={styles.scanOverlay}>
            <ActivityIndicator color="#FFFFFF" size="large" />
            <Text style={styles.scanningText}>Analyzing document...</Text>
            <Text style={styles.scanningSubtext}>AI is reading your document</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${scanProgress}%` as any }]} />
          </View>
          <Text style={styles.progressText}>{scanProgress}% complete</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Scan Document</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Camera preview placeholder */}
        <View style={styles.cameraPreview}>
          <View style={styles.cameraInner}>
            <Ionicons name="camera" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.cameraPlaceholderText}>Camera preview</Text>
            <Text style={styles.cameraPlaceholderSubtext}>Position document within frame</Text>
          </View>
          {/* Corner guides */}
          <View style={[styles.cornerGuide, { top: 16, left: 16, borderTopWidth: 3, borderLeftWidth: 3 }]} />
          <View style={[styles.cornerGuide, { top: 16, right: 16, borderTopWidth: 3, borderRightWidth: 3 }]} />
          <View style={[styles.cornerGuide, { bottom: 16, left: 16, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
          <View style={[styles.cornerGuide, { bottom: 16, right: 16, borderBottomWidth: 3, borderRightWidth: 3 }]} />
        </View>

        <Text style={styles.instructionText}>
          Select the document type you want to scan
        </Text>

        {/* Document type selection */}
        <View style={styles.docGrid}>
          {DOCUMENT_TYPES.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              onPress={() => setSelectedDoc(doc.id)}
              style={[
                styles.docCard,
                selectedDoc === doc.id && { borderColor: doc.color, backgroundColor: doc.bg },
              ]}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.docIconContainer,
                  { backgroundColor: selectedDoc === doc.id ? doc.bg : '#3A3A3C' },
                ]}
              >
                <Ionicons
                  name={doc.icon as any}
                  size={24}
                  color={selectedDoc === doc.id ? doc.color : '#8E8E93'}
                />
              </View>
              <Text
                style={[
                  styles.docLabel,
                  selectedDoc === doc.id && { color: doc.color },
                ]}
              >
                {doc.label}
              </Text>
              <Text style={styles.docDescription} numberOfLines={2}>
                {doc.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Scan button */}
        <View style={{ paddingHorizontal: 20 }}>
          <TouchableOpacity
            onPress={handleStartScan}
            disabled={!selectedDoc}
            style={[styles.scanButton, !selectedDoc && styles.scanButtonDisabled]}
            activeOpacity={0.85}
          >
            <Ionicons name="scan" size={20} color={selectedDoc ? '#FFFFFF' : '#636366'} />
            <Text style={[styles.scanButtonText, !selectedDoc && styles.scanButtonTextDisabled]}>
              Scan Document
            </Text>
          </TouchableOpacity>

          <Text style={styles.privacyNote}>
            Documents are analyzed locally. Nothing is stored without your permission.
          </Text>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraPreview: {
    marginHorizontal: 20,
    height: 220,
    backgroundColor: '#000000',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraInner: {
    alignItems: 'center',
    gap: 8,
  },
  cameraPlaceholderText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  cameraPlaceholderSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.25)',
  },
  cornerGuide: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: PRIMARY,
  },
  instructionText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  docGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  docCard: {
    width: (width - 52) / 2,
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#38383A',
    gap: 10,
  },
  docIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  docDescription: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 18,
  },
  scanButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 17,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
  },
  scanButtonDisabled: {
    backgroundColor: '#2C2C2E',
    shadowOpacity: 0,
    elevation: 0,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  scanButtonTextDisabled: {
    color: '#636366',
  },
  privacyNote: {
    fontSize: 12,
    color: '#636366',
    textAlign: 'center',
    lineHeight: 18,
  },
  // Scanning phase
  scanningContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  mockCamera: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanOverlay: {
    alignItems: 'center',
    gap: 12,
  },
  scanningText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scanningSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  progressSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: '#1C1C1E',
    gap: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#38383A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: PRIMARY,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
  },
  // Results phase
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  successIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  resultsLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  resultCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  resultLeft: {
    flex: 1,
    marginRight: 12,
  },
  resultProgramName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultReason: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  resultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexShrink: 0,
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ctaSection: {
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  primaryCta: {
    backgroundColor: PRIMARY,
    paddingVertical: 17,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryCta: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#38383A',
  },
  secondaryCtaText: {
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '600',
  },
});
