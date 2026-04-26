import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';
import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { tokens } from '../../theme/tokens';
import { useEffectiveUser } from '../../stores/useAuthStore';

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
          <View style={styles.chartContainer}>
            <LineChart
              data={mockChartData}
              color="#d63f52" // aproximação do primary
              thickness={3}
              dataPointsColor="#d63f52"
              hideRules
              yAxisColor="transparent"
              xAxisColor="transparent"
              yAxisTextStyle={{ color: '#888' }}
              xAxisLabelTextStyle={{ color: '#888', fontSize: 10 }}
              spacing={50}
              initialSpacing={10}
            />
          </View>
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
  chartContainer: {
    alignItems: 'center',
    marginLeft: -20, // Ajuste fino pro chart
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
