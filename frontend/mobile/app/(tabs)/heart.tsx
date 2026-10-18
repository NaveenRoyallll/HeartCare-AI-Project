import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, fontSize, shadows } from '../../constants/theme';
import { useHealthStore } from '../../store/healthStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export default function HeartHealthScreen() {
  const {
    riskScore,
    riskFactors,
    getMeasurementsByType,
    latestAssessment,
    assessmentHistory,
    assessmentLoading,
    assessmentError,
    evaluateCardiovascularHealth,
  } = useHealthStore();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'modifiable' | 'non_modifiable'>('all');

  const bpMeasurements = getMeasurementsByType('bp');
  const hrMeasurements = getMeasurementsByType('heart_rate');

  const filteredFactors = riskFactors.filter((rf) => {
    if (selectedFilter === 'all') return true;
    return rf.category === selectedFilter;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Heart Health & Risk</Text>
          <Text style={styles.pageSubtitle}>
            Evidence-based cardiovascular assessment and clinical prevention metrics
          </Text>
        </View>

        {/* Risk Score Summary Card */}
        <Card style={styles.scoreCard}>
          <View style={styles.scoreTopRow}>
            <View>
              <Text style={styles.scoreLabel}>Validated quantitative risk score</Text>
              <Text style={styles.scoreSub}>Available only when required inputs and a supported model are present</Text>
            </View>
            <Badge
              label={latestAssessment?.classification?.replace('_', ' ').toUpperCase() || 'NOT ASSESSED'}
              status={
                latestAssessment?.classification === 'higher_attention' ? 'warning' : 'normal'
              }
            />
          </View>

          <View style={styles.gaugeContainer}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreVal}>{latestAssessment ? 'REVIEW' : '—'}</Text>
              <Text style={styles.scoreValLabel}>Est. Risk</Text>
            </View>
            <View style={styles.gaugeDesc}>
              <Text style={styles.gaugeTitle}>
                {latestAssessment ? latestAssessment.classification.replace('_', ' ') : 'No quantitative result'}
              </Text>
              <Text style={styles.gaugeBody}>
                A missing or low result never rules out an emergency. Use the emergency screen for new or concerning symptoms.
              </Text>
            </View>
          </View>

          {/* Mandatory Clinical Disclaimer */}
          <View style={styles.disclaimerBox}>
            <Ionicons name="information-circle-outline" size={18} color="#0284C7" />
            <Text style={styles.disclaimerText}>{riskScore.disclaimer}</Text>
          </View>
        </Card>

        <Card style={styles.scoreCard}>
          <View style={styles.scoreTopRow}>
            <View>
              <Text style={styles.scoreLabel}>Unified health review</Text>
              <Text style={styles.scoreSub}>
                {latestAssessment ? `Updated ${new Date(latestAssessment.created_at).toLocaleDateString()}` : 'No review recorded yet'}
              </Text>
            </View>
            <Badge
              label={latestAssessment?.classification?.replace('_', ' ').toUpperCase() || 'NOT RUN'}
              status={latestAssessment?.classification === 'higher_attention' ? 'warning' : 'normal'}
            />
          </View>
          <Text style={styles.bpAdvice}>
            This prevention review shows its inputs, missing data, and uncertainty. It is not a diagnosis and does not replace emergency care.
          </Text>
          <TouchableOpacity style={styles.filterPillActive} onPress={() => void evaluateCardiovascularHealth()} disabled={assessmentLoading}>
            <Text style={styles.filterPillTextActive}>{assessmentLoading ? 'Loading review…' : 'Refresh health review'}</Text>
          </TouchableOpacity>
          {assessmentError ? <Text style={styles.bpAdvice}>Unable to refresh: {assessmentError}</Text> : null}
          {latestAssessment?.missing_inputs?.length ? (
            <Text style={styles.bpAdvice}>Missing: {latestAssessment.missing_inputs.join(', ')}</Text>
          ) : null}
          {latestAssessment?.uncertainty?.length ? (
            <Text style={styles.bpAdvice}>Uncertainty: {latestAssessment.uncertainty.join(' ')}</Text>
          ) : null}
          {assessmentHistory.length > 1 ? (
            <Text style={styles.bpAdvice}>{assessmentHistory.length} backend assessment records available in history.</Text>
          ) : null}
        </Card>

        {/* Key Clinical Recommendations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Preventative Action Items</Text>
        </View>

        <Card style={styles.recommendationsCard}>
          {riskScore.keyRecommendations.map((rec, index) => (
            <View key={index} style={styles.recItem}>
              <View style={styles.recNumberCircle}>
                <Text style={styles.recNumber}>{index + 1}</Text>
              </View>
              <Text style={styles.recText}>{rec}</Text>
            </View>
          ))}
        </Card>

        {/* Risk Factors Checklist */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cardiovascular Risk Factors</Text>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['all', 'modifiable', 'non_modifiable'] as const).map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedFilter(cat)}
              style={[
                styles.filterPill,
                selectedFilter === cat && styles.filterPillActive,
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedFilter === cat && styles.filterPillTextActive,
                ]}
              >
                {cat === 'all'
                  ? 'All Factors'
                  : cat === 'modifiable'
                  ? 'Modifiable Lifestyle'
                  : 'Non-Modifiable (Genetics)'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Factors List */}
        {filteredFactors.map((factor) => (
          <Card key={factor.id} style={styles.factorCard}>
            <View style={styles.factorHeader}>
              <View style={styles.factorTitleRow}>
                <Ionicons
                  name={factor.present ? 'alert-circle' : 'checkmark-circle'}
                  size={20}
                  color={factor.present ? colors.warning : colors.success}
                  style={styles.factorIcon}
                />
                <Text style={styles.factorName}>{factor.name}</Text>
              </View>
              <Badge
                label={factor.present ? (factor.severity || 'Present') : 'Under Control'}
                status={factor.present ? 'warning' : 'normal'}
                size="sm"
              />
            </View>
            <Text style={styles.factorDesc}>{factor.description}</Text>
          </Card>
        ))}

        {/* Vitals Overview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Blood Pressure Status</Text>
        </View>

        <Card style={styles.vitalsOverviewCard}>
          <View style={styles.bpStatusRow}>
            <View>
              <Text style={styles.bpValue}>
                {bpMeasurements[0] ? `${bpMeasurements[0].value}/${bpMeasurements[0].secondaryValue}` : '--/--'}
                <Text style={styles.bpUnit}> mmHg</Text>
              </Text>
              <Text style={styles.bpLabel}>Latest Sitting Reading</Text>
            </View>
            <Badge label="Grade 1 Controlled" status="normal" />
          </View>
          <Text style={styles.bpAdvice}>
            Normal threshold target: &lt;130/80 mmHg according to AHA/ACC guidelines.
          </Text>
        </Card>

        {/* Resting Heart Rate */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Resting Heart Rate</Text>
        </View>

        <Card style={styles.vitalsOverviewCard}>
          <View style={styles.bpStatusRow}>
            <View>
              <Text style={styles.bpValue}>
                {hrMeasurements[0]?.value || '--'}
                <Text style={styles.bpUnit}> bpm</Text>
              </Text>
              <Text style={styles.bpLabel}>Resting Pulse</Text>
            </View>
            <Badge label="Normal Range (60-100)" status="normal" />
          </View>
          <Text style={styles.bpAdvice}>
            Consistently resting below 80 bpm is correlated with favorable cardiovascular conditioning.
          </Text>
        </Card>

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
    marginBottom: spacing.md,
  },
  pageTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.primary,
  },
  pageSubtitle: {
    fontSize: fontSize.xs + 1,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  scoreCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  scoreTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  scoreLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
  },
  scoreSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  gaugeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scoreCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#38BDF8',
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  scoreVal: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.primary,
  },
  scoreValLabel: {
    fontSize: fontSize.xs - 2,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  gaugeDesc: {
    flex: 1,
  },
  gaugeTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  gaugeBody: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  disclaimerText: {
    fontSize: fontSize.xs - 1,
    color: '#0369A1',
    marginLeft: spacing.xs,
    flex: 1,
    lineHeight: 15,
  },
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  recommendationsCard: {
    padding: spacing.md,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  recNumberCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 1,
  },
  recNumber: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.secondary,
  },
  recText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: colors.textInverse,
  },
  factorCard: {
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  factorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  factorIcon: {
    marginRight: spacing.xs,
  },
  factorName: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
  },
  factorDesc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginLeft: spacing.lg,
    lineHeight: 16,
  },
  vitalsOverviewCard: {
    padding: spacing.md,
  },
  bpStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  bpValue: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
  },
  bpUnit: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  bpLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bpAdvice: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
  },
});
