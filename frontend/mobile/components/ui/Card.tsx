import React from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { colors, radius, spacing, shadows } from '../../constants/theme';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'elevated' | 'flat' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'elevated',
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'flat':
        return styles.flat;
      case 'outlined':
        return styles.outlined;
      default:
        return styles.elevated;
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[styles.base, getVariantStyle(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.base, getVariantStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  elevated: {
    ...shadows.sm,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  flat: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 0,
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: colors.border,
  },
});
