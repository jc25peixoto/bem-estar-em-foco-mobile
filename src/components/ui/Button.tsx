import React from 'react';
import { Pressable, PressableProps, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { tokens } from '../../theme/tokens';
import { Typography } from './Typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps extends PressableProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  title?: string;
  children?: React.ReactNode;
}

export function Button({
  variant = 'default',
  size = 'default',
  title,
  children,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: disabled ? 0.5 : opacity.value,
    };
  });

  const handlePressIn = (e: any) => {
    scale.value = withSpring(0.96, { stiffness: 400, damping: 20 });
    opacity.value = withTiming(0.8, { duration: 100 });
    props.onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, { stiffness: 400, damping: 20 });
    opacity.value = withTiming(1, { duration: 150 });
    props.onPressOut?.(e);
  };

  return (
    <AnimatedPressable
      style={[styles.base, variantStyles[variant], sizeStyles[size], style as ViewStyle, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      {...props}
    >
      {title ? (
        <Typography variant="button" style={[textStyles[variant]]}>
          {title}
        </Typography>
      ) : (
        children
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.md,
  },
});

const variantStyles: Record<string, ViewStyle> = StyleSheet.create({
  default: {
    backgroundColor: tokens.colors.primary,
  },
  secondary: {
    backgroundColor: tokens.colors.secondary,
  },
  destructive: {
    backgroundColor: tokens.colors.destructive,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tokens.colors.input,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
});

const textStyles: Record<string, TextStyle> = StyleSheet.create({
  default: {
    color: tokens.colors.primaryForeground,
  },
  secondary: {
    color: tokens.colors.secondaryForeground,
  },
  destructive: {
    color: tokens.colors.destructiveForeground,
  },
  outline: {
    color: tokens.colors.foreground,
  },
  ghost: {
    color: tokens.colors.foreground,
  },
});

const sizeStyles: Record<string, ViewStyle> = StyleSheet.create({
  default: {
    height: 48,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
  },
  sm: {
    height: 36,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
  },
  lg: {
    height: 56,
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.md,
  },
  icon: {
    height: 48,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
