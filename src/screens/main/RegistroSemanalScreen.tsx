import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Checkbox } from '../../components/ui/Checkbox';
import { SymptomSlider } from '../../components/ui/SymptomSlider';
import { PhotoUploadCard } from '../../components/ui/PhotoUploadCard';
import { tokens } from '../../theme/tokens';
import { useEffectiveUser } from '../../stores/useAuthStore';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';

const defaultSymptoms = {
  ondasDeCalor: 0, suorNoturno: 0, alteracoesSono: 0, cansaco: 0,
  doresArticulares: 0, inchaco: 0, retencaoLiquidos: 0,
  irritabilidade: 0, ansiedade: 0, alteracoesHumor: 0, falhasMemoria: 0, dificuldadeConcentracao: 0,
  diminuicaoLibido: 0, ressecamentoVaginal: 0, desconfortoIntimo: 0,
  nenhumSintoma: false, outroSintoma: ''
};

const symptomLabels: Record<string, string> = {
  ondasDeCalor: 'Ondas de calor (fogachos)',
  suorNoturno: 'Suor noturno',
  alteracoesSono: 'Alterações no sono',
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

export function RegistroSemanalScreen() {
  const user = useEffectiveUser();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [currentWeek, setCurrentWeek] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [measurements, setMeasurements] = useState({ peso: '', cintura: '', quadril: '', braco: '', coxa: '' });
  const [symptoms, setSymptoms] = useState<any>({ ...defaultSymptoms });
  const [photos, setPhotos] = useState<{frente: string|null, lado: string|null, costas: string|null}>({ frente: null, lado: null, costas: null });
  const [observations, setObservations] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!user?.id) return;
      setLoading(true);

      const [initRes, weekRes] = await Promise.all([
        supabase.from('onboarding_initial').select('measurements').eq('user_id', user.id).maybeSingle(),
        supabase.from('weekly_records').select('*').eq('user_id', user.id).order('week', { ascending: false }).limit(1)
      ]);

      const initialMeasurements = initRes.data?.measurements || {};
      let lastRecord = weekRes.data && weekRes.data.length > 0 ? weekRes.data[0] : null;

      let weekToUse = 1;
      let editMode = false;

      let startMeas = {
        peso: initialMeasurements.peso?.toString() || '',
        cintura: initialMeasurements.cintura?.toString() || '',
        quadril: initialMeasurements.quadril?.toString() || '',
        braco: initialMeasurements.braco?.toString() || '',
        coxa: initialMeasurements.coxa?.toString() || '',
      };

      if (lastRecord) {
        const lastDate = new Date(lastRecord.record_date).getTime();
        const isFilled = lastDate > Date.now() - 7 * 24 * 60 * 60 * 1000;
        
        if (isFilled) {
          weekToUse = lastRecord.week;
          editMode = true;
          const rMeas = lastRecord.measurements || {};
          startMeas = {
            peso: rMeas.peso?.toString() || startMeas.peso,
            cintura: rMeas.cintura?.toString() || startMeas.cintura,
            quadril: rMeas.quadril?.toString() || startMeas.quadril,
            braco: rMeas.braco?.toString() || startMeas.braco,
            coxa: rMeas.coxa?.toString() || startMeas.coxa,
          };
          setSymptoms(lastRecord.symptoms || { ...defaultSymptoms });
          setObservations(lastRecord.observations || '');
          
          if (lastRecord.photos) {
            const startPhotos: any = { frente: null, lado: null, costas: null };
            for (const pos of ['frente', 'lado', 'costas']) {
              if (lastRecord.photos[pos]) {
                const { data } = await supabase.storage.from('user-photos').createSignedUrl(lastRecord.photos[pos], 3600);
                startPhotos[pos] = data?.signedUrl || lastRecord.photos[pos]; // Fallback to path if error
              }
            }
            setPhotos(startPhotos);
          }
        } else {
          weekToUse = lastRecord.week + 1;
          const rMeas = lastRecord.measurements || {};
          startMeas = {
            peso: rMeas.peso?.toString() || startMeas.peso,
            cintura: rMeas.cintura?.toString() || startMeas.cintura,
            quadril: rMeas.quadril?.toString() || startMeas.quadril,
            braco: rMeas.braco?.toString() || startMeas.braco,
            coxa: rMeas.coxa?.toString() || startMeas.coxa,
          };
        }
      }
      
      setCurrentWeek(weekToUse);
      setIsEditMode(editMode);
      setMeasurements(startMeas);
      setLoading(false);
    }
    fetchData();
  }, [user?.id]);

  const updateMeas = (key: string, value: string) => {
    setMeasurements(prev => ({ ...prev, [key]: value }));
  };

  const updateSymptom = (key: string, value: number) => {
    setSymptoms((prev: any) => ({ ...prev, [key]: value }));
  };

  const handlePhotoUpload = async (uri: string, pos: string) => {
    if (uri.startsWith('http')) return uri; // already a signed URL, means no change
    
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
      encoding: 'base64',
    });
    
    const arrayBuffer = decode(base64);
    const path = `${user?.id}/weekly/semana-${currentWeek}-${pos}.jpg`;
    
    const { error } = await supabase.storage.from('user-photos').upload(path, arrayBuffer, {
      upsert: true,
      contentType: 'image/jpeg'
    });
    
    if (error) throw error;
    return path;
  };

  const handleSubmit = async () => {
    if (!measurements.peso) {
      Alert.alert('Erro', 'O peso é obrigatório.');
      return;
    }

    setSaving(true);
    try {
      const photosPayload: any = {};
      
      for (const pos of ['frente', 'lado', 'costas']) {
        const uri = (photos as any)[pos];
        if (uri) {
          if (uri.startsWith('http')) {
            // we don't have the original path easily here, but we can extract it or assume it didn't change
            // we should probably fetch the original path if it starts with http
            // actually, if it's a signed url, it has the path inside the query or URL
            // A simpler way: if it hasn't changed, we don't need to re-upload, but we need the path.
            // Let's just strip the token to get the path:
            const urlObj = new URL(uri);
            const pathParts = urlObj.pathname.split('/user-photos/');
            if (pathParts.length > 1) {
              photosPayload[pos] = pathParts[1];
            } else {
              photosPayload[pos] = uri; // fallback
            }
          } else {
            photosPayload[pos] = await handlePhotoUpload(uri, pos);
          }
        }
      }

      const measData = {
        peso: parseFloat(measurements.peso) || 0,
        cintura: parseFloat(measurements.cintura) || 0,
        quadril: parseFloat(measurements.quadril) || 0,
        braco: parseFloat(measurements.braco) || 0,
        coxa: parseFloat(measurements.coxa) || 0,
      };

      const { error } = await supabase.from('weekly_records').upsert({
        user_id: user?.id,
        week: currentWeek,
        record_date: new Date().toISOString().split('T')[0],
        measurements: measData,
        observations: observations,
        symptoms: symptoms,
        photos: Object.keys(photosPayload).length > 0 ? photosPayload : null,
      }, { onConflict: 'user_id,week' });

      if (error) throw error;

      Alert.alert('Sucesso', 'Registro da semana salvo com sucesso! 🎉', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível salvar o registro.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Button 
              variant="ghost" 
              title="← Voltar" 
              onPress={() => navigation.goBack()} 
              style={styles.backButton}
            />
            <Typography variant="h2">Registro da Semana {currentWeek} ✨</Typography>
            <Typography variant="body" color="mutedForeground">
              Como você está se sentindo esta semana?
            </Typography>
            {isEditMode && (
              <View style={styles.editBadge}>
                <Typography variant="caption" color="primary">Modo Edição</Typography>
              </View>
            )}
          </View>

          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Typography variant="h4" color="primary" style={{marginRight: 6}}>⚖️</Typography>
              <Typography variant="h4" style={styles.cardTitle}>Peso e Medidas</Typography>
            </View>
            
            <View style={styles.inputGroup}>
              <Input 
                label="Peso Atual (kg)"
                placeholder="Ex: 70.5"
                value={measurements.peso}
                onChangeText={(val) => updateMeas('peso', val.replace(',', '.'))}
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
              <Typography variant="h4" color="primary" style={{marginRight: 6}}>📸</Typography>
              <Typography variant="h4" style={styles.cardTitle}>Fotos (opcional)</Typography>
            </View>
            
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
          </Card>

          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Typography variant="h4" color="primary" style={{marginRight: 6}}>🌡️</Typography>
              <Typography variant="h4" style={styles.cardTitle}>Sintomas desta semana</Typography>
            </View>
            <Typography variant="caption" color="mutedForeground" style={{marginBottom: tokens.spacing.md}}>
              Avalie cada sintoma de 0 (ausente) a 5 (muito intenso)
            </Typography>

            <View style={styles.noSymptomsBox}>
              <Checkbox 
                label="Nenhum sintoma 🙏" 
                value={symptoms.nenhumSintoma} 
                onValueChange={(val) => {
                  setSymptoms({
                    ...defaultSymptoms,
                    nenhumSintoma: val
                  });
                }} 
              />
            </View>

            {Object.entries(symptomCategories).map(([key, cat]) => (
              <View key={key} style={styles.symptomCategory}>
                <Typography variant="body" weight="semibold" style={styles.symptomCatTitle}>
                  {cat.icon} {cat.title}
                </Typography>
                {cat.symptoms.map(sym => (
                  <SymptomSlider 
                    key={sym}
                    label={symptomLabels[sym]}
                    value={symptoms[sym]}
                    onValueChange={(val) => updateSymptom(sym, val)}
                    disabled={symptoms.nenhumSintoma}
                  />
                ))}
              </View>
            ))}
          </Card>

          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Typography variant="h4" color="primary" style={{marginRight: 6}}>💬</Typography>
              <Typography variant="h4" style={styles.cardTitle}>Observações (opcional)</Typography>
            </View>
            <Input 
              placeholder="Algum comentário sobre esta semana? Como se sentiu, mudanças na alimentação..."
              value={observations}
              onChangeText={setObservations}
              multiline
              numberOfLines={4}
              style={{ height: 100, textAlignVertical: 'top', paddingTop: tokens.spacing.sm }}
            />
          </Card>

          <Button 
            title={saving ? "Salvando..." : "Salvar minha semana"} 
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  editBadge: {
    marginTop: tokens.spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(244, 63, 94, 0.1)', // primary with opacity
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radius.full,
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
  cardTitle: {
    //
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
    marginBottom: tokens.spacing.md,
  },
  submitBtn: {
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.xl,
    paddingVertical: tokens.spacing.md,
  },
});
