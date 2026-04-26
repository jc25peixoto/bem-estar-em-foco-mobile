import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LegendList } from '@legendapp/list';
import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { tokens } from '../../theme/tokens';

type RankItem = {
  id: string;
  name: string;
  points: number;
  position: number;
  avatarUrl?: string;
};

const mockRanking: RankItem[] = Array.from({ length: 50 }).map((_, i) => ({
  id: `user-${i}`,
  name: `Aluna ${i + 1}`,
  points: 1000 - i * 15,
  position: i + 1,
  avatarUrl: `https://i.pravatar.cc/100?u=${i}`,
}));

function RankRow({ item }: { item: RankItem }) {
  return (
    <Card variant="outline" style={styles.rowCard}>
      <View style={styles.rowContent}>
        <View style={styles.positionBadge}>
          <Typography variant="caption" weight="bold" color="primaryForeground">
            {item.position}
          </Typography>
        </View>
        
        <Image 
          source={{ uri: item.avatarUrl }} 
          style={styles.avatar} 
        />
        
        <View style={styles.userInfo}>
          <Typography variant="body" weight="semibold">{item.name}</Typography>
        </View>

        <Typography variant="h4" color="primary">{item.points} pts</Typography>
      </View>
    </Card>
  );
}

export function RankingScreen() {
  const [data] = useState(mockRanking);

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
      
      <LegendList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item: RankItem) => item.id}
        estimatedItemSize={80}
        contentContainerStyle={styles.listContent}
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
  listContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
  },
  rowCard: {
    marginBottom: tokens.spacing.sm,
    padding: tokens.spacing.sm,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: tokens.spacing.md,
    backgroundColor: tokens.colors.border,
  },
  userInfo: {
    flex: 1,
  },
});
