import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { tokens } from '../../theme/tokens';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../stores/useAuthStore';

export function CrmAlunoScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { startImpersonation } = useAuthStore();
  
  // Mock data based on ID from route
  const alunaId = route.params?.id || 'Desconhecido';
  const alunaName = `Aluna ${alunaId.replace('aluna-', '')}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Button 
          variant="ghost" 
          title="← Voltar" 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        />
        <Typography variant="h2">{alunaName}</Typography>
        <Typography variant="body" color="mutedForeground">
          ID: {alunaId}
        </Typography>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Typography variant="h3" style={styles.cardTitle}>Ações</Typography>
          <Button 
            title="Acessar como Aluna (Impersonation)" 
            onPress={() => startImpersonation({ id: alunaId, name: alunaName, email: `${alunaId}@email.com`, onboardingComplete: true })}
          />
        </Card>

        <Card style={styles.card}>
          <Typography variant="h3" style={styles.cardTitle}>Dados Clínicos</Typography>
          <View style={styles.dataRow}>
            <Typography variant="body" weight="semibold">Peso Inicial:</Typography>
            <Typography variant="body">75kg</Typography>
          </View>
          <View style={styles.dataRow}>
            <Typography variant="body" weight="semibold">Objetivo:</Typography>
            <Typography variant="body">65kg</Typography>
          </View>
        </Card>

        <Card style={styles.card}>
          <Typography variant="h3" style={styles.cardTitle}>Checklist</Typography>
          <View style={styles.dataRow}>
            <Typography variant="body" weight="semibold">Endereço:</Typography>
            <Typography variant="body" color="success">Preenchido</Typography>
          </View>
          <View style={styles.dataRow}>
            <Typography variant="body" weight="semibold">Fotos:</Typography>
            <Typography variant="body" color="destructive">Pendente</Typography>
          </View>
        </Card>
      </ScrollView>
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
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: -tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
  },
  card: {
    marginBottom: tokens.spacing.lg,
  },
  cardTitle: {
    marginBottom: tokens.spacing.md,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
});
