import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { tokens } from '../../theme/tokens';
import { Typography } from './Typography';

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
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 50 }),
      Animated.timing(opacityAnim, { toValue: 0.8, duration: 100, useNativeDriver: true }),
    ]).start();
    props.onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    props.onPressOut?.(e);
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: disabled ? 0.5 : opacityAnim,
      }}
    >
      <Pressable
        style={[styles.base, variantStyles[variant], sizeStyles[size], style as ViewStyle]}
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
      </Pressable>
    </Animated.View>
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
