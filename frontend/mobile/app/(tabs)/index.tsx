import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, fontSize, shadows } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useHealthStore } from '../../store/healthStore';
import { HealthMetricCard } from '../../components/ui/HealthMetricCard';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { measurements, medications, latestAssessment, dataSource, getLatestMeasurement } = useHealthStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const latestBp = getLatestMeasurement('bp');
  const latestHr = getLatestMeasurement('heart_rate');
  const latestWeight = getLatestMeasurement('weight');
  const latestGlucose = getLatestMeasurement('glucose');

  const formatTimeAgo = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const diffHours = Math.floor((Date.now() - date.getTime()) / (1000 * 3600));
    if (diffHours < 1) return 'Just now';
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.secondary}
          />
        }
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.fullName || 'Patient'}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => router.push('/(tabs)/profile')}
            accessibilityLabel="Go to Profile"
          >
            <Ionicons name="person" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.dataSourceLabel}>
          {dataSource === 'live' ? 'Live data from CardioGuard' : 'No live health data loaded'}
        </Text>

        {/* PROMINENT EMERGENCY BUTTON */}
        <TouchableOpacity
          style={styles.emergencyCard}
          onPress={() => router.push('/emergency')}
          activeOpacity={0.88}
        >
          <View style={styles.emergencyIconContainer}>
            <Ionicons name="alert-circle" size={32} color={colors.textInverse} />
          </View>
          <View style={styles.emergencyTextContainer}>
            <Text style={styles.emergencyTitle}>EMERGENCY HEART ASSISTANCE</Text>
            <Text style={styles.emergencySubtitle}>
              Severe chest pain, shortness of breath, cold sweats? Call 112 now.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textInverse} />
        </TouchableOpacity>

        {/* Quick Action: Record Measurement */}
        <View style={styles.actionRow}>
          <Button
            title="Record Vital"
            icon="add-circle-outline"
            onPress={() => router.push('/vitals/record')}
            size="md"
            style={styles.recordButton}
          />
          <Button
            title="Medications"
            icon="medkit-outline"
            variant="outline"
            onPress={() => router.push('/medications')}
            size="md"
            style={styles.medsButton}
          />
        </View>

        {/* Cardiovascular Risk Summary Banner */}
        {latestAssessment && (
          <Card style={styles.riskCard} onPress={() => router.push('/(tabs)/heart')}>
            <View style={styles.riskHeader}>
              <View>
                <Text style={styles.riskSectionTitle}>Latest cardiovascular review</Text>
                <Text style={styles.riskSubtitle}>From the shared backend assessment record</Text>
              </View>
              <Badge
                label={latestAssessment.classification.replace('_', ' ').toUpperCase()}
                status={
                  latestAssessment.classification === 'higher_attention' ? 'warning' : 'normal'
                }
              />
            </View>

            <View style={styles.riskScoreRow}>
              <Text style={styles.riskScoreNumber}>REVIEW</Text>
              <Text style={styles.riskScoreExplain}>This is not a diagnosis or an acute safety clearance.</Text>
            </View>

            <View style={styles.riskFooter}>
              <Text style={styles.riskFactorCount}>
                {latestAssessment.missing_inputs.length} missing input categories
              </Text>
              <View style={styles.viewPlanRow}>
                <Text style={styles.viewPlanText}>View Prevention Plan</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.secondary} />
              </View>
            </View>
          </Card>
        )}

        {/* Latest Vitals Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Vitals</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/trends')}>
            <Text style={styles.sectionAction}>View Trends</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.vitalsGrid}>
          {latestBp ? (
            <HealthMetricCard
              title="Blood Pressure"
              value={`${latestBp.value}`}
              secondaryValue={latestBp.secondaryValue}
              secondaryUnit="mmHg"
              unit="mmHg"
              icon="heart-circle-outline"
              timestamp={formatTimeAgo(latestBp.recordedAt)}
              status={latestBp.status}
              statusLabel={latestBp.value < 130 ? 'Normal' : 'Elevated'}
              trend={latestBp.trend}
              onPress={() => router.push('/(tabs)/trends')}
            />
          ) : (
            <Card style={styles.emptyMetricCard} onPress={() => router.push('/vitals/record')}>
              <Ionicons name="pulse" size={24} color={colors.textTertiary} />
              <Text style={styles.emptyMetricText}>No BP logged yet</Text>
              <Text style={styles.emptyMetricAction}>+ Tap to record</Text>
            </Card>
          )}

          {latestHr ? (
            <HealthMetricCard
              title="Heart Rate"
              value={latestHr.value}
              unit="bpm"
              icon="pulse-outline"
              timestamp={formatTimeAgo(latestHr.recordedAt)}
              status={latestHr.status}
              statusLabel={latestHr.value <= 100 ? 'Resting' : 'High'}
              trend={latestHr.trend}
              onPress={() => router.push('/(tabs)/trends')}
            />
          ) : (
            <Card style={styles.emptyMetricCard} onPress={() => router.push('/vitals/record')}>
              <Ionicons name="heart" size={24} color={colors.textTertiary} />
              <Text style={styles.emptyMetricText}>No Heart Rate logged</Text>
              <Text style={styles.emptyMetricAction}>+ Tap to record</Text>
            </Card>
          )}

          {latestWeight ? (
            <HealthMetricCard
              title="Body Weight"
              value={latestWeight.value}
              unit="kg"
              icon="scale-outline"
              timestamp={formatTimeAgo(latestWeight.recordedAt)}
              status={latestWeight.status}
              statusLabel="Tracked"
              trend={latestWeight.trend}
              onPress={() => router.push('/(tabs)/trends')}
            />
          ) : null}

          {latestGlucose ? (
            <HealthMetricCard
              title="Fasting Glucose"
              value={latestGlucose.value}
              unit="mg/dL"
              icon="water-outline"
              timestamp={formatTimeAgo(latestGlucose.recordedAt)}
              status={latestGlucose.status}
              statusLabel={latestGlucose.value < 100 ? 'Optimal' : 'Pre-diabetic'}
              trend={latestGlucose.trend}
              onPress={() => router.push('/(tabs)/trends')}
            />
          ) : null}
        </View>

        {/* Medication Reminders Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Medications</Text>
          <TouchableOpacity onPress={() => router.push('/medications')}>
            <Text style={styles.sectionAction}>Manage ({medications.length})</Text>
          </TouchableOpacity>
        </View>

        {medications.length === 0 ? (
          <Card style={styles.emptyMedsCard}>
            <Ionicons name="medkit-outline" size={24} color={colors.textTertiary} />
            <Text style={styles.emptyMedsText}>No active medications added</Text>
            <TouchableOpacity onPress={() => router.push('/medications/add')}>
              <Text style={styles.addMedsLink}>+ Add prescribed medication</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          medications.slice(0, 3).map((med) => (
            <Card key={med.id} style={styles.medCard} onPress={() => router.push('/medications')}>
              <View style={styles.medRow}>
                <View style={styles.medIconBox}>
                  <Ionicons name="medkit" size={20} color={colors.secondary} />
                </View>
                <View style={styles.medInfo}>
                  <Text style={styles.medName}>{med.name}</Text>
                  <Text style={styles.medDosage}>
                    {med.dosage} • {med.timing.replace('_', ' ')}
                  </Text>
                </View>
                <View style={styles.medTimeBadge}>
                  <Ionicons name="alarm-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.medTimeText}>{med.times[0] || 'Daily'}</Text>
                </View>
              </View>
            </Card>
          ))
        )}

        {/* Recent Activity Log */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Health Activity</Text>
        </View>

        <Card style={styles.activityCard}>
          {measurements.slice(0, 4).map((m, idx) => (
            <View
              key={m.id}
              style={[
                styles.activityItem,
                idx === Math.min(measurements.length - 1, 3) ? styles.activityItemLast : {},
              ]}
            >
              <View style={styles.activityDot} />
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>
                  Recorded {m.type.toUpperCase()}: {m.value}{' '}
                  {m.secondaryValue ? `/${m.secondaryValue} ` : ''}
                  {m.unit}
                </Text>
                <Text style={styles.activityTime}>{formatTimeAgo(m.recordedAt)}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Bottom spacing for floating emergency button */}
        <View style={{ height: 60 }} />
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dataSourceLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginBottom: spacing.sm,
  },
  greetingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.primary,
  },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emergencyCard: {
    backgroundColor: colors.emergency,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  emergencyIconContainer: {
    marginRight: spacing.sm,
  },
  emergencyTextContainer: {
    flex: 1,
  },
  emergencyTitle: {
    color: colors.textInverse,
    fontWeight: '800',
    fontSize: fontSize.sm,
    letterSpacing: 0.3,
  },
  emergencySubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: fontSize.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  recordButton: {
    flex: 1,
  },
  medsButton: {
    flex: 1,
  },
  riskCard: {
    backgroundColor: '#0F172A',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 0,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  riskSectionTitle: {
    color: colors.textInverse,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  riskSubtitle: {
    color: '#94A3B8',
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  riskScoreRow: {
    marginVertical: spacing.md,
  },
  riskScoreNumber: {
    color: '#38BDF8',
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  riskScoreExplain: {
    color: '#E2E8F0',
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  riskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: spacing.sm,
  },
  riskFactorCount: {
    color: '#94A3B8',
    fontSize: fontSize.xs,
  },
  viewPlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewPlanText: {
    color: colors.secondaryLight,
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginRight: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  sectionAction: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.secondary,
  },
  vitalsGrid: {
    marginBottom: spacing.xs,
  },
  emptyMetricCard: {
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyMetricText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  emptyMetricAction: {
    color: colors.secondary,
    fontWeight: '600',
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  medCard: {
    padding: spacing.sm + 2,
    marginBottom: spacing.xs,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
  },
  medDosage: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  medTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  medTimeText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyMedsCard: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyMedsText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  addMedsLink: {
    color: colors.secondary,
    fontWeight: '600',
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  activityCard: {
    padding: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
    marginTop: 6,
    marginRight: spacing.sm,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: fontSize.xs + 1,
    fontWeight: '600',
    color: colors.text,
  },
  activityTime: {
    fontSize: fontSize.xs - 1,
    color: colors.textTertiary,
    marginTop: 2,
  },
});
