import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, fontSize, shadows } from '../../constants/theme';

export interface EmergencyFABProps {
  label?: string;
  onPress?: () => void;
}

export const EmergencyFAB: React.FC<EmergencyFABProps> = ({
  label = 'EMERGENCY 112',
  onPress,
}) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/emergency');
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.fab}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Open Emergency Assistance"
    >
      <Ionicons name="warning" size={20} color={colors.textInverse} style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    ...shadows.lg,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  icon: {
    marginRight: spacing.xs,
  },
  label: {
    color: colors.textInverse,
    fontWeight: '800',
    fontSize: fontSize.xs + 1,
    letterSpacing: 0.5,
  },
});
