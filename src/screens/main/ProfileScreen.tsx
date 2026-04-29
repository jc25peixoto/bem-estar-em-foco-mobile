import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TextInput, Switch, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { tokens } from '../../theme/tokens';
import { useEffectiveUser, useAuthStore } from '../../stores/useAuthStore';
import { supabase } from '../../lib/supabase';

function maskPhone(value: string | undefined): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function unmaskPhone(value: string): string {
  return value.replace(/\D/g, '');
}

function calculateIMC(peso: number, alturaCm: number): number | null {
  if (!alturaCm) return null;
  const alturaMetros = alturaCm / 100;
  return parseFloat((peso / (alturaMetros * alturaMetros)).toFixed(1));
}

function maskDate(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

function unmaskDate(value: string): string {
  if (!value) return '';
  // Converte de DD/MM/YYYY para YYYY-MM-DD
  const parts = value.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return value;
}

function formatDateForEdit(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

export function ProfileScreen() {
  const currentUser = useEffectiveUser();
  const stopImpersonation = useAuthStore(s => s.stopImpersonation);
  const isImpersonating = useAuthStore(s => s.isImpersonating);
  const updateCurrentUser = useAuthStore(s => s.updateCurrentUser);

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);

  const [formData, setFormData] = useState({
    phone: '',
    birthDate: '',
    city: '',
    state: '',
    occupation: '',
    goals: '',
    rankingVisible: true,
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        phone: maskPhone(currentUser.phone) || '',
        birthDate: formatDateForEdit(currentUser.birthDate) || '',
        city: currentUser.city || '',
        state: currentUser.state || '',
        occupation: currentUser.occupation || '',
        goals: currentUser.goals || '',
        rankingVisible: currentUser.rankingVisible ?? true,
      });
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!currentUser?.id) return;
      try {
        setLoadingInitial(true);
        const { data, error } = await supabase
          .from('onboarding_initial')
          .select('measurements, symptoms')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (data && !error) {
          setInitialData(data);
          updateCurrentUser({ initialData: data });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchInitialData();
  }, [currentUser?.id]);

  const handleSave = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const dataToSave = {
        telefone: unmaskPhone(formData.phone),
        data_nascimento: unmaskDate(formData.birthDate),
        cidade: formData.city,
        estado: formData.state,
        profissao: formData.occupation,
        objetivos: formData.goals,
        ranking_visible: formData.rankingVisible,
      };

      const { error } = await supabase
        .from('profiles')
        .update(dataToSave)
        .eq('id', currentUser.id);

      if (error) throw error;

      updateCurrentUser({
        phone: dataToSave.telefone,
        birthDate: dataToSave.data_nascimento,
        city: dataToSave.cidade,
        state: dataToSave.estado,
        occupation: dataToSave.profissao,
        goals: dataToSave.objetivos,
        rankingVisible: dataToSave.ranking_visible,
      });

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (e: any) {
      Alert.alert('Erro', 'Erro ao atualizar o perfil: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

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

  const measurements = initialData?.measurements;
  const symptoms = initialData?.symptoms;

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Não informado';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Typography variant="h2">Meu Perfil</Typography>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Dados Pessoais */}
        <Card variant="outline" style={styles.card}>
          <View style={styles.cardHeader}>
            <Typography variant="h4">Dados Pessoais</Typography>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Typography color="primary" weight="bold">Editar</Typography>
              </TouchableOpacity>
            )}
          </View>

          {isEditing ? (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Typography variant="caption" color="mutedForeground" style={styles.label}>Telefone / WhatsApp</Typography>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) => setFormData(p => ({ ...p, phone: maskPhone(text) }))}
                  placeholder="(11) 99999-9999"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Typography variant="caption" color="mutedForeground" style={styles.label}>Data de Nascimento</Typography>
                <TextInput
                  style={styles.input}
                  value={formData.birthDate}
                  onChangeText={(text) => setFormData(p => ({ ...p, birthDate: maskDate(text) }))}
                  placeholder="DD/MM/YYYY"
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 2, marginRight: tokens.spacing.sm }]}>
                  <Typography variant="caption" color="mutedForeground" style={styles.label}>Cidade</Typography>
                  <TextInput
                    style={styles.input}
                    value={formData.city}
                    onChangeText={(text) => setFormData(p => ({ ...p, city: text }))}
                    placeholder="Sua cidade"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Typography variant="caption" color="mutedForeground" style={styles.label}>Estado</Typography>
                  <TextInput
                    style={styles.input}
                    value={formData.state}
                    onChangeText={(text) => setFormData(p => ({ ...p, state: text.toUpperCase() }))}
                    placeholder="UF"
                    maxLength={2}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Typography variant="caption" color="mutedForeground" style={styles.label}>Profissão / Ocupação</Typography>
                <TextInput
                  style={styles.input}
                  value={formData.occupation}
                  onChangeText={(text) => setFormData(p => ({ ...p, occupation: text }))}
                  placeholder="O que você faz?"
                />
              </View>

              <View style={styles.inputGroup}>
                <Typography variant="caption" color="mutedForeground" style={styles.label}>Objetivos Principais</Typography>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.goals}
                  onChangeText={(text) => setFormData(p => ({ ...p, goals: text }))}
                  placeholder="Quais são suas metas?"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchText}>
                  <Typography weight="bold">Exibir Nome nos Rankings</Typography>
                  <Typography variant="caption" color="mutedForeground">Se desativado, apenas iniciais aparecerão.</Typography>
                </View>
                <Switch
                  value={formData.rankingVisible}
                  onValueChange={(val) => setFormData(p => ({ ...p, rankingVisible: val }))}
                  trackColor={{ false: '#ccc', true: tokens.colors.primary }}
                />
              </View>

              <View style={styles.formActions}>
                <Button 
                  title="Cancelar" 
                  variant="outline" 
                  onPress={() => {
                    setIsEditing(false);
                    setFormData({
                      phone: maskPhone(currentUser.phone) || '',
                      birthDate: formatDateForEdit(currentUser.birthDate) || '',
                      city: currentUser.city || '',
                      state: currentUser.state || '',
                      occupation: currentUser.occupation || '',
                      goals: currentUser.goals || '',
                      rankingVisible: currentUser.rankingVisible ?? true,
                    });
                  }} 
                  style={{ flex: 1, marginRight: tokens.spacing.sm }} 
                />
                <Button 
                  title="Salvar" 
                  onPress={handleSave} 
                  loading={loading} 
                  style={{ flex: 1 }} 
                />
              </View>

            </View>
          ) : (
            <View style={styles.viewMode}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Typography variant="h2" color="primaryForeground">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '?'}
                  </Typography>
                </View>
                <View style={styles.userInfo}>
                  <Typography variant="h3">{currentUser.name}</Typography>
                  <Typography variant="body" color="mutedForeground">{currentUser.email}</Typography>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Typography variant="caption" color="mutedForeground">Telefone</Typography>
                  <Typography weight="semibold">{maskPhone(currentUser.phone) || 'Não informado'}</Typography>
                </View>
                <View style={styles.infoItem}>
                  <Typography variant="caption" color="mutedForeground">Data Nascimento</Typography>
                  <Typography weight="semibold">{formatDateDisplay(currentUser.birthDate || '')}</Typography>
                </View>
                <View style={styles.infoItem}>
                  <Typography variant="caption" color="mutedForeground">Localização</Typography>
                  <Typography weight="semibold">
                    {currentUser.city ? `${currentUser.city}${currentUser.state ? ` - ${currentUser.state}` : ''}` : 'Não informado'}
                  </Typography>
                </View>
                <View style={styles.infoItem}>
                  <Typography variant="caption" color="mutedForeground">Profissão</Typography>
                  <Typography weight="semibold">{currentUser.occupation || 'Não informado'}</Typography>
                </View>
              </View>
              
              <View style={styles.fullInfoItem}>
                <Typography variant="caption" color="mutedForeground">Objetivos</Typography>
                <Typography weight="semibold">{currentUser.goals || 'Não informado'}</Typography>
              </View>

              <View style={styles.fullInfoItem}>
                <Typography variant="caption" color="mutedForeground">Privacidade</Typography>
                <Typography weight="semibold">
                  {currentUser.rankingVisible !== false ? 'Nome Público' : 'Nome Oculto (Iniciais)'}
                </Typography>
              </View>
            </View>
          )}
        </Card>

        {/* Medidas Iniciais */}
        {!isEditing && (
          loadingInitial ? (
            <ActivityIndicator style={{ marginBottom: tokens.spacing.xl }} />
          ) : measurements ? (
            <Card variant="outline" style={styles.card}>
              <Typography variant="h4" style={styles.sectionTitle}>Medidas Iniciais</Typography>
              <View style={styles.measurementsGrid}>
                <View style={styles.measurementItem}>
                  <Typography variant="caption" color="mutedForeground">Peso:</Typography>
                  <Typography weight="semibold">{measurements.peso} kg</Typography>
                </View>
                <View style={styles.measurementItem}>
                  <Typography variant="caption" color="mutedForeground">Altura:</Typography>
                  <Typography weight="semibold">{measurements.altura} cm</Typography>
                </View>
                <View style={styles.measurementItem}>
                  <Typography variant="caption" color="mutedForeground">Cintura:</Typography>
                  <Typography weight="semibold">{measurements.cintura} cm</Typography>
                </View>
                <View style={styles.measurementItem}>
                  <Typography variant="caption" color="mutedForeground">Quadril:</Typography>
                  <Typography weight="semibold">{measurements.quadril} cm</Typography>
                </View>
                <View style={styles.measurementItem}>
                  <Typography variant="caption" color="mutedForeground">Braço:</Typography>
                  <Typography weight="semibold">{measurements.braco} cm</Typography>
                </View>
                <View style={styles.measurementItem}>
                  <Typography variant="caption" color="mutedForeground">Coxa:</Typography>
                  <Typography weight="semibold">{measurements.coxa} cm</Typography>
                </View>
                {measurements.peso && measurements.altura > 0 ? (
                  <View style={styles.measurementItem}>
                    <Typography variant="caption" color="mutedForeground">IMC:</Typography>
                    <Typography weight="bold">{calculateIMC(measurements.peso, measurements.altura)}</Typography>
                  </View>
                ) : null}
              </View>
            </Card>
          ) : null
        )}

        {/* Sintomas Iniciais */}
        {!isEditing && !loadingInitial && symptoms && (
          <Card variant="outline" style={styles.card}>
            <Typography variant="h4" style={styles.sectionTitle}>Sintomas Iniciais</Typography>
            <View style={styles.symptomsGrid}>
              {Object.entries(symptoms)
                .filter(([_, value]) => typeof value === 'number' && value > 0)
                .map(([key, value]) => {
                  const label = key.replace(/([A-Z])/g, ' $1').toLowerCase();
                  return (
                    <View key={key} style={styles.symptomItem}>
                      <Typography variant="caption" color="mutedForeground" style={{ flex: 1, textTransform: 'capitalize' }}>
                        {label}:
                      </Typography>
                      <Typography weight="semibold">{String(value)}</Typography>
                    </View>
                  );
                })}
              {symptoms.nenhumSintoma && (
                <Typography variant="caption" color="mutedForeground">Nenhum sintoma inicial registrado.</Typography>
              )}
            </View>
          </Card>
        )}

        <View style={styles.actions}>
          {isImpersonating && (
            <Button
              title="Voltar ao Painel Admin"
              variant="outline"
              onPress={() => stopImpersonation()}
              style={{ marginBottom: tokens.spacing.md }}
            />
          )}
          
          {!isEditing && (
            <Button
              title="Sair (Logout)"
              variant="destructive"
              onPress={handleLogout}
              loading={loading}
            />
          )}
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
    borderRadius: tokens.radius.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  sectionTitle: {
    marginBottom: tokens.spacing.md,
  },
  form: {
    marginTop: tokens.spacing.sm,
  },
  inputGroup: {
    marginBottom: tokens.spacing.md,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    marginBottom: 4,
    marginLeft: 4,
  },
  input: {
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    height: 48,
    color: tokens.colors.foreground,
  },
  textArea: {
    height: 100,
    paddingTop: tokens.spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: tokens.colors.border,
    marginBottom: tokens.spacing.md,
  },
  switchText: {
    flex: 1,
    paddingRight: tokens.spacing.md,
  },
  formActions: {
    flexDirection: 'row',
    marginTop: tokens.spacing.md,
  },
  viewMode: {
    marginTop: tokens.spacing.sm,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
    borderBottomWidth: 1,
    borderColor: tokens.colors.border,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: tokens.spacing.sm,
  },
  infoItem: {
    width: '50%',
    marginBottom: tokens.spacing.md,
  },
  fullInfoItem: {
    marginBottom: tokens.spacing.md,
  },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  measurementItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
    gap: 4,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  symptomItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
    paddingRight: tokens.spacing.sm,
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
