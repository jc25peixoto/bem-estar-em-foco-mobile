import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { tokens } from '../../theme/tokens';

export function MealsScreen() {
  const [mealName, setMealName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    // mock submission
    setMealName('');
    setDescription('');
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
              title="Salvar Registro" 
              onPress={handleSubmit}
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
