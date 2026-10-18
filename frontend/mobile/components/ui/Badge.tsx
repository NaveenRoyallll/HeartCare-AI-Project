import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, fontSize } from '../../constants/theme';

export type BadgeStatus = 'normal' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  label: string;
  status?: BadgeStatus;
  size?: 'sm' | 'md';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  status = 'info',
  size = 'md',
  icon,
  style,
  textStyle,
}) => {
  const getBadgeColors = () => {
    switch (status) {
      case 'normal':
        return {
          bg: '#DCFCE7', // light green
          text: colors.success,
          border: '#86EFAC',
        };
      case 'warning':
        return {
          bg: '#FEF3C7', // light amber
          text: '#B45309',
          border: '#FCD34D',
        };
      case 'danger':
        return {
          bg: colors.dangerLight, // light red
          text: colors.danger,
          border: '#FCA5A5',
        };
      case 'info':
      default:
        return {
          bg: '#E0F2FE', // light cyan/sky
          text: '#0369A1',
          border: '#BAE6FD',
        };
    }
  };

  const badgeTheme = getBadgeColors();
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeTheme.bg,
          borderColor: badgeTheme.border,
          paddingVertical: isSmall ? 2 : spacing.xs,
          paddingHorizontal: isSmall ? spacing.xs + 2 : spacing.sm,
        },
        style,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={isSmall ? 12 : 14}
          color={badgeTheme.text}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            color: badgeTheme.text,
            fontSize: isSmall ? fontSize.xs - 2 : fontSize.xs,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
