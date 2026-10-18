import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, fontSize, shadows } from '../../constants/theme';

interface SymptomOption {
  id: string;
  label: string;
  description: string;
  isEmergencyRedFlag: boolean;
}

const SYMPTOM_OPTIONS: SymptomOption[] = [
  {
    id: 's_chest_pain',
    label: 'Chest Pain, Pressure, Tightness or Squeezing',
    description: 'Feels like an elephant sitting on chest, lasting more than a few minutes or coming and going.',
    isEmergencyRedFlag: true,
  },
  {
    id: 's_radiating_pain',
    label: 'Pain Spreading to Arm, Back, Neck, or Jaw',
    description: 'Discomfort spreading down one or both arms (especially left arm) or upward to the jaw.',
    isEmergencyRedFlag: true,
  },
  {
    id: 's_shortness_breath',
    label: 'Severe Shortness of Breath / Breathing Difficulty',
    description: 'Gasping for air, inability to speak full sentences, with or without chest pain.',
    isEmergencyRedFlag: true,
  },
  {
    id: 's_cold_sweat',
    label: 'Sudden Unexplained Cold Sweat (Diaphoresis)',
    description: 'Profuse cold clammy sweating not caused by room heat or heavy physical exertion.',
    isEmergencyRedFlag: true,
  },
  {
    id: 's_dizziness',
    label: 'Severe Dizziness, Lightheadedness or Near Fainting',
    description: 'Feeling about to pass out, loss of vision clarity, sudden imbalance.',
    isEmergencyRedFlag: true,
  },
  {
    id: 's_nausea',
    label: 'Sudden Intense Nausea / Vomiting / Indigestion',
    description: 'Accompanied by upper abdominal or retrosternal tightness.',
    isEmergencyRedFlag: true,
  },
  {
    id: 's_mild_palpitations',
    label: 'Mild occasional fluttering without chest pain',
    description: 'Heart feeling like it skipped a beat during rest.',
    isEmergencyRedFlag: false,
  },
];

export default function SymptomsScreen() {
  const router = useRouter();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const hasRedFlagSymptom = selectedSymptoms.some((id) => {
    const s = SYMPTOM_OPTIONS.find((opt) => opt.id === id);
    return s?.isEmergencyRedFlag;
  });

  const handleCall112 = () => {
    Alert.alert(
      'Call 112 now?',
      'The app cannot confirm that emergency services answered.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 112',
          style: 'destructive',
          onPress: () => Linking.openURL('tel:112').catch(() => {
            Alert.alert('Emergency Call', 'Please dial 112 directly on your mobile keypad.');
          }),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Emergency Symptom Checker</Text>
        </View>

        {/* ALWAYS VISIBLE TOP EMERGENCY BAR */}
        <TouchableOpacity
          style={styles.topCall112}
          onPress={handleCall112}
          activeOpacity={0.85}
        >
          <Ionicons name="call" size={22} color={colors.textInverse} />
          <Text style={styles.topCallText}>TAP TO CALL 112 IMMEDIATELY</Text>
        </TouchableOpacity>

        {/* Dynamic Immediate Guidance Box */}
        {hasRedFlagSymptom && (
          <View style={styles.criticalAlertCard}>
            <View style={styles.criticalHeaderRow}>
              <Ionicons name="alert-circle" size={28} color={colors.danger} />
              <Text style={styles.criticalTitle}>POTENTIAL CARDIAC EMERGENCY</Text>
            </View>
            <Text style={styles.criticalBody}>
              You have selected one or more symptoms associated with an acute coronary event or heart attack.
            </Text>
            <Text style={styles.criticalUrgentAction}>
              DO NOT WAIT. DO NOT DELAY. DO NOT DRIVE. CALL 112 NOW.
            </Text>
            <TouchableOpacity
              style={styles.actionCallBtn}
              onPress={handleCall112}
              activeOpacity={0.85}
            >
              <Ionicons name="call" size={24} color={colors.textInverse} />
              <Text style={styles.actionCallBtnText}>DIAL 112 NOW</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.instructionsText}>
          Select any symptoms that you are currently experiencing:
        </Text>

        {/* Symptoms Checklist */}
        <View style={styles.listContainer}>
          {SYMPTOM_OPTIONS.map((symptom) => {
            const isChecked = selectedSymptoms.includes(symptom.id);
            return (
              <TouchableOpacity
                key={symptom.id}
                style={[
                  styles.symptomCard,
                  isChecked && styles.symptomCardSelected,
                  isChecked && symptom.isEmergencyRedFlag && styles.symptomCardRedFlag,
                ]}
                onPress={() => toggleSymptom(symptom.id)}
                activeOpacity={0.7}
              >
                <View style={styles.checkbox}>
                  {isChecked ? (
                    <Ionicons
                      name="checkbox"
                      size={24}
                      color={symptom.isEmergencyRedFlag ? colors.danger : colors.secondary}
                    />
                  ) : (
                    <Ionicons name="square-outline" size={24} color={colors.textTertiary} />
                  )}
                </View>
                <View style={styles.symptomTextCol}>
                  <Text
                    style={[
                      styles.symptomLabel,
                      isChecked && styles.symptomLabelSelected,
                    ]}
                  >
                    {symptom.label}
                  </Text>
                  <Text style={styles.symptomDesc}>{symptom.description}</Text>
                  {symptom.isEmergencyRedFlag && (
                    <View style={styles.redFlagPill}>
                      <Text style={styles.redFlagText}>CRITICAL EMERGENCY WARNING SIGN</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Safety Disclaimer */}
        <View style={styles.safetyBox}>
          <Ionicons name="shield-outline" size={20} color={colors.danger} />
          <Text style={styles.safetyText}>
            Medical safety note: Heart attacks can present atypically, especially in women, elderly individuals, and diabetics. If you feel unwell or suspect an emergency, call 112 immediately without second-guessing.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backButton: {
    marginRight: spacing.sm,
    padding: spacing.xs,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.primary,
  },
  topCall112: {
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  topCallText: {
    color: colors.textInverse,
    fontWeight: '900',
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
    letterSpacing: 0.5,
  },
  criticalAlertCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderWidth: 2,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  criticalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  criticalTitle: {
    fontSize: fontSize.md,
    fontWeight: '900',
    color: colors.danger,
    marginLeft: spacing.xs,
  },
  criticalBody: {
    fontSize: fontSize.xs + 1,
    color: '#7F1D1D',
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  criticalUrgentAction: {
    fontSize: fontSize.sm,
    fontWeight: '900',
    color: '#991B1B',
    marginBottom: spacing.md,
  },
  actionCallBtn: {
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  actionCallBtnText: {
    color: colors.textInverse,
    fontWeight: '900',
    fontSize: fontSize.md,
    marginLeft: spacing.xs,
  },
  instructionsText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  listContainer: {
    marginBottom: spacing.md,
  },
  symptomCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs + 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  symptomCardSelected: {
    borderColor: colors.secondary,
    backgroundColor: '#F0FDFA',
  },
  symptomCardRedFlag: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  checkbox: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  symptomTextCol: {
    flex: 1,
  },
  symptomLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  symptomLabelSelected: {
    color: colors.primary,
  },
  symptomDesc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  redFlagPill: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  redFlagText: {
    color: colors.danger,
    fontSize: fontSize.xs - 2,
    fontWeight: '800',
  },
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF1F2',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  safetyText: {
    fontSize: fontSize.xs,
    color: '#9F1239',
    marginLeft: spacing.xs,
    flex: 1,
    lineHeight: 16,
  },
});
