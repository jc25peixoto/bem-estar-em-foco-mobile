import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Typography } from '../ui/Typography';
import { tokens } from '../../theme/tokens';
import { Button } from '../ui/Button';

export interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: Record<string, string>) => void;
}

export function FilterModal({ visible, onClose, onApplyFilters }: FilterModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Typography variant="h3" style={styles.title}>Filtros</Typography>

        <View style={styles.filterSection}>
          <Typography variant="h4" style={styles.sectionTitle}>Status</Typography>
          <View style={styles.optionsRow}>
            <TouchableOpacity style={[styles.optionChip, styles.optionChipActive]}>
              <Typography variant="caption" color="primaryForeground" weight="medium">Ativos</Typography>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionChip}>
              <Typography variant="caption" color="mutedForeground">Inativos</Typography>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterSection}>
          <Typography variant="h4" style={styles.sectionTitle}>Turma</Typography>
          <View style={styles.optionsRow}>
            <TouchableOpacity style={styles.optionChip}>
              <Typography variant="caption" color="mutedForeground">Turma 1</Typography>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionChip}>
              <Typography variant="caption" color="mutedForeground">Turma 2</Typography>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title="Aplicar Filtros"
            onPress={() => {
              onApplyFilters({ status: 'active' });
              onClose();
            }}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: tokens.colors.background,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing['2xl'],
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.colors.border,
    alignSelf: 'center',
    marginBottom: tokens.spacing.lg,
  },
  title: {
    marginBottom: tokens.spacing.lg,
  },
  filterSection: {
    marginBottom: tokens.spacing.lg,
  },
  sectionTitle: {
    marginBottom: tokens.spacing.sm,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  optionChip: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.card,
  },
  optionChipActive: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  footer: {
    marginTop: tokens.spacing.md,
    paddingTop: tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
    flexDirection: 'row',
  },
});
