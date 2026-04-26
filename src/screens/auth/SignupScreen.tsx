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

export function SignupScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Erro ao criar conta', error.message);
    } else {
      Alert.alert('Conta criada!', 'Verifique seu e-mail para confirmar o cadastro.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Typography variant="h2">Criar conta</Typography>
            <Typography variant="body" color="mutedForeground">Preencha seus dados para começar.</Typography>
          </View>

          <Input label="Nome completo" placeholder="Seu nome" value={name} onChangeText={setName} autoCapitalize="words" />
          <Input label="E-mail" placeholder="seu@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Senha" placeholder="Mínimo 6 caracteres" value={password} onChangeText={setPassword} secureTextEntry />

          <Button title={loading ? 'Criando...' : 'Criar conta'} onPress={handleSignup} disabled={loading} style={styles.btn} />
          <Button variant="ghost" title="Já tenho conta" onPress={() => navigation.navigate('Login')} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: tokens.colors.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: tokens.spacing.lg, justifyContent: 'center' },
  header: { marginBottom: tokens.spacing.xl },
  btn: { marginTop: tokens.spacing.md, marginBottom: tokens.spacing.sm },
});
