import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { tokens } from '../../theme/tokens';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../stores/useAuthStore';
import { supabase } from '../../lib/supabase';

export function CrmAlunoScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { startImpersonation } = useAuthStore();
  
  const alunaId = route.params?.id;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const [checklist, setChecklist] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      if (!alunaId) return;

      const [profRes, initRes, chkRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', alunaId).single(),
        supabase.from('onboarding_initial').select('measurements, symptoms').eq('user_id', alunaId).maybeSingle(),
        supabase.from('aluna_checklist').select('*').eq('user_id', alunaId).maybeSingle(),
      ]);

      if (profRes.data) setProfile(profRes.data);
      if (initRes.data) setInitialData(initRes.data);
      if (chkRes.data) setChecklist(chkRes.data);
      
      setLoading(false);
    }
    fetchData();
  }, [alunaId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Button variant="ghost" title="← Voltar" onPress={() => navigation.goBack()} style={styles.backButton} />
          <Typography variant="h3">Aluna não encontrada.</Typography>
        </View>
      </SafeAreaView>
    );
  }

  const alunaName = profile.full_name || 'Sem Nome';

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
          Email: {profile.email}
        </Typography>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Typography variant="h3" style={styles.cardTitle}>Ações</Typography>
          <Button 
            title="Acessar como Aluna (Impersonation)" 
            onPress={() => startImpersonation({ 
              id: alunaId, 
              name: alunaName, 
              email: profile.email || '', 
              onboardingComplete: profile.onboarding_complete 
            })}
          />
        </Card>

        <Card style={styles.card}>
          <Typography variant="h3" style={styles.cardTitle}>Dados Clínicos (Iniciais)</Typography>
          <View style={styles.dataRow}>
            <Typography variant="body" weight="semibold">Peso Inicial:</Typography>
            <Typography variant="body">
              {initialData?.measurements?.peso ? `${initialData.measurements.peso} kg` : 'Não registrado'}
            </Typography>
          </View>
          <View style={styles.dataRow}>
            <Typography variant="body" weight="semibold">Objetivos:</Typography>
            <Typography variant="body">
              {profile.objetivos || 'Não registrado'}
            </Typography>
          </View>
        </Card>

        <Card style={styles.card}>
          <Typography variant="h3" style={styles.cardTitle}>Checklist</Typography>
          <View style={styles.dataRow}>
            <Typography variant="body" weight="semibold">Endereço:</Typography>
            <Typography variant="body" color={checklist?.preencheu_endereco ? 'success' : 'destructive'}>
              {checklist?.preencheu_endereco ? 'Preenchido' : 'Pendente'}
            </Typography>
          </View>
          <View style={styles.dataRow}>
            <Typography variant="body" weight="semibold">Fotos:</Typography>
            <Typography variant="body" color={checklist?.enviou_fotos ? 'success' : 'destructive'}>
              {checklist?.enviou_fotos ? 'Enviadas' : 'Pendente'}
            </Typography>
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
    padding: tokens.spacing.md,
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
