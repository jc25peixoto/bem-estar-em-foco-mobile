import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { tokens } from '../../theme/tokens';
import { useEffectiveUser } from '../../stores/useAuthStore';
import { supabase } from '../../lib/supabase';

export function MealsScreen() {
  const user = useEffectiveUser();
  const [mealName, setMealName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!mealName.trim()) {
      Alert.alert('Erro', 'Por favor, insira o nome da refeição.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase.from('meal_records').insert({
        user_id: user.id,
        record_date: today,
        slot_index: Math.floor(Math.random() * 1000), // Random para permitir múltiplas no mesmo dia se não tivermos slot control
        meal_type: mealName,
        description: description,
      });

      if (error) throw error;

      Alert.alert('Sucesso', 'Refeição registrada com sucesso! 🥗');
      setMealName('');
      setDescription('');
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível registrar a refeição.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Typography variant="h2">Registrar Refeição 🥗</Typography>
            <Typography variant="body" color="mutedForeground">
              O que você comeu hoje?
            </Typography>
          </View>

          <View style={styles.form}>
            <Input 
              label="Nome da Refeição"
              placeholder="Ex: Almoço"
              value={mealName}
              onChangeText={setMealName}
            />
            
            <Input 
              label="Descrição (Opcional)"
              placeholder="Ex: Arroz, feijão e salada..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={{ height: 100, textAlignVertical: 'top', paddingTop: tokens.spacing.sm }}
            />

            <Button 
              title={saving ? "Salvando..." : "Salvar Registro"} 
              onPress={handleSubmit}
              disabled={saving}
              style={styles.submitBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: tokens.spacing.lg,
    flexGrow: 1,
  },
  header: {
    marginBottom: tokens.spacing.xl,
    marginTop: tokens.spacing.md,
  },
  form: {
    flex: 1,
  },
  submitBtn: {
    marginTop: tokens.spacing.xl,
  },
});
