import React, { forwardRef, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Typography } from '../ui/Typography';
import { tokens } from '../../theme/tokens';
import { Button } from '../ui/Button';

export interface FilterBottomSheetProps {
  onApplyFilters: (filters: Record<string, string>) => void;
  onClose: () => void;
}

export const FilterBottomSheet = forwardRef<BottomSheet, FilterBottomSheetProps>(
  ({ onApplyFilters, onClose }, ref) => {
    // Definimos os pontos de parada (snap points) do Bottom Sheet
    const snapPoints = useMemo(() => ['50%', '75%'], []);

    // Função de renderização para a sobreposição escura (backdrop)
    const renderBackdrop = (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1} // Inicia fechado
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.container}
        handleIndicatorStyle={styles.indicator}
      >
        <View style={styles.content}>
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
      </BottomSheet>
    );
  }
);

FilterBottomSheet.displayName = 'FilterBottomSheet';

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.background,
  },
  indicator: {
    backgroundColor: tokens.colors.border,
    width: 40,
  },
  content: {
    flex: 1,
    padding: tokens.spacing.lg,
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
    marginTop: 'auto',
    paddingTop: tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
});
