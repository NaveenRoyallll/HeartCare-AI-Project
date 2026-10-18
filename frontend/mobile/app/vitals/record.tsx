import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, fontSize, shadows } from '../../constants/theme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useHealthStore } from '../../store/healthStore';
import { VitalType } from '../../types/health';

type RecordableVitalType = Exclude<VitalType, 'cholesterol'>;

const vitalRecordSchema = z.object({
  type: z.enum(['bp', 'heart_rate', 'weight', 'glucose', 'spo2']),
  value: z.string().min(1, 'Primary value is required').regex(/^\d+(\.\d+)?$/, 'Must be a valid number'),
  secondaryValue: z.string().optional(),
  source: z.enum(['manual', 'bluetooth', 'device']),
  notes: z.string().optional(),
});

type VitalRecordFormData = z.infer<typeof vitalRecordSchema>;

const VITAL_TYPES: { type: RecordableVitalType; label: string; icon: keyof typeof Ionicons.glyphMap; unit: string }[] = [
  { type: 'bp', label: 'Blood Pressure', icon: 'heart-circle', unit: 'mmHg' },
  { type: 'heart_rate', label: 'Heart Rate', icon: 'pulse', unit: 'bpm' },
  { type: 'weight', label: 'Body Weight', icon: 'scale', unit: 'kg' },
  { type: 'glucose', label: 'Blood Glucose', icon: 'water', unit: 'mg/dL' },
  { type: 'spo2', label: 'Oxygen (SpO2)', icon: 'fitness', unit: '%' },
];

export default function RecordVitalScreen() {
  const router = useRouter();
  const { addMeasurement } = useHealthStore();
  const [selectedType, setSelectedType] = useState<RecordableVitalType>('bp');
  const [selectedSource, setSelectedSource] = useState<'manual' | 'bluetooth' | 'device'>('manual');

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VitalRecordFormData>({
    resolver: zodResolver(vitalRecordSchema),
    defaultValues: {
      type: 'bp',
      value: '',
      secondaryValue: '',
      source: 'manual',
      notes: '',
    },
  });

  const handleTypeSelect = (t: RecordableVitalType) => {
    setSelectedType(t);
    setValue('type', t);
  };

  const handleSourceSelect = (s: 'manual' | 'bluetooth' | 'device') => {
    setSelectedSource(s);
    setValue('source', s);
  };

  const onSubmit = async (data: VitalRecordFormData) => {
    const numVal = parseFloat(data.value);
    const numSecondary = data.secondaryValue ? parseFloat(data.secondaryValue) : undefined;

    let unit = 'mmHg';
    let status: 'normal' | 'warning' | 'danger' = 'normal';

    switch (data.type) {
      case 'bp':
        unit = 'mmHg';
        if (numVal >= 140 || (numSecondary && numSecondary >= 90)) {
          status = 'warning';
        } else if (numVal >= 180 || (numSecondary && numSecondary >= 120)) {
          status = 'danger';
        }
        break;
      case 'heart_rate':
        unit = 'bpm';
        if (numVal < 50 || numVal > 100) status = 'warning';
        break;
      case 'weight':
        unit = 'kg';
        break;
      case 'glucose':
        unit = 'mg/dL';
        if (numVal >= 126) status = 'warning';
        break;
      case 'spo2':
        unit = '%';
        if (numVal < 95) status = 'warning';
        if (numVal < 90) status = 'danger';
        break;
    }

    try {
      await addMeasurement({
        type: data.type,
        value: numVal,
        secondaryValue: numSecondary,
        unit,
        recordedAt: new Date().toISOString(),
        source: data.source,
        status,
        notes: data.notes,
      });
      Alert.alert('Vital Recorded', 'Your measurement has been saved successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Unable to save measurement', error instanceof Error ? error.message : 'Please check your connection and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={26} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Record Vital Sign</Text>
          </View>

          {/* Type Selector */}
          <Text style={styles.sectionLabel}>Select Vital Metric</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.typeScrollView}
          >
            {VITAL_TYPES.map((v) => {
              const isSelected = selectedType === v.type;
              return (
                <TouchableOpacity
                  key={v.type}
                  style={[styles.typeButton, isSelected && styles.typeButtonSelected]}
                  onPress={() => handleTypeSelect(v.type)}
                >
                  <Ionicons
                    name={v.icon}
                    size={22}
                    color={isSelected ? colors.textInverse : colors.primary}
                  />
                  <Text style={[styles.typeButtonText, isSelected && styles.typeButtonTextSelected]}>
                    {v.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Form */}
          <View style={styles.formContainer}>
            {selectedType === 'bp' ? (
              <View style={styles.dualInputRow}>
                <View style={styles.dualCol}>
                  <Controller
                    control={control}
                    name="value"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Systolic (Top)"
                        placeholder="120"
                        keyboardType="numeric"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        error={errors.value?.message}
                        helperText="mmHg"
                      />
                    )}
                  />
                </View>
                <View style={styles.dualCol}>
                  <Controller
                    control={control}
                    name="secondaryValue"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Diastolic (Bottom)"
                        placeholder="80"
                        keyboardType="numeric"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        error={errors.secondaryValue?.message}
                        helperText="mmHg"
                      />
                    )}
                  />
                </View>
              </View>
            ) : (
              <Controller
                control={control}
                name="value"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={`Measurement Value (${VITAL_TYPES.find((t) => t.type === selectedType)?.unit})`}
                    placeholder="Enter value"
                    keyboardType="numeric"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={errors.value?.message}
                  />
                )}
              />
            )}

            {/* Source Selector */}
            <Text style={styles.sectionLabel}>Measurement Source</Text>
            <View style={styles.sourceRow}>
              {(['manual', 'bluetooth', 'device'] as const).map((src) => (
                <TouchableOpacity
                  key={src}
                  style={[styles.sourcePill, selectedSource === src && styles.sourcePillSelected]}
                  onPress={() => handleSourceSelect(src)}
                >
                  <Text
                    style={[
                      styles.sourcePillText,
                      selectedSource === src && styles.sourcePillTextSelected,
                    ]}
                  >
                    {src === 'manual'
                      ? 'Manual Entry'
                      : src === 'bluetooth'
                      ? 'Bluetooth Monitor'
                      : 'Hospital Device'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Clinical Notes */}
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Clinical Notes / Context (Optional)"
                  placeholder="e.g. Taken 10 minutes post morning walk, seated resting"
                  multiline
                  numberOfLines={3}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />

            {/* Submit CTA */}
            <Button
              title="Save Measurement"
              onPress={handleSubmit(onSubmit)}
              size="lg"
              style={styles.submitBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  closeBtn: {
    marginRight: spacing.sm,
    padding: spacing.xs,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.primary,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  typeScrollView: {
    marginBottom: spacing.md,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: spacing.sm,
    ...shadows.sm,
  },
  typeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: fontSize.xs + 1,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  typeButtonTextSelected: {
    color: colors.textInverse,
  },
  formContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  dualInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dualCol: {
    flex: 1,
  },
  sourceRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  sourcePill: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sourcePillSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  sourcePillText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sourcePillTextSelected: {
    color: colors.textInverse,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
});
