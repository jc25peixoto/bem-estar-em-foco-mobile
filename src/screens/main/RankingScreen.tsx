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

      try {
        // Usar a mesma RPC SECURITY DEFINER do projeto web
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_gamification_users');
        
        if (rpcError || !rpcData) {
          setLoading(false);
          return;
        }

        // Descobrir turma_id da aluna logada
        const myEntry = rpcData.find((r: any) => r.id === currentUser.id);
        const myTurmaId = myEntry?.turma_id;

        if (!myTurmaId) {
          setLoading(false);
          return;
        }

        // Filtrar alunas da mesma turma (excluindo admins)
        const sameTurma = rpcData.filter((r: any) => r.turma_id === myTurmaId && !r.is_admin);

        // Calcular ranking
        const ranking: RankItem[] = sameTurma.map((r: any) => {
          const initW = Number(r.initial_weight) || 0;
          const lastW = Number(r.latest_weight) || initW;
          let percent = 0;
          if (initW > 0 && lastW > 0) {
            percent = ((initW - lastW) / initW) * 100;
          }

          // Opt-out de nome (mesma lógica do web buildLeaderboard)
          let displayName = r.name || 'Aluna';
          if (!r.ranking_visible && r.id !== currentUser.id) {
            const parts = displayName.trim().split(" ");
            if (parts.length === 1) {
              displayName = parts[0].substring(0, 2).toUpperCase() + ".";
            } else {
              displayName = parts[0].substring(0, 1).toUpperCase() + ". " + parts[parts.length - 1].substring(0, 1).toUpperCase() + ".";
            }
          }

          return {
            id: r.id,
            name: displayName,
            weightLossPercent: percent,
            position: 0,
            isCurrentUser: r.id === currentUser.id,
          };
        });

        // Ordenar por % de perda (maior primeiro)
        ranking.sort((a, b) => b.weightLossPercent - a.weightLossPercent);
        ranking.forEach((r, idx) => r.position = idx + 1);

        // Limitar a 20 e incluir usuário logado se estiver fora dos 20
        let finalRanking = ranking.slice(0, 20);
        const myRankIndex = ranking.findIndex(r => r.isCurrentUser);
        if (myRankIndex >= 20) {
          finalRanking.push(ranking[myRankIndex]);
        }

        setData(finalRanking);
      } catch (e) {
        console.log('Error fetching ranking', e);
      }
      
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
