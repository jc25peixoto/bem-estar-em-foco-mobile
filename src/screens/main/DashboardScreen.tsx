import React from 'react';
import { ScrollView, View, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { tokens } from '../../theme/tokens';
import { useEffectiveUser } from '../../stores/useAuthStore';
import { SimpleLineChart } from '../../components/ui/SimpleLineChart';

const { width } = Dimensions.get('window');

export function DashboardScreen() {
  const user = useEffectiveUser();

  const mockChartData = [
    { value: 78, label: 'Sem 1' },
    { value: 76.5, label: 'Sem 2' },
    { value: 75.2, label: 'Sem 3' },
    { value: 74.0, label: 'Sem 4' },
    { value: 72.8, label: 'Sem 5' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Typography variant="h2">Olá, {user?.name || 'Aluna'}! 👋</Typography>
          <Typography variant="body" color="mutedForeground">
            Aqui está o seu progresso até o momento.
          </Typography>
        </View>

        <Card style={styles.card}>
          <Typography variant="h4" style={styles.cardTitle}>Evolução de Peso</Typography>
          <SimpleLineChart
            data={mockChartData}
            color={tokens.colors.primary}
            width={width - tokens.spacing.lg * 4}
            height={160}
          />
        </Card>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard} variant="soft">
            <Typography variant="caption" color="mutedForeground">Semanas</Typography>
            <Typography variant="h2" color="primary">5</Typography>
          </Card>
          <Card style={styles.statCard} variant="soft">
            <Typography variant="caption" color="mutedForeground">Refeições</Typography>
            <Typography variant="h2" color="primary">42</Typography>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  scrollContent: {
    padding: tokens.spacing.lg,
  },
  header: {
    marginBottom: tokens.spacing.xl,
    marginTop: tokens.spacing.md,
  },
  card: {
    marginBottom: tokens.spacing.lg,
  },
  cardTitle: {
    marginBottom: tokens.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
});
