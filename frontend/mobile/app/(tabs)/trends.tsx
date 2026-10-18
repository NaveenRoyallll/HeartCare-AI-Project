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
import { TrendPeriod } from '../../types/health';

const PERIODS: TrendPeriod[] = ['1W', '1M', '3M', '6M', '1Y'];

export default function TrendsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<TrendPeriod>('1M');
  const { getMeasurementsByType } = useHealthStore();

  const bpData = getMeasurementsByType('bp');
  const hrData = getMeasurementsByType('heart_rate');
  const weightData = getMeasurementsByType('weight');
  const glucoseData = getMeasurementsByType('glucose');

  // Calculate BP summary
  const avgSystolic = bpData.length
    ? Math.round(bpData.reduce((acc, m) => acc + m.value, 0) / bpData.length)
    : 0;
  const avgDiastolic = bpData.length
    ? Math.round(bpData.reduce((acc, m) => acc + (m.secondaryValue || 80), 0) / bpData.length)
    : 0;

  // Calculate HR summary
  const avgHr = hrData.length
    ? Math.round(hrData.reduce((acc, m) => acc + m.value, 0) / hrData.length)
    : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Vitals Trends</Text>
          <Text style={styles.pageSubtitle}>
            Longitudinal telemetry tracking and physiological variance
          </Text>
        </View>

        {/* Period Selector Tabs */}
        <View style={styles.periodRow}>
          {PERIODS.map((period) => (
            <TouchableOpacity
              key={period}
              onPress={() => setSelectedPeriod(period)}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.periodText,
                  selectedPeriod === period && styles.periodTextActive,
                ]}
              >
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Blood Pressure Trend Card */}
        <Card style={styles.trendCard}>
          <View style={styles.cardHeader}>
            <View style={styles.titleWithIcon}>
              <Ionicons name="heart-circle" size={22} color={colors.heart} />
              <Text style={styles.cardTitle}>Blood Pressure Trend</Text>
            </View>
            <Text style={styles.averageBadge}>Avg: {avgSystolic}/{avgDiastolic} mmHg</Text>
          </View>

          {/* Graphical Representation */}
          <View style={styles.chartContainer}>
            <View style={styles.chartYAxis}>
              <Text style={styles.yAxisLabel}>140</Text>
              <Text style={styles.yAxisLabel}>120</Text>
              <Text style={styles.yAxisLabel}>100</Text>
              <Text style={styles.yAxisLabel}>80</Text>
            </View>
            <View style={styles.chartBarsArea}>
              <View style={styles.gridLine1} />
              <View style={styles.gridLine2} />
              <View style={styles.gridLine3} />
              {/* Sample visualization bars for recent readings */}
              {[
                { date: 'Mon', sys: 122, dia: 80 },
                { date: 'Tue', sys: 128, dia: 84 },
                { date: 'Wed', sys: 124, dia: 82 },
                { date: 'Thu', sys: 120, dia: 78 },
                { date: 'Fri', sys: 126, dia: 82 },
                { date: 'Sat', sys: 124, dia: 80 },
                { date: 'Sun', sys: 122, dia: 81 },
              ].map((item, idx) => (
                <View key={idx} style={styles.barGroup}>
                  <View
                    style={[
                      styles.barSystolic,
                      { height: Math.max(20, (item.sys - 60) * 1.4) },
                    ]}
                  />
                  <View
                    style={[
                      styles.barDiastolic,
                      { height: Math.max(10, (item.dia - 40) * 1.1) },
                    ]}
                  />
                  <Text style={styles.barDateLabel}>{item.date}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Chart Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>Systolic</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
              <Text style={styles.legendText}>Diastolic</Text>
            </View>
          </View>
        </Card>

        {/* Heart Rate Trend Card */}
        <Card style={styles.trendCard}>
          <View style={styles.cardHeader}>
            <View style={styles.titleWithIcon}>
              <Ionicons name="pulse" size={22} color={colors.secondary} />
              <Text style={styles.cardTitle}>Resting Heart Rate</Text>
            </View>
            <Text style={styles.averageBadge}>Avg: {avgHr} bpm</Text>
          </View>

          <View style={styles.pulseSparklineContainer}>
            {[68, 72, 75, 71, 74, 72, 70].map((bpm, index) => (
              <View key={index} style={styles.sparkCol}>
                <View
                  style={[
                    styles.sparkBar,
                    { height: (bpm - 50) * 2.5, backgroundColor: colors.secondaryLight },
                  ]}
                />
                <Text style={styles.sparkVal}>{bpm}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.chartFootnote}>
            Optimal resting adult heart rate typically falls between 60 - 80 bpm.
          </Text>
        </Card>

        {/* Weight & BMI Trend Card */}
        <Card style={styles.trendCard}>
          <View style={styles.cardHeader}>
            <View style={styles.titleWithIcon}>
              <Ionicons name="scale-outline" size={22} color={colors.accent} />
              <Text style={styles.cardTitle}>Body Weight Trend</Text>
            </View>
            <Text style={styles.averageBadge}>
              {weightData[0] ? `${weightData[0].value} kg` : '--'}
            </Text>
          </View>
          <View style={styles.weightSummaryRow}>
            <View style={styles.weightMetric}>
              <Text style={styles.weightMetricNum}>{weightData[0]?.value || '74.2'}</Text>
              <Text style={styles.weightMetricLbl}>Current (kg)</Text>
            </View>
            <View style={styles.weightMetric}>
              <Text style={styles.weightMetricNum}>24.8</Text>
              <Text style={styles.weightMetricLbl}>BMI (Normal)</Text>
            </View>
            <View style={styles.weightMetric}>
              <Text style={styles.weightMetricNum}>-0.8 kg</Text>
              <Text style={styles.weightMetricLbl}>30-Day Delta</Text>
            </View>
          </View>
        </Card>

        {/* Blood Glucose Trend Card */}
        <Card style={styles.trendCard}>
          <View style={styles.cardHeader}>
            <View style={styles.titleWithIcon}>
              <Ionicons name="water-outline" size={22} color="#0284C7" />
              <Text style={styles.cardTitle}>Fasting Blood Glucose</Text>
            </View>
            <Text style={styles.averageBadge}>
              {glucoseData[0] ? `${glucoseData[0].value} mg/dL` : '--'}
            </Text>
          </View>
          <Text style={styles.chartFootnote}>
            Fasting glucose is kept stable within the ADA normal baseline (&lt; 100 mg/dL).
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
  },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  periodButtonActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  periodText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  periodTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  trendCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  averageBadge: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.secondary,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 150,
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
    paddingRight: spacing.sm,
  },
  chartYAxis: {
    height: '100%',
    justifyContent: 'space-between',
    paddingRight: spacing.xs,
    paddingBottom: 20,
  },
  yAxisLabel: {
    fontSize: fontSize.xs - 2,
    color: colors.textTertiary,
  },
  chartBarsArea: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 2,
  },
  gridLine1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  gridLine2: {
    position: 'absolute',
    top: '33%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  gridLine3: {
    position: 'absolute',
    top: '66%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  barGroup: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 28,
  },
  barSystolic: {
    width: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
    marginBottom: 2,
  },
  barDiastolic: {
    width: 8,
    backgroundColor: colors.secondary,
    borderRadius: 4,
  },
  barDateLabel: {
    fontSize: fontSize.xs - 2,
    color: colors.textSecondary,
    marginTop: 4,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xs,
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  pulseSparklineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
    marginVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
  },
  sparkCol: {
    alignItems: 'center',
  },
  sparkBar: {
    width: 14,
    borderRadius: 4,
  },
  sparkVal: {
    fontSize: fontSize.xs - 2,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  chartFootnote: {
    fontSize: fontSize.xs - 1,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  weightSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  weightMetric: {
    alignItems: 'center',
    flex: 1,
  },
  weightMetricNum: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.primary,
  },
  weightMetricLbl: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
