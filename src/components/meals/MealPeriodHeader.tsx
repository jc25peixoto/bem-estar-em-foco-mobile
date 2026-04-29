import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { tokens } from '../../theme/tokens';
import type { MealPeriodSummary } from '../../types/meal';

interface MealPeriodHeaderProps {
  summary: MealPeriodSummary | null;
  weekLabel: string;
  onSave: (initialWeight: number | null, finalWeight: number | null) => void;
}

export function MealPeriodHeader({ summary, weekLabel, onSave }: MealPeriodHeaderProps) {
  const [initialStr, setInitialStr] = useState('');
  const [finalStr, setFinalStr] = useState('');

  useEffect(() => {
    setInitialStr(summary?.initial_weight != null ? String(summary.initial_weight) : '');
    setFinalStr(summary?.final_weight != null ? String(summary.final_weight) : '');
  }, [summary]);

  const handleSave = () => {
    const initVal = initialStr ? parseFloat(initialStr.replace(',', '.')) : null;
    const finalVal = finalStr ? parseFloat(finalStr.replace(',', '.')) : null;
    onSave(initVal, finalVal);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Typography variant="h4">⚖️ Peso da Semana</Typography>
      </View>
      
      <View style={styles.row}>
        <View style={styles.inputContainer}>
          <Typography variant="caption" color="mutedForeground" style={styles.label}>Inicial (kg)</Typography>
          <Input
            value={initialStr}
            onChangeText={setInitialStr}
            keyboardType="numeric"
            placeholder="0.0"
            style={styles.input}
          />
        </View>
        <View style={styles.inputContainer}>
          <Typography variant="caption" color="mutedForeground" style={styles.label}>Final (kg)</Typography>
          <Input
            value={finalStr}
            onChangeText={setFinalStr}
            keyboardType="numeric"
            placeholder="0.0"
            style={styles.input}
          />
        </View>
      </View>

      <Button
        title="Salvar Peso"
        variant="outline"
        onPress={handleSave}
        style={styles.saveBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginBottom: tokens.spacing.md,
  },
  header: {
    marginBottom: tokens.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  inputContainer: {
    flex: 1,
  },
  label: {
    marginBottom: tokens.spacing.xs,
  },
  input: {
    textAlign: 'center',
  },
  saveBtn: {
    marginTop: tokens.spacing.sm,
  },
});
