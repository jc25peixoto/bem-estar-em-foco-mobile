import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { tokens } from '../../theme/tokens';
import { useEffectiveUser, useAuthStore } from '../../stores/useAuthStore';
import { supabase } from '../../lib/supabase';

export function ProfileScreen() {
  const currentUser = useEffectiveUser();
  const stopImpersonation = useAuthStore(s => s.stopImpersonation);
  const isImpersonating = useAuthStore(s => s.isImpersonating);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      "Sair",
      "Tem certeza que deseja sair do aplicativo?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sair", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            if (isImpersonating) {
              stopImpersonation();
            }
            const { error } = await supabase.auth.signOut();
            setLoading(false);
            if (error) {
              Alert.alert('Erro ao sair', error.message);
            }
          }
        }
      ]
    );
  };

  if (!currentUser) {
    return (
      <View style={styles.center}>
        <Typography variant="body">Usuário não encontrado.</Typography>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Typography variant="h2">Meu Perfil</Typography>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="outline" style={styles.card}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Typography variant="h2" color="primaryForeground">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '?'}
              </Typography>
            </View>
            <View style={styles.userInfo}>
              <Typography variant="h4">{currentUser.name}</Typography>
              <Typography variant="body" color="mutedForeground">{currentUser.email}</Typography>
            </View>
          </View>
        </Card>

        <View style={styles.actions}>
          {isImpersonating && (
            <Button
              title="Voltar ao Painel Admin"
              variant="outline"
              onPress={() => stopImpersonation()}
              style={{ marginBottom: tokens.spacing.md }}
            />
          )}
          
          <Button
            title="Sair (Logout)"
            variant="destructive"
            onPress={handleLogout}
            loading={loading}
          />
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
  header: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
  },
  content: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
  },
  card: {
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  actions: {
    marginTop: tokens.spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
