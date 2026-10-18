import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, fontSize } from '../../constants/theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = styles.base;
    let variantStyle: ViewStyle = styles.primary;
    let sizeStyle: ViewStyle = styles.sizeMd;

    switch (variant) {
      case 'secondary':
        variantStyle = styles.secondary;
        break;
      case 'outline':
        variantStyle = styles.outline;
        break;
      case 'danger':
        variantStyle = styles.danger;
        break;
      case 'ghost':
        variantStyle = styles.ghost;
        break;
      default:
        variantStyle = styles.primary;
        break;
    }

    switch (size) {
      case 'sm':
        sizeStyle = styles.sizeSm;
        break;
      case 'lg':
        sizeStyle = styles.sizeLg;
        break;
      default:
        sizeStyle = styles.sizeMd;
        break;
    }

    return {
      ...baseStyle,
      ...variantStyle,
      ...sizeStyle,
      ...(disabled || loading ? styles.disabled : {}),
    };
  };

  const getTextStyle = (): TextStyle => {
    let textVariantStyle: TextStyle = styles.textPrimary;
    let textSizeStyle: TextStyle = styles.textSizeMd;

    switch (variant) {
      case 'secondary':
        textVariantStyle = styles.textSecondary;
        break;
      case 'outline':
        textVariantStyle = styles.textOutline;
        break;
      case 'danger':
        textVariantStyle = styles.textDanger;
        break;
      case 'ghost':
        textVariantStyle = styles.textGhost;
        break;
      default:
        textVariantStyle = styles.textPrimary;
        break;
    }

    switch (size) {
      case 'sm':
        textSizeStyle = styles.textSizeSm;
        break;
      case 'lg':
        textSizeStyle = styles.textSizeLg;
        break;
      default:
        textSizeStyle = styles.textSizeMd;
        break;
    }

    return {
      ...textVariantStyle,
      ...textSizeStyle,
    };
  };

  const getIconColor = (): string => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return colors.primary;
      case 'danger':
        return colors.textInverse;
      default:
        return colors.textInverse;
    }
  };

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[getContainerStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textInverse} size="small" />
      ) : (
        <View style={styles.contentContainer}>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={iconSize} color={getIconColor()} style={styles.leftIcon} />
          )}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={iconSize} color={getIconColor()} style={styles.rightIcon} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: spacing.xs,
  },
  rightIcon: {
    marginLeft: spacing.xs,
  },
  // Variants
  primary: {
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderWidth: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.danger,
    borderWidth: 0,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  disabled: {
    opacity: 0.5,
  },
  // Sizes
  sizeSm: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 4,
  },
  sizeMd: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
  },
  sizeLg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  // Text Variants
  textPrimary: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  textSecondary: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  textOutline: {
    color: colors.primary,
    fontWeight: '600',
  },
  textDanger: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  textGhost: {
    color: colors.primary,
    fontWeight: '600',
  },
  // Text Sizes
  textSizeSm: {
    fontSize: fontSize.sm,
  },
  textSizeMd: {
    fontSize: fontSize.md,
  },
  textSizeLg: {
    fontSize: fontSize.lg,
  },
});
