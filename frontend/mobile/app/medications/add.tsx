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
import { MedicationFrequency, MedicationTiming } from '../../types/medication';

const addMedicationSchema = z.object({
  name: z.string().min(2, 'Medication name is required'),
  genericName: z.string().optional(),
  dosage: z.string().min(1, 'Dosage is required (e.g. 40 mg, 1 tablet)'),
  prescribedBy: z.string().optional(),
  instructions: z.string().optional(),
  totalPills: z.string().optional(),
});

type AddMedicationFormData = z.infer<typeof addMedicationSchema>;

const FREQUENCIES: { value: MedicationFrequency; label: string }[] = [
  { value: 'once_daily', label: 'Once Daily' },
  { value: 'twice_daily', label: 'Twice Daily' },
  { value: 'thrice_daily', label: '3x Daily' },
  { value: 'as_needed', label: 'As Needed (SOS)' },
];

const TIMINGS: { value: MedicationTiming; label: string }[] = [
  { value: 'after_food', label: 'After Food' },
  { value: 'before_food', label: 'Before Food' },
  { value: 'with_food', label: 'With Meal' },
  { value: 'bedtime', label: 'At Bedtime' },
];

export default function AddMedicationScreen() {
  const router = useRouter();
  const { addMedication } = useHealthStore();

  const [frequency, setFrequency] = useState<MedicationFrequency>('once_daily');
  const [timing, setTiming] = useState<MedicationTiming>('after_food');
  const [scheduledTime, setScheduledTime] = useState<string>('08:00 AM');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddMedicationFormData>({
    resolver: zodResolver(addMedicationSchema),
    defaultValues: {
      name: '',
      genericName: '',
      dosage: '',
      prescribedBy: '',
      instructions: '',
      totalPills: '30',
    },
  });

  const onSubmit = async (data: AddMedicationFormData) => {
    const pillCount = data.totalPills ? parseInt(data.totalPills, 10) : 30;

    try {
      await addMedication({
        name: data.name,
        genericName: data.genericName || undefined,
        dosage: data.dosage,
        frequency,
        timing,
        times: [scheduledTime],
        startDate: new Date().toISOString().split('T')[0],
        prescribedBy: data.prescribedBy || undefined,
        instructions: data.instructions || undefined,
        remainingPills: pillCount,
        totalPills: pillCount,
        isActive: true,
      });
    } catch (error) {
      Alert.alert('Unable to add medication', error instanceof Error ? error.message : 'Please check your connection.');
      return;
    }

    Alert.alert('Medication Added', `${data.name} added to your active prescription regimen.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
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
            <Text style={styles.title}>Add Medication</Text>
          </View>

          <View style={styles.formCard}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Medication Name *"
                  placeholder="e.g. Telmisartan, Atorvastatin, Metoprolol"
                  leftIcon="medkit-outline"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="dosage"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Dosage / Strength *"
                  placeholder="e.g. 40 mg, 5 mg, 1 tablet"
                  leftIcon="flask-outline"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.dosage?.message}
                />
              )}
            />

            {/* Frequency Selector */}
            <Text style={styles.fieldLabel}>Frequency</Text>
            <View style={styles.pillRow}>
              {FREQUENCIES.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  style={[styles.pill, frequency === f.value && styles.pillActive]}
                  onPress={() => setFrequency(f.value)}
                >
                  <Text style={[styles.pillText, frequency === f.value && styles.pillTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Meal Timing Selector */}
            <Text style={styles.fieldLabel}>Timing with Meals</Text>
            <View style={styles.pillRow}>
              {TIMINGS.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.pill, timing === t.value && styles.pillActive]}
                  onPress={() => setTiming(t.value)}
                >
                  <Text style={[styles.pillText, timing === t.value && styles.pillTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Scheduled Time of Day */}
            <Text style={styles.fieldLabel}>Reminder Time</Text>
            <View style={styles.pillRow}>
              {['08:00 AM', '01:30 PM', '08:00 PM', '10:00 PM'].map((timeStr) => (
                <TouchableOpacity
                  key={timeStr}
                  style={[styles.pill, scheduledTime === timeStr && styles.pillActive]}
                  onPress={() => setScheduledTime(timeStr)}
                >
                  <Text style={[styles.pillText, scheduledTime === timeStr && styles.pillTextActive]}>
                    {timeStr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Controller
              control={control}
              name="prescribedBy"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Prescribed By (Doctor / Cardiologist)"
                  placeholder="e.g. Dr. Rajesh Patel"
                  leftIcon="person-outline"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />

            <Controller
              control={control}
              name="totalPills"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Package Pill Count (for refill alerts)"
                  placeholder="30"
                  keyboardType="numeric"
                  leftIcon="cube-outline"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.totalPills?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="instructions"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Instructions / Cautions"
                  placeholder="e.g. Drink full glass of water, do not skip dose"
                  multiline
                  numberOfLines={2}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />

            <Button
              title="Save Medication"
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
    paddingBottom: spacing.xxl,
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
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  pill: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.textInverse,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
});
