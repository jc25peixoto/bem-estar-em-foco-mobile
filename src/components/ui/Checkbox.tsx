import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import ExpoCheckbox from 'expo-checkbox';
import { tokens } from '../../theme/tokens';
import { Typography } from './Typography';

interface CheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Checkbox({ value, onValueChange, label, disabled }: CheckboxProps) {
  return (
    <Pressable 
      style={styles.container} 
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
    >
      <ExpoCheckbox
        value={value}
        onValueChange={onValueChange}
        color={value ? tokens.colors.primary : undefined}
        disabled={disabled}
        style={styles.checkbox}
      />
      {label && (
        <Typography 
          variant="body" 
          color={disabled ? 'mutedForeground' : 'foreground'}
          style={styles.label}
        >
          {label}
        </Typography>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
  },
  checkbox: {
    marginRight: tokens.spacing.md,
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  label: {
    flex: 1,
  }
});
