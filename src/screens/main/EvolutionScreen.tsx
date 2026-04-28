import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { tokens } from '../../theme/tokens';
import { useEffectiveUser } from '../../stores/useAuthStore';
import { supabase } from '../../lib/supabase';
import { SimpleLineChart } from '../../components/ui/SimpleLineChart';
import { useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - tokens.spacing.lg * 2 - tokens.spacing.md * 2;

type PhotoPosition = 'frente' | 'lado' | 'costas';

type PhotoSet = {
  label: string;
  photos?: { frente?: string; lado?: string; costas?: string };
};

type SymptomImprovement = {
  key: string;
  label: string;
  initial: number;
  latest: number;
  improvement: number;
};

// Mesmas labels do projeto web
const symptomLabels: Record<string, string> = {
  ondasDeCalor: 'Ondas de calor (fogachos)',
  suorNoturno: 'Suor noturno',
  alteracoesSono: 'Alterações no sono',
  cansaco: 'Cansaço ou fadiga',
  doresArticulares: 'Dores articulares',
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

// --- Signed Image component ---
function SignedImage({ path, style }: { path?: string; style: any }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!path) { setUrl(null); return; }
    if (path.startsWith('http') || path.startsWith('file://') || path.startsWith('data:')) {
      setUrl(path);
      return;
    }
    async function fetchUrl() {
      const { data } = await supabase.storage.from('user-photos').createSignedUrl(path!, 3600);
      if (active && data?.signedUrl) setUrl(data.signedUrl);
    }
    fetchUrl();
    return () => { active = false; };
  }, [path]);

  if (!url) {
    return (
      <View style={[style, styles.placeholderImage]}>
        <Typography variant="caption" color="mutedForeground">Sem foto</Typography>
      </View>
    );
  }

  return (
    <Image style={style} source={{ uri: url }} contentFit="cover" transition={200} cachePolicy="memory-disk" />
  );
}

// --- Main Screen ---
export function EvolutionScreen() {
  const user = useEffectiveUser();
  const [loading, setLoading] = useState(true);

  // Data states
  const [weightData, setWeightData] = useState<{ value: number; label: string }[]>([]);
  const [waistData, setWaistData] = useState<{ value: number; label: string }[]>([]);
  const [imcData, setImcData] = useState<{ value: number; label: string }[]>([]);
  const [totalWeeksCount, setTotalWeeksCount] = useState(0);
  const [weightLost, setWeightLost] = useState(0);

  // Photos
  const [photoSets, setPhotoSets] = useState<PhotoSet[]>([]);
  const [activeView, setActiveView] = useState<PhotoPosition>('frente');
  const [compareIndex, setCompareIndex] = useState(0);

  // Symptoms
  const [symptomImprovements, setSymptomImprovements] = useState<SymptomImprovement[]>([]);
  const [waistReduced, setWaistReduced] = useState(0);

  useFocusEffect(
    useCallback(() => {
      async function fetchData() {
        if (!user?.id) return;
        setLoading(true);

        const [initRes, weeksRes] = await Promise.all([
          supabase.from('onboarding_initial').select('measurements, symptoms, photos').eq('user_id', user.id).maybeSingle(),
          supabase.from('weekly_records').select('week, measurements, symptoms, photos').eq('user_id', user.id).order('week', { ascending: true }),
        ]);

        const initial = initRes.data;
        const weeks = weeksRes.data || [];
        setTotalWeeksCount(weeks.length);

        // --- Weight chart ---
        const initialPeso = Number(initial?.measurements?.peso) || 0;
        const initialCintura = Number(initial?.measurements?.cintura) || 0;
        const initialAltura = Number(initial?.measurements?.altura) || 0;

        const wData: { value: number; label: string }[] = [];
        const cData: { value: number; label: string }[] = [];
        const iData: { value: number; label: string }[] = [];

        if (initialPeso > 0) {
          wData.push({ value: initialPeso, label: 'Inicial' });
        }
        if (initialCintura > 0) {
          cData.push({ value: initialCintura, label: 'Inicial' });
        }
        if (initialAltura > 0 && initialPeso > 0) {
          const hM = initialAltura > 3 ? initialAltura / 100 : initialAltura;
          iData.push({ value: parseFloat((initialPeso / (hM * hM)).toFixed(1)), label: 'Inicial' });
        }

        for (const w of weeks) {
          const peso = Number(w.measurements?.peso);
          const cintura = Number(w.measurements?.cintura);
          const label = `Sem ${w.week}`;

          if (!isNaN(peso) && peso > 0) {
            wData.push({ value: peso, label });
          }
          if (!isNaN(cintura) && cintura > 0) {
            cData.push({ value: cintura, label });
          }
          if (initialAltura > 0 && !isNaN(peso) && peso > 0) {
            const hM = initialAltura > 3 ? initialAltura / 100 : initialAltura;
            iData.push({ value: parseFloat((peso / (hM * hM)).toFixed(1)), label });
          }
        }

        setWeightData(wData);
        setWaistData(cData);
        setImcData(iData);

        // Weight lost
        if (wData.length > 1) {
          setWeightLost(wData[0].value - wData[wData.length - 1].value);
        }

        // Waist reduced
        if (cData.length > 1) {
          setWaistReduced(cData[0].value - cData[cData.length - 1].value);
        }

        // --- Photos ---
        const newPhotoSets: PhotoSet[] = [];
        newPhotoSets.push({ label: 'Inicial', photos: initial?.photos || undefined });
        for (const w of weeks) {
          newPhotoSets.push({ label: `Semana ${w.week}`, photos: w.photos || undefined });
        }
        setPhotoSets(newPhotoSets);
        setCompareIndex(0);

        // --- Symptom improvements ---
        const initialSymptoms = initial?.symptoms as Record<string, number> | null;
        const latestSymptoms = weeks.length > 0
          ? (weeks[weeks.length - 1].symptoms as Record<string, number> | null)
          : initialSymptoms;

        const improvements: SymptomImprovement[] = [];
        if (initialSymptoms && latestSymptoms) {
          for (const key of Object.keys(symptomLabels)) {
            const ini = initialSymptoms[key] || 0;
            const lat = latestSymptoms[key] || 0;
            if (ini > 0) {
              const improvement = ((ini - lat) / ini) * 100;
              if (improvement > 0) {
                improvements.push({
                  key,
                  label: symptomLabels[key],
                  initial: ini,
                  latest: lat,
                  improvement,
                });
              }
            }
          }
        }
        improvements.sort((a, b) => b.improvement - a.improvement);
        setSymptomImprovements(improvements.slice(0, 4));

        setLoading(false);
      }

      fetchData();
    }, [user?.id])
  );

  const hasSymptomImprovement = symptomImprovements.length > 0;
  const latestPhotoSet = photoSets.length > 0 ? photoSets[photoSets.length - 1] : null;
  const currentPhotoSet = photoSets[compareIndex] || photoSets[0];

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Typography variant="h2">Sua jornada até aqui 🌟</Typography>
          <Typography variant="body" color="mutedForeground">
            {totalWeeksCount} semana{totalWeeksCount !== 1 ? 's' : ''} de acompanhamento
          </Typography>
        </View>

        {/* ======================== PESO ======================== */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography variant="body" weight="semibold">📉 Evolução do Peso</Typography>
          </View>

          {weightData.length > 1 ? (
            <>
              <SimpleLineChart data={weightData} width={CHART_WIDTH} height={160} color={tokens.colors.primary} unit="kg" />
              <View style={styles.summaryBox}>
                <Typography variant="caption" color="mutedForeground">Total perdido</Typography>
                <Typography variant="h2" color="success">
                  {weightLost.toFixed(1)} kg
                </Typography>
              </View>
            </>
          ) : (
            <View style={styles.emptyChart}>
              <Typography variant="body" color="mutedForeground">
                Complete seu primeiro registro para ver o gráfico
              </Typography>
            </View>
          )}
        </Card>

        {/* ======================== CINTURA ======================== */}
        {waistData.length > 0 && (
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Typography variant="body" weight="semibold">📏 Evolução da Cintura</Typography>
            </View>

            {waistData.length > 1 ? (
              <SimpleLineChart data={waistData} width={CHART_WIDTH} height={160} color={tokens.colors.success} unit="cm" />
            ) : (
              <View style={styles.emptyChart}>
                <Typography variant="body" color="mutedForeground">
                  Complete seu primeiro registro para ver o gráfico
                </Typography>
              </View>
            )}
          </Card>
        )}

        {/* ======================== IMC ======================== */}
        {imcData.length > 0 && (
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Typography variant="body" weight="semibold">📊 Evolução do IMC</Typography>
            </View>

            {imcData.length > 1 ? (
              <SimpleLineChart data={imcData} width={CHART_WIDTH} height={160} color={tokens.colors.destructive} />
            ) : (
              <View style={styles.emptyChart}>
                <Typography variant="body" color="mutedForeground">
                  Complete seu primeiro registro para ver o gráfico do IMC
                </Typography>
              </View>
            )}
          </Card>
        )}

        {/* ======================== FOTOS ======================== */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography variant="body" weight="semibold">📸 Evolução Visual</Typography>
          </View>

          {/* Tabs Frente/Lado/Costas */}
          <View style={styles.tabsContainer}>
            {(['frente', 'lado', 'costas'] as PhotoPosition[]).map(pos => (
              <TouchableOpacity
                key={pos}
                style={[styles.tab, activeView === pos && styles.activeTab]}
                onPress={() => setActiveView(pos)}
              >
                <Typography
                  variant="body"
                  weight={activeView === pos ? 'semibold' : 'regular'}
                  color={activeView === pos ? 'primaryForeground' : 'foreground'}
                  style={{ textTransform: 'capitalize', fontSize: 13 }}
                >
                  {pos}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>

          {photoSets.length > 0 ? (
            <>
              {/* Photo comparison grid */}
              <View style={styles.photoGrid}>
                {/* Before (navigable) */}
                <View style={styles.photoColumn}>
                  <View style={styles.photoNavRow}>
                    <Pressable
                      onPress={() => setCompareIndex(Math.max(0, compareIndex - 1))}
                      disabled={compareIndex === 0}
                      style={({ pressed }) => [styles.navArrow, (compareIndex === 0 || pressed) && { opacity: 0.3 }]}
                    >
                      <Typography variant="body" weight="bold">←</Typography>
                    </Pressable>
                    <Typography variant="caption" color="mutedForeground" style={{ fontSize: 11 }}>
                      {currentPhotoSet?.label}
                    </Typography>
                    <Pressable
                      onPress={() => setCompareIndex(Math.min(photoSets.length - 1, compareIndex + 1))}
                      disabled={compareIndex >= photoSets.length - 1}
                      style={({ pressed }) => [styles.navArrow, (compareIndex >= photoSets.length - 1 || pressed) && { opacity: 0.3 }]}
                    >
                      <Typography variant="body" weight="bold">→</Typography>
                    </Pressable>
                  </View>
                  <View style={styles.photoFrame}>
                    <SignedImage path={currentPhotoSet?.photos?.[activeView]} style={styles.photo} />
                  </View>
                </View>

                {/* After (latest) */}
                <View style={styles.photoColumn}>
                  <View style={styles.photoNavRow}>
                    <View style={styles.latestBadge}>
                      <Typography variant="caption" color="primary" style={{ fontSize: 11, fontWeight: '600' }}>
                        {latestPhotoSet?.label}
                      </Typography>
                    </View>
                  </View>
                  <View style={styles.photoFrame}>
                    <SignedImage path={latestPhotoSet?.photos?.[activeView]} style={styles.photo} />
                  </View>
                </View>
              </View>

              <Typography variant="caption" color="mutedForeground" style={{ textAlign: 'center', marginTop: tokens.spacing.sm }}>
                Use as setas para comparar diferentes semanas
              </Typography>
            </>
          ) : (
            <View style={styles.emptyChart}>
              <Typography variant="body" color="mutedForeground">Você ainda não enviou fotos.</Typography>
            </View>
          )}
        </Card>

        {/* ======================== SINTOMAS ======================== */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography variant="body" weight="semibold">💊 Melhora nos Sintomas</Typography>
          </View>

          {symptomImprovements.length > 0 ? (
            <View style={{ gap: tokens.spacing.md }}>
              {symptomImprovements.map(s => (
                <View key={s.key} style={{ gap: tokens.spacing.xs }}>
                  <View style={styles.symptomRow}>
                    <Typography variant="body" style={{ flex: 1 }}>{s.label}</Typography>
                    <Typography variant="body" weight="semibold" color="success">
                      -{s.improvement.toFixed(0)}%
                    </Typography>
                  </View>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${Math.min(s.improvement, 100)}%` }]} />
                  </View>
                  <Typography variant="caption" color="mutedForeground">
                    De {s.initial} para {s.latest} na escala
                  </Typography>
                </View>
              ))}

              {/* Motivational message */}
              <View style={styles.motivationalBox}>
                <Typography variant="body" color="success" weight="medium" style={{ textAlign: 'center' }}>
                  Seu {symptomImprovements[0].label.toLowerCase()} reduziu {symptomImprovements[0].improvement.toFixed(0)}% desde o início! 💪
                </Typography>
              </View>
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Typography variant="body" color="mutedForeground" style={{ textAlign: 'center' }}>
                Complete mais registros para ver a evolução dos sintomas
              </Typography>
            </View>
          )}

          {/* Consistency message */}
          {totalWeeksCount > 0 && (
            <View style={[styles.consistencyBox, { marginTop: tokens.spacing.lg }]}>
              <Typography variant="body" weight="medium" style={{ textAlign: 'center' }}>
                {totalWeeksCount === 1 && '1 semana de consistência! Continue assim.'}
                {totalWeeksCount >= 2 && totalWeeksCount < 4 && `${totalWeeksCount} semanas de acompanhamento. Você está no caminho.`}
                {totalWeeksCount >= 4 && `${totalWeeksCount} semanas de consistência. Cada registro é uma vitória!`}
              </Typography>
            </View>
          )}

          {/* Extra motivational for waist/symptoms when no weight loss */}
          {weightLost <= 0 && (waistReduced > 0 || hasSymptomImprovement) && (
            <View style={[styles.motivationalBox, { marginTop: tokens.spacing.md }]}>
              <Typography variant="body" style={{ textAlign: 'center' }}>
                {waistReduced > 0 && hasSymptomImprovement && 'A balança é só um número: sua cintura e seus sintomas estão melhorando. Parabéns!'}
                {waistReduced > 0 && !hasSymptomImprovement && 'Sua cintura está evoluindo. O corpo responde de formas diferentes — valorize cada conquista.'}
                {waistReduced <= 0 && hasSymptomImprovement && 'Sua melhora nos sintomas é um progresso real. Continue cuidando de você.'}
              </Typography>
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles ---
const PHOTO_WIDTH = (SCREEN_WIDTH - tokens.spacing.lg * 2 - tokens.spacing.md * 2 - tokens.spacing.md) / 2;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  scrollContent: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl * 2,
  },
  header: {
    marginBottom: tokens.spacing.lg,
    alignItems: 'center',
  },
  section: {
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  summaryBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    alignItems: 'center',
    marginTop: tokens.spacing.md,
  },
  emptyChart: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
  },
  // Photo tabs
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  tab: {
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.muted,
  },
  activeTab: {
    backgroundColor: tokens.colors.primary,
  },
  // Photo comparison
  photoGrid: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  photoColumn: {
    flex: 1,
  },
  photoNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.xs,
    minHeight: 24,
  },
  navArrow: {
    padding: 4,
  },
  latestBadge: {
    backgroundColor: 'rgba(214, 63, 82, 0.1)',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radius.full,
  },
  photoFrame: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: tokens.radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.muted,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.muted,
  },
  // Symptoms
  symptomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barBg: {
    height: 8,
    backgroundColor: tokens.colors.muted,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: tokens.colors.success,
    borderRadius: 4,
  },
  motivationalBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
  },
  consistencyBox: {
    backgroundColor: tokens.colors.muted,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
