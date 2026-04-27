import React from 'react';
import { View, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Typography } from './Typography';
import { tokens } from '../../theme/tokens';

interface SymptomSliderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
}

export function SymptomSlider({ label, value, onValueChange, disabled }: SymptomSliderProps) {
  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <View style={styles.header}>
        <Typography variant="body" weight="medium" style={styles.label}>{label}</Typography>
        <Typography 
          variant="body" 
          weight="bold" 
          color={value === 0 ? 'success' : value >= 4 ? 'destructive' : 'foreground'}
        >
          {value}
        </Typography>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={5}
        step={1}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={tokens.colors.primary}
        maximumTrackTintColor={tokens.colors.border}
        thumbTintColor={tokens.colors.primary}
        disabled={disabled}
      />
      <View style={styles.footer}>
        <Typography variant="caption" color="mutedForeground">Ausente</Typography>
        <Typography variant="caption" color="mutedForeground">Intenso</Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  label: {
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.sm,
  }
});
