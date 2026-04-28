import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LegendList } from '@legendapp/list';
import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { tokens } from '../../theme/tokens';
import { FilterModal } from '../../components/admin/FilterModal';
import { Button } from '../../components/ui/Button';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../stores/useAuthStore';
import { supabase } from '../../lib/supabase';

type AlunaItem = {
  id: string;
  name: string;
  email: string;
  status: 'ativo' | 'inativo';
};

export function DashAdminScreen() {
  const [data, setData] = useState<AlunaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterVisible, setFilterVisible] = useState(false);
  
  const navigation = useNavigation<any>();
  const { startImpersonation } = useAuthStore();

  const fetchUsers = async () => {
    setLoading(true);
    // Busca perfis que são alunas (tipo_acesso = 1 ou nulo)
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, tipo_acesso')
      .neq('tipo_acesso', 2)
      .order('full_name', { ascending: true });

    if (!error && profiles) {
      const mapped = profiles.map(p => ({
        id: p.id,
        name: p.full_name || 'Sem Nome',
        email: p.email || '',
        status: 'ativo' as const // simplificação por enquanto
      }));
      setData(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApplyFilters = (filters: Record<string, string>) => {
    console.log('Aplicando filtros:', filters);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Typography variant="h2">Painel Admin</Typography>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button variant="secondary" size="sm" title="Filtros" onPress={() => setFilterVisible(true)} />
            <Button variant="outline" size="sm" title="Sair" onPress={handleLogout} />
          </View>
        </View>
        <Typography variant="body" color="mutedForeground">
          Total de {data.length} alunas cadastradas.
        </Typography>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      ) : (
        <LegendList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={120}
          contentContainerStyle={styles.listContent}
        />
      )}

      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
