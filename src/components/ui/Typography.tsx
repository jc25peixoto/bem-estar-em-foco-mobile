import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'button';
  color?: keyof typeof tokens.colors;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  weight?: keyof typeof tokens.typography.weights;
}

export function Typography({
  variant = 'body',
  color = 'foreground',
  align = 'left',
  weight,
  style,
  children,
  ...props
}: TypographyProps) {
  const textStyles = [
    styles.base,
    styles[variant],
    {
      color: tokens.colors[color],
      textAlign: align,
      ...(weight && { fontWeight: tokens.typography.weights[weight] as any }),
    },
    style,
  ];

  return (
    <Text style={textStyles} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'System', // Ou a fonte customizada quando for adicionada
  },
  h1: {
    fontSize: tokens.typography.sizes['3xl'],
    fontWeight: '700',
    lineHeight: tokens.typography.sizes['3xl'] * 1.2,
  },
  h2: {
    fontSize: tokens.typography.sizes['2xl'],
    fontWeight: '600',
    lineHeight: tokens.typography.sizes['2xl'] * 1.2,
  },
  h3: {
    fontSize: tokens.typography.sizes.xl,
    fontWeight: '600',
    lineHeight: tokens.typography.sizes.xl * 1.2,
  },
  h4: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: '600',
    lineHeight: tokens.typography.sizes.lg * 1.2,
  },
  body: {
    fontSize: tokens.typography.sizes.base,
    fontWeight: '400',
    lineHeight: tokens.typography.sizes.base * 1.5,
  },
  caption: {
    fontSize: tokens.typography.sizes.sm,
    fontWeight: '400',
    lineHeight: tokens.typography.sizes.sm * 1.4,
  },
  button: {
    fontSize: tokens.typography.sizes.base,
    fontWeight: '500',
    lineHeight: tokens.typography.sizes.base * 1.2,
  },
});
