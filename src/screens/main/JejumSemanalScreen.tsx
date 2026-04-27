import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { tokens } from '../../theme/tokens';
import { useEffectiveUser } from '../../stores/useAuthStore';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';

export function JejumSemanalScreen() {
  const user = useEffectiveUser();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [fastingHours, setFastingHours] = useState<number>(16);

  const handleSubmit = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('fasting_records').insert({
        user_id: user.id,
        record_date: new Date().toISOString().split('T')[0],
        fasting_hours: fastingHours,
        status: 'completed',
      });

      if (error) throw error;

      Alert.alert('Sucesso', 'Jejum registrado com sucesso! ⏱️', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível salvar o registro de jejum.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Button 
            variant="ghost" 
            title="← Voltar" 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          />
          <Typography variant="h2">Meu Jejum ⏱️</Typography>
          <Typography variant="body" color="mutedForeground">
            Registre seu tempo de jejum de hoje.
          </Typography>
        </View>

        <Card style={styles.card}>
          <Typography variant="h4" style={styles.cardTitle}>Horas de Jejum</Typography>
          <View style={styles.hoursContainer}>
            <Button 
              variant="outline" 
              title="-" 
              onPress={() => setFastingHours(Math.max(0, fastingHours - 1))} 
              style={styles.hourBtn}
            />
            <Typography variant="h1" style={styles.hoursText}>{fastingHours}h</Typography>
            <Button 
              variant="outline" 
              title="+" 
              onPress={() => setFastingHours(fastingHours + 1)} 
              style={styles.hourBtn}
            />
          </View>
          <Typography variant="caption" color="mutedForeground" style={{ textAlign: 'center', marginTop: tokens.spacing.md }}>
            Meta sugerida: 16 horas
          </Typography>
        </Card>

        <Button 
          title={loading ? "Salvando..." : "Registrar Jejum"} 
          onPress={handleSubmit}
          disabled={loading}
          style={styles.submitBtn}
        />
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
  },
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: -tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },
  card: {
    marginBottom: tokens.spacing.lg,
    padding: tokens.spacing.xl,
    alignItems: 'center',
  },
  cardTitle: {
    marginBottom: tokens.spacing.xl,
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xl,
  },
  hourBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 0,
  },
  hoursText: {
    fontSize: 48,
    color: tokens.colors.primary,
  },
  submitBtn: {
    marginTop: tokens.spacing.lg,
  },
});
