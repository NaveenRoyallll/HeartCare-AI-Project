import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, fontSize, shadows } from '../../constants/theme';
import { useHealthStore } from '../../store/healthStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function MedicationsScreen() {
  const router = useRouter();
  const { medications, toggleMedicationActive, deleteMedication } = useHealthStore();

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Remove Medication',
      `Are you sure you want to remove ${name} from your schedule?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteMedication(id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.title}>Prescription Medications</Text>
            <Text style={styles.subtitle}>Daily cardiovascular pharmacotherapy schedule</Text>
          </View>
        </View>

        {/* Add Medication Action */}
        <Button
          title="Add New Medication"
          icon="add-circle-outline"
          onPress={() => router.push('/medications/add')}
          size="md"
          style={styles.addBtn}
        />

        {/* Medication Schedule List */}
        {medications.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="medkit-outline" size={42} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Medications Added</Text>
            <Text style={styles.emptySubtitle}>
              Keep track of anti-hypertensive, lipid-lowering, or anti-platelet therapies.
            </Text>
          </Card>
        ) : (
          medications.map((med) => (
            <Card key={med.id} style={styles.medCard}>
              <View style={styles.medCardTop}>
                <View style={styles.medLeftGroup}>
                  <View style={styles.medIconBox}>
                    <Ionicons name="medkit" size={22} color={colors.secondary} />
                  </View>
                  <View>
                    <Text style={styles.medName}>{med.name}</Text>
                    <Text style={styles.medDosage}>{med.dosage}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => toggleMedicationActive(med.id)}
                  style={styles.statusToggle}
                >
                  <Badge
                    label={med.isActive ? 'ACTIVE' : 'PAUSED'}
                    status={med.isActive ? 'normal' : 'warning'}
                    size="sm"
                  />
                </TouchableOpacity>
              </View>

              {med.instructions ? (
                <Text style={styles.medInstructions}>{med.instructions}</Text>
              ) : null}

              <View style={styles.medMetaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.metaText}>
                    {med.times.join(', ')} ({med.timing.replace('_', ' ')})
                  </Text>
                </View>
                {med.remainingPills !== undefined && (
                  <View style={styles.metaItem}>
                    <Ionicons name="cube-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.metaText}>
                      {med.remainingPills} / {med.totalPills || 30} left
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.medCardActions}>
                <TouchableOpacity
                  style={styles.deleteAction}
                  onPress={() => handleDelete(med.id, med.name)}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  <Text style={styles.deleteActionText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        {/* Safety Disclaimer */}
        <View style={styles.adherenceNote}>
          <Ionicons name="information-circle-outline" size={18} color="#0284C7" />
          <Text style={styles.adherenceNoteText}>
            Never stop or alter the dosage of prescribed cardiovascular medications (such as beta-blockers, ACE inhibitors, ARBs, or blood thinners) without consulting your treating cardiologist.
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
  backBtn: {
    marginRight: spacing.sm,
    padding: spacing.xs,
  },
  headerTitleGroup: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.primary,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    marginBottom: spacing.md,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  medCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  medCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  medLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  medIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  medName: {
    fontSize: fontSize.sm + 1,
    fontWeight: '700',
    color: colors.text,
  },
  medDosage: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusToggle: {
    paddingLeft: spacing.xs,
  },
  medInstructions: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
    marginVertical: spacing.xs,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.xs + 2,
    borderRadius: radius.sm,
  },
  medMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: fontSize.xs - 1,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  medCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
  },
  deleteAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteActionText: {
    fontSize: fontSize.xs - 1,
    color: colors.danger,
    marginLeft: 4,
    fontWeight: '600',
  },
  adherenceNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: spacing.md,
  },
  adherenceNoteText: {
    fontSize: fontSize.xs,
    color: '#0369A1',
    marginLeft: spacing.xs,
    flex: 1,
    lineHeight: 16,
  },
});
