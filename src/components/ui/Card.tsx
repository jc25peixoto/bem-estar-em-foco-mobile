import React from 'react';
import { View, ViewProps, StyleSheet, Platform } from 'react-native';
import { tokens } from '../../theme/tokens';

interface CardProps extends ViewProps {
  variant?: 'elevated' | 'soft' | 'outline';
}

export function Card({ variant = 'elevated', style, children, ...props }: CardProps) {
  return (
    <View style={[styles.base, styles[variant], style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.card,
  },
  elevated: {
    ...Platform.select({
      ios: {
        shadowColor: tokens.colors.foreground,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 16px -4px rgba(89, 38, 45, 0.12)', // fallback to css variable shadow
      },
    }),
  },
  soft: {
    backgroundColor: tokens.colors.accent,
    borderWidth: 1,
    borderColor: tokens.colors.accent,
  },
  outline: {
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
});
