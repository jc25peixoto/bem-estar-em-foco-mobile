import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { tokens } from '../../theme/tokens';
import { FASTING_LEVELS, type FastingLevelKey } from '../../lib/fastingConfig';

interface Props {
  selected: FastingLevelKey | null;
  onSelect: (key: FastingLevelKey) => void;
}

export function FastingLevelSelector({ selected, onSelect }: Props) {
  return (
    <Card style={styles.mainCard}>
      <Typography variant="h3" style={styles.title}>
        Escolha seu nível de jejum
      </Typography>
      <Typography variant="body" color="mutedForeground" style={styles.subtitle}>
        Selecione o nível que melhor se adapta ao seu momento atual. Você pode alterar depois.
      </Typography>

      <View style={styles.grid}>
        {FASTING_LEVELS.map((level) => {
          const isSelected = selected === level.key;

          return (
            <TouchableOpacity
              key={level.key}
              activeOpacity={0.7}
              onPress={() => onSelect(level.key)}
              style={styles.cardContainer}
            >
              <View
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
              >
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Typography style={styles.checkText}>✓</Typography>
                  </View>
                )}
                
                <Typography style={styles.emoji}>{level.emoji}</Typography>
                <Typography variant="body" weight="semibold" style={styles.levelName}>
                  {level.name}
                </Typography>
                <Typography variant="caption" color="mutedForeground" style={styles.levelDesc}>
                  {level.description}
                </Typography>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  mainCard: {
    padding: tokens.spacing.xl,
    borderRadius: tokens.radius.xl,
    backgroundColor: '#FFFFFF',
    marginBottom: tokens.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    marginBottom: tokens.spacing.xs,
    fontSize: 18,
    color: '#333333',
  },
  subtitle: {
    marginBottom: tokens.spacing.xl,
    fontSize: 14,
    lineHeight: 20,
    color: '#888888',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: tokens.spacing.md,
  },
  cardContainer: {
    width: '47%', // slightly less than 50% to account for gap
    marginBottom: tokens.spacing.md,
  },
  optionCard: {
    padding: tokens.spacing.lg,
    position: 'relative',
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.lg,
    backgroundColor: '#FFFFFF',
    minHeight: 180,
  },
  optionCardSelected: {
    borderColor: tokens.colors.primary,
    backgroundColor: '#DE5D8310', // valid hex with 10% opacity
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  checkText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emoji: {
    fontSize: 28,
    marginBottom: tokens.spacing.sm,
  },
  levelName: {
    marginBottom: tokens.spacing.xs,
    fontSize: 15,
    color: '#222222',
  },
  levelDesc: {
    fontSize: 12,
    lineHeight: 16,
    color: '#777777',
  },
});
