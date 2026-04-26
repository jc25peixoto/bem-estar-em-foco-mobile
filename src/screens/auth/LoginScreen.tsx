import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { tokens } from '../../theme/tokens';
import { supabase } from '../../lib/supabase';

export function LoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos obrigatórios', 'Por favor, preencha e-mail e senha.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert('Erro ao entrar', error.message);
    }
    // Sucesso: RootNavigator detecta a sessão e navega automaticamente
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
          {/* Header */}
          <View style={styles.header}>
            <Typography variant="h1" style={styles.logo}>🌿</Typography>
            <Typography variant="h2" style={styles.title}>Bem-Estar em Foco</Typography>
            <Typography variant="body" color="mutedForeground" style={styles.subtitle}>
              Faça login para acessar sua conta
            </Typography>
          </View>

          {/* Formulário */}
          <View style={styles.form}>
            <Input
              label="E-mail"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Input
              label="Senha"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            <Button
              title={loading ? 'Entrando...' : 'Entrar'}
              onPress={handleLogin}
              disabled={loading}
              style={styles.loginBtn}
            />

            <Button
              variant="ghost"
              title="Esqueci minha senha"
              onPress={() => navigation.navigate('ResetPassword')}
              style={styles.forgotBtn}
            />
          </View>

          {/* Rodapé */}
          <View style={styles.footer}>
            <Typography variant="body" color="mutedForeground">
              Não tem uma conta?{' '}
            </Typography>
            <Button
              variant="ghost"
              title="Criar conta"
              onPress={() => navigation.navigate('Signup')}
              style={styles.signupBtn}
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
    flexGrow: 1,
    padding: tokens.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
  },
  logo: {
    fontSize: 56,
    marginBottom: tokens.spacing.sm,
  },
  title: {
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    marginBottom: tokens.spacing.lg,
  },
  loginBtn: {
    marginTop: tokens.spacing.md,
  },
  forgotBtn: {
    marginTop: tokens.spacing.xs,
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupBtn: {
    paddingHorizontal: 0,
    height: 'auto' as any,
  },
});
