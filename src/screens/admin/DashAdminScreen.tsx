import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { tokens } from '../../theme/tokens';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LegendList } from '@legendapp/list';
import BottomSheet from '@gorhom/bottom-sheet';
import { FilterBottomSheet } from '../../components/admin/FilterBottomSheet';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../stores/useAuthStore';

// Tipagem básica para a lista
type AlunaItem = {
  id: string;
  name: string;
  email: string;
  status: 'ativo' | 'inativo';
};

// Gerando dados falsos grandes para testar a performance do LegendList
const mockAlunas: AlunaItem[] = Array.from({ length: 500 }).map((_, i) => ({
  id: `aluna-${i}`,
  name: `Aluna ${i + 1}`,
  email: `aluna${i + 1}@email.com`,
  status: Math.random() > 0.2 ? 'ativo' : 'inativo',
}));

export function DashAdminScreen() {
  const [data] = useState(mockAlunas);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const navigation = useNavigation<any>();
  const { startImpersonation } = useAuthStore();

  const handleOpenFilter = () => {
    bottomSheetRef.current?.expand();
  };

  const handleCloseFilter = () => {
    bottomSheetRef.current?.close();
  };

  const handleApplyFilters = (filters: Record<string, string>) => {
    console.log('Aplicando filtros:', filters);
    // Aqui viria a lógica de filtro
  };

  const renderItem = useCallback(({ item }: { item: AlunaItem }) => {
    return (
      <TouchableOpacity onPress={() => navigation.navigate('CrmAluno', { id: item.id })}>
        <Card variant="outline" style={styles.rowCard}>
          <View style={styles.rowHeader}>
            <Typography variant="body" weight="semibold">{item.name}</Typography>
            <View style={[styles.statusBadge, item.status === 'ativo' ? styles.statusAtivo : styles.statusInativo]}>
              <Typography variant="caption" color={item.status === 'ativo' ? 'success' : 'mutedForeground'} style={{ fontSize: 10 }}>
                {item.status.toUpperCase()}
              </Typography>
            </View>
          </View>
          <Typography variant="caption" color="mutedForeground">{item.email}</Typography>
          
          <Button 
            variant="outline" 
            size="sm" 
            title="Acessar como Aluna" 
            style={styles.impersonateBtn}
            onPress={() => startImpersonation({ id: item.id, name: item.name, email: item.email, onboardingComplete: true })}
          />
        </Card>
      </TouchableOpacity>
    );
  }, [navigation, startImpersonation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Typography variant="h2">Painel Admin</Typography>
          <Button variant="secondary" size="sm" title="Filtros" onPress={handleOpenFilter} />
        </View>
        <Typography variant="body" color="mutedForeground">
          Total de {data.length} alunas cadastradas.
        </Typography>
      </View>

      <LegendList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={120}
        contentContainerStyle={styles.listContent}
      />

      <FilterBottomSheet 
        ref={bottomSheetRef} 
        onClose={handleCloseFilter} 
        onApplyFilters={handleApplyFilters} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  header: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  listContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
  },
  rowCard: {
    marginBottom: tokens.spacing.sm,
    padding: tokens.spacing.md,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
  },
  statusAtivo: {
    backgroundColor: tokens.colors.successMuted,
    borderColor: tokens.colors.success,
  },
  statusInativo: {
    backgroundColor: tokens.colors.muted,
    borderColor: tokens.colors.border,
  },
  impersonateBtn: {
    marginTop: tokens.spacing.md,
  },
});
