import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { analyzeDocument, type DocumentAnalysis } from '@/lib/api';

const DOCUMENT_TYPES = [
  { id: 'id', label: 'Government ID', icon: 'card-outline', color: '#1E40AF' },
  { id: 'pay_stub', label: 'Pay Stub', icon: 'wallet-outline', color: '#059669' },
  { id: 'tax_return', label: 'Tax Return', icon: 'document-outline', color: '#D97706' },
  { id: 'utility_bill', label: 'Utility Bill', icon: 'flash-outline', color: '#7C3AED' },
  { id: 'birth_certificate', label: 'Birth Certificate', icon: 'ribbon-outline', color: '#DC2626' },
  { id: 'other', label: 'Other Document', icon: 'document-text-outline', color: '#6B7280' },
] as const;
type DocTypeId = typeof DOCUMENT_TYPES[number]['id'];

type OcrStep = 0 | 1 | 2 | 3; // 0=idle, 1=capturing, 2=extracting, 3=matching

const OCR_STEPS = [
  { label: 'Capturing', icon: 'camera-outline', color: '#1E40AF' },
  { label: 'Extracting Text', icon: 'text-outline', color: '#D97706' },
  { label: 'Matching Benefits', icon: 'search-outline', color: '#059669' },
];

function StepIndicator({ currentStep }: { currentStep: OcrStep }) {
  // currentStep 1,2,3 maps to step indices 0,1,2
  return (
    <View style={si.container}>
      {OCR_STEPS.map((step, idx) => {
        const stepNum = (idx + 1) as OcrStep;
        const isActive = currentStep === stepNum;
        const isDone = currentStep > stepNum;
        const color = step.color;
        return (
          <View key={idx} style={si.stepRow}>
            {idx > 0 && (
              <View style={[si.connector, isDone && { backgroundColor: OCR_STEPS[idx - 1].color }]} />
            )}
            <View style={[
              si.dot,
              isActive && { backgroundColor: color, borderColor: color },
              isDone && { backgroundColor: color, borderColor: color },
            ]}>
              {isDone ? (
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              ) : isActive ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={si.emptyDot} />
              )}
            </View>
            <Text style={[
              si.label,
              isActive && { color: color, fontWeight: '700' },
              isDone && { color: '#64748B' },
            ]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedDoc, setSelectedDoc] = useState<DocTypeId>('id');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ocrStep, setOcrStep] = useState<OcrStep>(0);
  const [result, setResult] = useState<DocumentAnalysis | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const stepTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clear step timers on unmount
  useEffect(() => {
    return () => { stepTimers.current.forEach(t => clearTimeout(t)); };
  }, []);

  const runOcrSteps = () => {
    setOcrStep(1); // Capturing
    const t1 = setTimeout(() => setOcrStep(2), 1000); // Extracting Text
    const t2 = setTimeout(() => setOcrStep(3), 2200); // Matching Benefits
    stepTimers.current = [t1, t2];
  };

  const handleScan = async () => {
    if (!cameraRef.current || isAnalyzing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAnalyzing(true);
    setResult(null);
    setOcrStep(0);
    runOcrSteps();

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, base64: true });
      if (!photo?.base64) throw new Error('No image captured');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const analysis = await analyzeDocument(user.id, photo.base64, selectedDoc);
      setResult(analysis);
      setOcrStep(0);
      Animated.spring(sheetAnim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setOcrStep(0);
      Alert.alert('Scan Failed', 'Ensure the document is flat, well-lit, and within the frame.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!permission) return <SafeAreaView style={s.safe}><ActivityIndicator color="#1E40AF" style={{ flex: 1 }} /></SafeAreaView>;

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Ionicons name="camera-outline" size={52} color="#1E40AF" />
          <Text style={s.permTitle}>Camera Required</Text>
          <Text style={s.permSub}>GovPass needs camera access to scan and analyze your documents.</Text>
          <TouchableOpacity accessibilityRole="button" style={s.permBtn} onPress={requestPermission}>
            <Text style={s.permBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const docType = DOCUMENT_TYPES.find(d => d.id === selectedDoc)!;

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.header}>
          <Text style={s.title}>Scan Document</Text>
          <View style={[s.badge, { backgroundColor: docType.color + '30', borderColor: docType.color + '60' }]}>
            <Ionicons name={docType.icon as any} size={14} color={docType.color} />
            <Text style={[s.badgeText, { color: docType.color }]}>{docType.label}</Text>
          </View>
        </View>

        {/* Doc type selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.typeRow}>
          {DOCUMENT_TYPES.map(doc => (
            <TouchableOpacity accessibilityRole="button"
              key={doc.id}
              onPress={() => setSelectedDoc(doc.id)}
              style={[s.typeChip, selectedDoc === doc.id && { backgroundColor: doc.color + '25', borderColor: doc.color }]}
            >
              <Ionicons name={doc.icon as any} size={16} color={selectedDoc === doc.id ? doc.color : '#94A3B8'} />
              <Text style={[s.typeChipText, selectedDoc === doc.id && { color: doc.color }]}>{doc.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Document frame */}
        <View style={s.vfArea}>
          <View style={s.docFrame}>
            <View style={s.cTL} /><View style={s.cTR} /><View style={s.cBL} /><View style={s.cBR} />
            {isAnalyzing && (
              <View style={s.analyzingBox}>
                <ActivityIndicator color="#1E40AF" size="large" />
                <Text style={s.analyzingText}>
                  {ocrStep === 1 ? 'Capturing...' : ocrStep === 2 ? 'Extracting Text...' : 'Matching Benefits...'}
                </Text>
                <Text style={s.analyzingSubText}>AI Reading Document</Text>
              </View>
            )}
          </View>
          <Text style={s.hint}>Align document edges with the frame</Text>

          {/* OCR Step Indicator — shown while analyzing */}
          {isAnalyzing && ocrStep > 0 && (
            <View style={s.stepIndicatorWrapper}>
              <StepIndicator currentStep={ocrStep} />
            </View>
          )}
        </View>

        {/* Capture */}
        <View style={s.bottom}>
          <TouchableOpacity accessibilityRole="button" style={s.capBtn} onPress={handleScan} disabled={isAnalyzing}>
            {isAnalyzing
              ? <ActivityIndicator color="#FFFFFF" size="large" />
              : <><Ionicons name="scan" size={24} color="#FFFFFF" /><Text style={s.capText}>Scan Document</Text></>
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Results */}
      {result && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity accessibilityRole="button" style={{ flex: 1 }} onPress={() => { setResult(null); sheetAnim.setValue(0); }} activeOpacity={1} />
          <Animated.View style={[s.sheet, { transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }) }] }]}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Document Scanned</Text>
            <Text style={s.sheetSub}>{result.summary}</Text>

            <View style={s.dataGrid}>
              {result.extractedData.fullName && <DataRow label="Name" value={result.extractedData.fullName} />}
              {result.extractedData.dateOfBirth && <DataRow label="Date of Birth" value={result.extractedData.dateOfBirth} />}
              {result.extractedData.address && <DataRow label="Address" value={result.extractedData.address} />}
              {result.extractedData.income && <DataRow label="Annual Income" value={`$${result.extractedData.income.toLocaleString()}`} />}
              {result.extractedData.documentNumber && <DataRow label="Document #" value={result.extractedData.documentNumber} />}
            </View>

            {result.eligibilityHints.length > 0 && (
              <View style={s.hintsBox}>
                <Text style={s.hintsTitle}>Potential Benefits</Text>
                {result.eligibilityHints.map((hint, i) => (
                  <View key={i} style={s.hintRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    <Text style={s.hintText}>{hint}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity accessibilityRole="button" style={s.ctaBtn}>
              <Ionicons name="search" size={18} color="#FFFFFF" />
              <Text style={s.ctaBtnText}>Check Full Eligibility</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.dataRow}>
      <Text style={s.dataLabel}>{label}</Text>
      <Text style={s.dataValue}>{value}</Text>
    </View>
  );
}

// Step indicator styles
const si = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connector: {
    width: 28,
    height: 2,
    backgroundColor: '#1E293B',
    marginHorizontal: 2,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#1E293B',
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E293B',
  },
  label: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
    marginRight: 4,
  },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  typeRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  typeChipText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  vfArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  docFrame: { width: '85%', aspectRatio: 1.6, borderRadius: 8, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  cTL: { position: 'absolute', top: 0, left: 0, width: 32, height: 32, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#1E40AF', borderTopLeftRadius: 4 },
  cTR: { position: 'absolute', top: 0, right: 0, width: 32, height: 32, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#1E40AF', borderTopRightRadius: 4 },
  cBL: { position: 'absolute', bottom: 0, left: 0, width: 32, height: 32, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#1E40AF', borderBottomLeftRadius: 4 },
  cBR: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#1E40AF', borderBottomRightRadius: 4 },
  analyzingBox: { backgroundColor: 'rgba(0,0,0,0.85)', padding: 24, borderRadius: 16, alignItems: 'center', gap: 10 },
  analyzingText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  analyzingSubText: { color: '#94A3B8', fontSize: 12 },
  hint: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  // Step indicator wrapper
  stepIndicatorWrapper: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  bottom: { paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20 },
  capBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#1E40AF', paddingVertical: 16, borderRadius: 16, shadowColor: '#1E40AF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  capText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  sheet: { backgroundColor: '#0F172A', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: Platform.OS === 'ios' ? 44 : 28, borderTopWidth: 1, borderTopColor: 'rgba(30,64,175,0.4)' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#1E293B', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  sheetSub: { color: '#94A3B8', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  dataGrid: { backgroundColor: '#1E293B', borderRadius: 12, padding: 12, marginBottom: 16, gap: 8 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dataLabel: { color: '#64748B', fontSize: 13 },
  dataValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  hintsBox: { backgroundColor: 'rgba(5,150,105,0.1)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(5,150,105,0.3)', marginBottom: 16 },
  hintsTitle: { color: '#059669', fontSize: 14, fontWeight: '700', marginBottom: 10 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  hintText: { color: '#CBD5E1', fontSize: 13, flex: 1 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1E40AF', paddingVertical: 14, borderRadius: 14 },
  ctaBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  permTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginTop: 20, marginBottom: 10, textAlign: 'center' },
  permSub: { color: '#94A3B8', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  permBtn: { backgroundColor: '#1E40AF', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 12 },
  permBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
