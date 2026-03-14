import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth';

const PRIMARY = '#1E40AF';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming',
];

const INCOME_RANGES = [
  'Under $15,000',
  '$15,000 – $30,000',
  '$30,000 – $50,000',
  '$50,000 – $75,000',
  '$75,000 – $100,000',
  'Over $100,000',
];

export default function HouseholdScreen() {
  const { setHouseholdSize, setState } = useAuthStore();
  const [householdSize, setHouseholdSizeLocal] = useState(1);
  const [children, setChildren] = useState(0);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedIncome, setSelectedIncome] = useState<string | null>(null);
  const [showStateDropdown, setShowStateDropdown] = useState(false);

  const canContinue = selectedState && selectedIncome;

  const handleContinue = () => {
    if (!canContinue) return;
    setHouseholdSize(householdSize);
    setState(selectedState!);
    router.push('/onboarding/signup');
  };

  const adjustCount = (
    current: number,
    delta: number,
    setter: (n: number) => void,
    min = 0,
    max = 9
  ) => {
    const next = Math.max(min, Math.min(max, current + delta));
    setter(next);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tell us about your household</Text>
          <Text style={styles.subtitle}>
            This helps us find the right benefits for you.
          </Text>
        </View>

        {/* Household Size */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Household Size</Text>
          <Text style={styles.sectionHint}>Including yourself</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity accessibilityRole="button"
              onPress={() => adjustCount(householdSize, -1, setHouseholdSizeLocal, 1)}
              style={[styles.counterBtn, householdSize <= 1 && styles.counterBtnDisabled]}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={22} color={householdSize <= 1 ? '#636366' : '#FFFFFF'} />
            </TouchableOpacity>
            <View style={styles.counterValue}>
              <Text style={styles.counterText}>{householdSize === 9 ? '8+' : householdSize}</Text>
              <Text style={styles.counterSubtext}>
                {householdSize === 1 ? 'person' : 'people'}
              </Text>
            </View>
            <TouchableOpacity accessibilityRole="button"
              onPress={() => adjustCount(householdSize, 1, setHouseholdSizeLocal, 1, 9)}
              style={[styles.counterBtn, householdSize >= 9 && styles.counterBtnDisabled]}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={22} color={householdSize >= 9 ? '#636366' : '#FFFFFF'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Children */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Children Under 18</Text>
          <Text style={styles.sectionHint}>Affects SNAP, childcare, and school programs</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity accessibilityRole="button"
              onPress={() => adjustCount(children, -1, setChildren, 0)}
              style={[styles.counterBtn, children <= 0 && styles.counterBtnDisabled]}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={22} color={children <= 0 ? '#636366' : '#FFFFFF'} />
            </TouchableOpacity>
            <View style={styles.counterValue}>
              <Text style={styles.counterText}>{children}</Text>
              <Text style={styles.counterSubtext}>
                {children === 1 ? 'child' : 'children'}
              </Text>
            </View>
            <TouchableOpacity accessibilityRole="button"
              onPress={() => adjustCount(children, 1, setChildren, 0, 9)}
              style={[styles.counterBtn]}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* State */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>State of Residence</Text>
          <Text style={styles.sectionHint}>Benefits vary by state</Text>
          <TouchableOpacity accessibilityRole="button"
            onPress={() => setShowStateDropdown(!showStateDropdown)}
            style={[styles.dropdownTrigger, selectedState ? styles.dropdownTriggerActive : null]}
            activeOpacity={0.8}
          >
            <Text style={[styles.dropdownText, !selectedState && { color: '#636366' }]}>
              {selectedState || 'Select your state'}
            </Text>
            <Ionicons
              name={showStateDropdown ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#8E8E93"
            />
          </TouchableOpacity>

          {showStateDropdown && (
            <View style={styles.stateDropdown}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {US_STATES.map((s) => (
                  <TouchableOpacity accessibilityRole="button"
                    key={s}
                    onPress={() => {
                      setSelectedState(s);
                      setShowStateDropdown(false);
                    }}
                    style={[
                      styles.stateOption,
                      selectedState === s && styles.stateOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stateOptionText,
                        selectedState === s && styles.stateOptionTextSelected,
                      ]}
                    >
                      {s}
                    </Text>
                    {selectedState === s && (
                      <Ionicons name="checkmark" size={16} color={PRIMARY} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Income Range */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Annual Household Income</Text>
          <Text style={styles.sectionHint}>Approximate gross income for your household</Text>
          <View style={styles.incomeGrid}>
            {INCOME_RANGES.map((range) => (
              <TouchableOpacity accessibilityRole="button"
                key={range}
                onPress={() => setSelectedIncome(range)}
                style={[
                  styles.incomeChip,
                  selectedIncome === range && styles.incomeChipSelected,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.incomeChipText,
                    selectedIncome === range && styles.incomeChipTextSelected,
                  ]}
                >
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity accessibilityRole="button"
          onPress={handleContinue}
          disabled={!canContinue}
          style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
          activeOpacity={0.85}
        >
          <Text style={[styles.continueButtonText, !canContinue && styles.continueButtonTextDisabled]}>
            Continue
          </Text>
          <Ionicons name="arrow-forward" size={18} color={canContinue ? '#FFFFFF' : '#636366'} />
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 14,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    padding: 8,
    justifyContent: 'space-between',
  },
  counterBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#3A3A3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnDisabled: {
    opacity: 0.4,
  },
  counterValue: {
    alignItems: 'center',
    flex: 1,
  },
  counterText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  counterSubtext: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  dropdownTrigger: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#38383A',
  },
  dropdownTriggerActive: {
    borderColor: '#1E40AF',
  },
  dropdownText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  stateDropdown: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#38383A',
    overflow: 'hidden',
  },
  stateOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#38383A',
  },
  stateOptionSelected: {
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
  },
  stateOptionText: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  stateOptionTextSelected: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  incomeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  incomeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#2C2C2E',
    borderWidth: 1.5,
    borderColor: '#38383A',
  },
  incomeChipSelected: {
    backgroundColor: 'rgba(30, 64, 175, 0.15)',
    borderColor: '#1E40AF',
  },
  incomeChipText: {
    fontSize: 14,
    color: '#EBEBF5',
    fontWeight: '500',
  },
  incomeChipTextSelected: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#1E40AF',
    paddingVertical: 17,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#2C2C2E',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  continueButtonTextDisabled: {
    color: '#636366',
  },
});
