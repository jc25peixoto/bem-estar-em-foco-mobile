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

export function ResetPasswordScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Campo obrigatório', 'Digite seu e-mail.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      Alert.alert('Erro', error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {sent ? (
            <View style={styles.header}>
              <Typography variant="h2">E-mail enviado! 📬</Typography>
              <Typography variant="body" color="mutedForeground" style={{ marginTop: tokens.spacing.sm }}>
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </Typography>
              <Button title="Voltar ao login" onPress={() => navigation.navigate('Login')} style={{ marginTop: tokens.spacing.xl }} />
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Typography variant="h2">Esqueci a senha</Typography>
                <Typography variant="body" color="mutedForeground">
                  Enviaremos um link para você redefinir sua senha.
                </Typography>
              </View>
              <Input label="E-mail" placeholder="seu@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <Button title={loading ? 'Enviando...' : 'Enviar link'} onPress={handleReset} disabled={loading} style={styles.btn} />
              <Button variant="ghost" title="Voltar" onPress={() => navigation.goBack()} />
            </>
          )}
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
