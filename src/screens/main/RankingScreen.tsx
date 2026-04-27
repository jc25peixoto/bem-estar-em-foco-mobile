import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LegendList } from '@legendapp/list';
import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { tokens } from '../../theme/tokens';
import { useEffectiveUser } from '../../stores/useAuthStore';
import { supabase } from '../../lib/supabase';

type RankItem = {
  id: string;
  name: string;
  weightLossPercent: number;
  position: number;
  isCurrentUser: boolean;
};

function RankRow({ item }: { item: RankItem }) {
  return (
    <Card variant="outline" style={[styles.rowCard, item.isCurrentUser && styles.currentUserRow]}>
      <View style={styles.rowContent}>
        <View style={[styles.positionBadge, item.position <= 3 && styles.topPositionBadge]}>
          <Typography variant="caption" weight="bold" color={item.position <= 3 ? "primaryForeground" : "foreground"}>
            {item.position}
          </Typography>
        </View>
        
        <View style={styles.userInfo}>
          <Typography variant="body" weight="semibold">
            {item.name} {item.isCurrentUser ? "(Você)" : ""}
          </Typography>
        </View>

        <Typography variant="h4" color={item.weightLossPercent > 0 ? "success" : "foreground"}>
          {item.weightLossPercent > 0 ? "-" : ""}{Math.abs(item.weightLossPercent).toFixed(1)}%
        </Typography>
      </View>
    </Card>
  );
}

export function RankingScreen() {
  const currentUser = useEffectiveUser();
  const [data, setData] = useState<RankItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRanking() {
      if (!currentUser?.id) return;
      setLoading(true);

      // 1. Descobrir a turma do usuário logado
      const { data: myProfile } = await supabase.from('profiles').select('turma_id').eq('id', currentUser.id).single();
      const turmaId = myProfile?.turma_id;

      if (!turmaId) {
        setLoading(false);
        return;
      }

      // 2. Buscar alunas da mesma turma
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, ranking_visible')
        .eq('turma_id', turmaId)
        .neq('tipo_acesso', 2);

      if (!profiles || profiles.length === 0) {
        setLoading(false);
        return;
      }

      const userIds = profiles.map(p => p.id);

      // 3. Buscar dados de peso (onboarding e weekly)
      const [initRes, weeksRes] = await Promise.all([
        supabase.from('onboarding_initial').select('user_id, measurements').in('user_id', userIds),
        supabase.from('weekly_records').select('user_id, measurements, week').in('user_id', userIds).order('week', { ascending: true })
      ]);

      const initials = initRes.data || [];
      const weeks = weeksRes.data || [];

      // 4. Calcular %
      const ranking: RankItem[] = [];

      for (const profile of profiles) {
        const myInitial = initials.find(i => i.user_id === profile.id);
        const myWeeks = weeks.filter(w => w.user_id === profile.id);

        const initialWeight = myInitial?.measurements?.peso || 0;
        
        if (initialWeight > 0 && myWeeks.length > 0) {
          const lastWeekWeight = myWeeks[myWeeks.length - 1].measurements?.peso || initialWeight;
          const lostKg = initialWeight - lastWeekWeight;
          const percent = (lostKg / initialWeight) * 100;

          let displayName = profile.full_name || 'Aluna';
          
          // Lógica de Opt-out do Ranking (se não for a própria pessoa)
          if (!profile.ranking_visible && profile.id !== currentUser.id) {
            const parts = displayName.trim().split(" ");
            if (parts.length === 1) {
              displayName = parts[0].substring(0, 2).toUpperCase() + ".";
            } else {
              displayName = parts[0].substring(0, 1).toUpperCase() + ". " + parts[parts.length - 1].substring(0, 1).toUpperCase() + ".";
            }
          }

          ranking.push({
            id: profile.id,
            name: displayName,
            weightLossPercent: percent,
            position: 0,
            isCurrentUser: profile.id === currentUser.id,
          });
        }
      }

      // 5. Ordenar
      ranking.sort((a, b) => b.weightLossPercent - a.weightLossPercent);
      ranking.forEach((r, idx) => r.position = idx + 1);

      setData(ranking);
      setLoading(false);
    }

    fetchRanking();
  }, [currentUser?.id]);

  const renderItem = useCallback(({ item }: { item: RankItem }) => {
    return <RankRow item={item} />;
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Typography variant="h2">Ranking 🏆</Typography>
        <Typography variant="body" color="mutedForeground">
          Veja quem está no topo da turma nesta semana!
        </Typography>
      </View>
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      ) : data.length === 0 ? (
        <View style={styles.center}>
          <Typography variant="body" color="mutedForeground">Ainda não há dados suficientes para o ranking da sua turma.</Typography>
        </View>
      ) : (
        <LegendList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item: RankItem) => item.id}
          estimatedItemSize={80}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  listContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
  },
  rowCard: {
    marginBottom: tokens.spacing.sm,
    padding: tokens.spacing.sm,
  },
  currentUserRow: {
    borderColor: tokens.colors.primary,
    borderWidth: 2,
    backgroundColor: tokens.colors.primaryMuted,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: tokens.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
  },
  topPositionBadge: {
    backgroundColor: tokens.colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  }
});
