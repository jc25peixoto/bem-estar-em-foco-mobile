import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Checkbox } from '../../components/ui/Checkbox';
import { PhotoUploadCard } from '../../components/ui/PhotoUploadCard';
import { tokens } from '../../theme/tokens';
import { useEffectiveUser, useAuthStore } from '../../stores/useAuthStore';
import { supabase } from '../../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';

const symptomLabels: Record<string, string> = {
  ondasDeCalor: 'Ondas de calor (fogachos)',
  suorNoturno: 'Suor noturno',
  alteracoesSono: 'Alterações no sono (insônia ou despertares)',
  cansaco: 'Cansaço ou fadiga',
  doresArticulares: 'Dores articulares ou musculares',
  inchaco: 'Inchaço',
  retencaoLiquidos: 'Retenção de líquidos',
  irritabilidade: 'Irritabilidade',
  ansiedade: 'Ansiedade',
  alteracoesHumor: 'Alterações de humor',
  falhasMemoria: 'Falhas de memória',
  dificuldadeConcentracao: 'Dificuldade de concentração',
  diminuicaoLibido: 'Diminuição da libido',
  ressecamentoVaginal: 'Ressecamento vaginal',
  desconfortoIntimo: 'Desconforto íntimo',
};

const symptomCategories = {
  corpo: { icon: '🧍', title: 'Corpo', symptoms: ['ondasDeCalor', 'suorNoturno', 'alteracoesSono', 'cansaco', 'doresArticulares', 'inchaco', 'retencaoLiquidos'] },
  emocoes: { icon: '🧠', title: 'Emoções e foco', symptoms: ['irritabilidade', 'ansiedade', 'alteracoesHumor', 'falhasMemoria', 'dificuldadeConcentracao'] },
  intimidade: { icon: '💞', title: 'Intimidade', symptoms: ['diminuicaoLibido', 'ressecamentoVaginal', 'desconfortoIntimo'] }
};

export function OnboardingScreen() {
  const user = useEffectiveUser();
  const { setCurrentUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  
  const [measurements, setMeasurements] = useState({ peso: '', altura: '', cintura: '', quadril: '', braco: '', coxa: '' });
  const [checkedSymptoms, setCheckedSymptoms] = useState<Record<string, boolean>>({});
  const [noSymptoms, setNoSymptoms] = useState(false);
  const [hasOtherSymptom, setHasOtherSymptom] = useState(false);
  const [otherSymptom, setOtherSymptom] = useState('');
  
  const [photos, setPhotos] = useState<{frente: string|null, lado: string|null, costas: string|null}>({ frente: null, lado: null, costas: null });
  const [consentPhotos, setConsentPhotos] = useState(false);

  const updateMeas = (key: string, value: string) => {
    setMeasurements(prev => ({ ...prev, [key]: value }));
  };

  const handleNoSymptoms = (val: boolean) => {
    setNoSymptoms(val);
    if (val) {
      setCheckedSymptoms({});
      setHasOtherSymptom(false);
      setOtherSymptom('');
    }
  };

  const toggleSymptom = (key: string, val: boolean) => {
    setCheckedSymptoms(prev => ({ ...prev, [key]: val }));
  };

  const handlePhotoUpload = async (uri: string, pos: string) => {
    if (uri.startsWith('http')) return uri;
    
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
      encoding: 'base64',
    });
    
    const arrayBuffer = decode(base64);
    const path = `${user?.id}/onboarding/marco-zero-${pos}.jpg`;
    
    const { error } = await supabase.storage.from('user-photos').upload(path, arrayBuffer, {
      upsert: true,
      contentType: 'image/jpeg'
    });
    
    if (error) throw error;
    return path;
  };

  const hasAnyPhoto = () => photos.frente || photos.lado || photos.costas;

  const handleSubmit = async () => {
    if (!measurements.peso || !measurements.altura) {
      Alert.alert('Erro', 'O peso e a altura são obrigatórios.');
      return;
    }

    if (hasAnyPhoto() && !consentPhotos) {
      Alert.alert('Atenção', 'Marque a autorização de uso de imagem para enviar fotos.');
      return;
    }

    setSaving(true);
    try {
      const photosPayload: any = {};
      
      for (const pos of ['frente', 'lado', 'costas']) {
        const uri = (photos as any)[pos];
        if (uri) {
          photosPayload[pos] = await handlePhotoUpload(uri, pos);
        }
      }

      const measData = {
        peso: parseFloat(measurements.peso) || 0,
        altura: parseFloat(measurements.altura) || 0,
        cintura: parseFloat(measurements.cintura) || 0,
        quadril: parseFloat(measurements.quadril) || 0,
        braco: parseFloat(measurements.braco) || 0,
        coxa: parseFloat(measurements.coxa) || 0,
      };

      const symptomsPayload: any = {
        nenhumSintoma: noSymptoms,
        outroSintoma: hasOtherSymptom ? otherSymptom : null,
      };

      Object.keys(symptomLabels).forEach((key) => {
        symptomsPayload[key] = checkedSymptoms[key] ? 5 : 0;
      });

      // Insert into onboarding_initial
      const { error: insertError } = await supabase.from('onboarding_initial').upsert({
        user_id: user?.id,
        recorded_at: new Date().toISOString(),
        measurements: measData,
        symptoms: symptomsPayload,
        consent_photos: consentPhotos,
        photos: Object.keys(photosPayload).length > 0 ? photosPayload : null,
      }, { onConflict: 'user_id' });

      if (insertError) throw insertError;

      // Update profiles
      const { error: profileError } = await supabase.from('profiles').update({
        onboarding_complete: true
      }).eq('id', user?.id);

      if (profileError) throw profileError;

      // Update local state
      if (user) {
        setCurrentUser({
          ...user,
          onboardingComplete: true
        });
      }

    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível salvar os dados iniciais.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Typography variant="h2" align="center">
              Olá{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 🌸
            </Typography>
            <Typography variant="body" color="mutedForeground" align="center" style={{marginTop: tokens.spacing.xs}}>
              Vamos registrar seu marco zero para acompanhar sua evolução
            </Typography>
          </View>

          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Typography variant="h4" color="primary" style={{marginRight: 6}}>⚖️</Typography>
              <Typography variant="h4">Peso e Medidas</Typography>
            </View>
            
            <View style={styles.inputGroup}>
              <Input 
                label="Peso inicial (kg)"
                placeholder="Ex: 70.5"
                value={measurements.peso}
                onChangeText={(val) => updateMeas('peso', val.replace(',', '.'))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Input 
                label="Altura (cm)"
                placeholder="Ex: 165"
                value={measurements.altura}
                onChangeText={(val) => updateMeas('altura', val.replace(',', '.'))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Input 
                  label="Cintura (cm)"
                  placeholder="Ex: 80"
                  value={measurements.cintura}
                  onChangeText={(val) => updateMeas('cintura', val.replace(',', '.'))}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ width: tokens.spacing.md }} />
              <View style={{ flex: 1 }}>
                <Input 
                  label="Quadril (cm)"
                  placeholder="Ex: 100"
                  value={measurements.quadril}
                  onChangeText={(val) => updateMeas('quadril', val.replace(',', '.'))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Input 
                  label="Braço (cm)"
                  placeholder="Ex: 30"
                  value={measurements.braco}
                  onChangeText={(val) => updateMeas('braco', val.replace(',', '.'))}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ width: tokens.spacing.md }} />
              <View style={{ flex: 1 }}>
                <Input 
                  label="Coxa (cm)"
                  placeholder="Ex: 50"
                  value={measurements.coxa}
                  onChangeText={(val) => updateMeas('coxa', val.replace(',', '.'))}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Typography variant="h4" color="primary" style={{marginRight: 6}}>🌡️</Typography>
              <Typography variant="h4">Sintomas Iniciais</Typography>
            </View>
            <Typography variant="caption" color="mutedForeground" style={{marginBottom: tokens.spacing.md}}>
              Marque os sintomas que você tem atualmente
            </Typography>

            <View style={styles.noSymptomsBox}>
              <Checkbox 
                label="Nenhum sintoma 🙏" 
                value={noSymptoms} 
                onValueChange={handleNoSymptoms} 
              />
            </View>

            {Object.entries(symptomCategories).map(([key, cat]) => (
              <View key={key} style={styles.symptomCategory}>
                <Typography variant="body" weight="semibold" style={styles.symptomCatTitle}>
                  {cat.icon} {cat.title}
                </Typography>
                <View style={styles.checkboxList}>
                  {cat.symptoms.map(sym => (
                    <View key={sym} style={styles.checkboxItem}>
                      <Checkbox 
                        label={symptomLabels[sym]}
                        value={checkedSymptoms[sym] || false}
                        onValueChange={(val) => toggleSymptom(sym, val)}
                        disabled={noSymptoms}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <View style={{ marginTop: tokens.spacing.sm }}>
              <Checkbox 
                label="Quero registrar outro sintoma que me incomoda" 
                value={hasOtherSymptom} 
                onValueChange={setHasOtherSymptom} 
                disabled={noSymptoms}
              />
              {hasOtherSymptom && !noSymptoms && (
                <View style={{ marginTop: tokens.spacing.sm }}>
                  <Input 
                    placeholder="Descreva seu sintoma..."
                    value={otherSymptom}
                    onChangeText={setOtherSymptom}
                    multiline
                    numberOfLines={2}
                    style={{ height: 60, textAlignVertical: 'top' }}
                  />
                </View>
              )}
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Typography variant="h4" color="primary" style={{marginRight: 6}}>📸</Typography>
              <Typography variant="h4">Fotos Iniciais (opcional)</Typography>
            </View>
            <Typography variant="caption" color="mutedForeground" style={{marginBottom: tokens.spacing.md}}>
              Tire fotos de frente, lado e costas para acompanhar sua evolução visual
            </Typography>
            
            <View style={styles.photosRow}>
              <PhotoUploadCard 
                position="frente" 
                label="Frente" 
                imageUri={photos.frente} 
                onImageSelected={(uri) => setPhotos(p => ({...p, frente: uri}))} 
              />
              <View style={{width: tokens.spacing.sm}} />
              <PhotoUploadCard 
                position="lado" 
                label="Lado" 
                imageUri={photos.lado} 
                onImageSelected={(uri) => setPhotos(p => ({...p, lado: uri}))} 
              />
              <View style={{width: tokens.spacing.sm}} />
              <PhotoUploadCard 
                position="costas" 
                label="Costas" 
                imageUri={photos.costas} 
                onImageSelected={(uri) => setPhotos(p => ({...p, costas: uri}))} 
              />
            </View>

            <View style={styles.consentBox}>
              <Checkbox 
                label="Autorizo o uso das minhas imagens para acompanhamento do meu progresso" 
                value={consentPhotos} 
                onValueChange={setConsentPhotos} 
              />
            </View>
          </Card>

          <Button 
            title={saving ? "Salvando..." : "Iniciar meu acompanhamento →"} 
            onPress={handleSubmit}
            disabled={saving}
            style={styles.submitBtn}
          />
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
  scrollContent: {
    padding: tokens.spacing.lg,
  },
  header: {
    marginBottom: tokens.spacing.xl,
    alignItems: 'center',
    paddingTop: tokens.spacing.xl,
  },
  card: {
    marginBottom: tokens.spacing.lg,
    padding: tokens.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  inputGroup: {
    marginBottom: tokens.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    marginBottom: tokens.spacing.sm,
  },
  photosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noSymptomsBox: {
    backgroundColor: 'rgba(249, 240, 241, 0.5)',
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  symptomCategory: {
    marginBottom: tokens.spacing.lg,
  },
  symptomCatTitle: {
    marginBottom: tokens.spacing.sm,
  },
  checkboxList: {
    paddingLeft: tokens.spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: tokens.colors.border,
    marginLeft: tokens.spacing.xs,
  },
  checkboxItem: {
    marginVertical: 4,
  },
  consentBox: {
    marginTop: tokens.spacing.lg,
    backgroundColor: 'rgba(249, 240, 241, 0.5)',
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  submitBtn: {
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.xl,
    paddingVertical: tokens.spacing.md,
  },
});
