import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, fontSize, shadows } from '../../constants/theme';
import { Badge, BadgeStatus } from './Badge';

export interface HealthMetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: keyof typeof Ionicons.glyphMap;
  timestamp?: string;
  status?: BadgeStatus;
  statusLabel?: string;
  trend?: 'up' | 'down' | 'stable';
  secondaryValue?: string | number;
  secondaryUnit?: string;
  onPress?: () => void;
}

export const HealthMetricCard: React.FC<HealthMetricCardProps> = ({
  title,
  value,
  unit,
  icon,
  timestamp,
  status = 'normal',
  statusLabel,
  trend,
  secondaryValue,
  secondaryUnit,
  onPress,
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return { name: 'arrow-up' as const, color: colors.warning };
      case 'down':
        return { name: 'arrow-down' as const, color: colors.secondary };
      case 'stable':
        return { name: 'remove' as const, color: colors.textTertiary };
      default:
        return null;
    }
  };

  const trendIcon = getTrendIcon();

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={20} color={colors.secondary} />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>
        {statusLabel && (
          <Badge label={statusLabel} status={status} size="sm" />
        )}
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.valueText}>{value}</Text>
        <Text style={styles.unitText}>{unit}</Text>
        {secondaryValue !== undefined && (
          <Text style={styles.secondaryText}>
            / {secondaryValue} {secondaryUnit || ''}
          </Text>
        )}
        {trendIcon && (
          <View style={styles.trendContainer}>
            <Ionicons name={trendIcon.name} size={16} color={trendIcon.color} />
          </View>
        )}
      </View>

      {timestamp && (
        <View style={styles.bottomRow}>
          <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
          <Text style={styles.timestampText}>{timestamp}</Text>
        </View>
      )}
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs + 2,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  valueText: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  unitText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  secondaryText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  trendContainer: {
    marginLeft: spacing.sm,
    alignSelf: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  timestampText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginLeft: 4,
  },
});
