import React, { useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { tokens } from '../../theme/tokens';
import { useEffectiveUser, useAuthStore } from '../../stores/useAuthStore';
import { SimpleLineChart } from '../../components/ui/SimpleLineChart';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export function DashboardScreen() {
  const user = useEffectiveUser();
  const updateCurrentUser = useAuthStore(s => s.updateCurrentUser);
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{value: number, label: string}[]>([]);
  const [totalWeeks, setTotalWeeks] = useState(0);
  const [initialWeight, setInitialWeight] = useState(0);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [imc, setImc] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [isCurrentWeekFilled, setIsCurrentWeekFilled] = useState(false);
  const [badges, setBadges] = useState<{key: string, name: string, emoji: string}[]>([]);
  const [rankInfo, setRankInfo] = useState<{position: number, percent: number} | null>(null);
  const [last3Weeks, setLast3Weeks] = useState<{week: number, weight: number, status: string}[]>([]);

  useFocusEffect(
    useCallback(() => {
      async function fetchData() {
        if (!user?.id) return;
        setLoading(true);

        const [initRes, weeksRes] = await Promise.all([
          supabase.from('onboarding_initial').select('measurements').eq('user_id', user.id).maybeSingle(),
          supabase.from('weekly_records').select('week, measurements, record_date').eq('user_id', user.id).order('week', { ascending: true })
        ]);

        const initial = Number(initRes.data?.measurements?.peso) || 0;
        const altura = Number(initRes.data?.measurements?.altura) || 0;
        setInitialWeight(initial);

        const weeks = weeksRes.data || [];
        setTotalWeeks(weeks.length);
        
        let cWeight = initial;
        if (weeks.length > 0) {
          const lastW = weeks[weeks.length - 1];
          const lastP = Number(lastW.measurements?.peso);
          cWeight = !isNaN(lastP) ? lastP : initial;
          
          setCurrentWeek(lastW.week);
          const lastDate = new Date(lastW.record_date).getTime();
          setIsCurrentWeekFilled(lastDate > Date.now() - 7 * 24 * 60 * 60 * 1000);
        } else {
          setCurrentWeek(1);
          setIsCurrentWeekFilled(false);
        }
        setCurrentWeight(cWeight);
        
        if (altura > 0) {
          const hM = altura > 3 ? altura / 100 : altura;
          setImc(cWeight / (hM * hM));
        }

        // Calculate last 3 weeks history
        const history = [];
        for (let i = weeks.length - 1; i >= Math.max(0, weeks.length - 3); i--) {
          const current = weeks[i];
          const previous = i > 0 ? weeks[i - 1] : { measurements: { peso: initial } };
          
          const currentP = Number(current.measurements?.peso) || 0;
          const previousP = Number(previous.measurements?.peso) || 0;
          
          let status = 'neutral';
          if (currentP < previousP) status = 'loss';
          else if (currentP > previousP) status = 'gain';
          
          history.push({
            week: current.week,
            weight: currentP,
            status
          });
        }
        setLast3Weeks(history);

        // Calculate badges
        const lostKg = initial - cWeight;
        const percent = initial > 0 ? (lostKg / initial) * 100 : 0;
        
        const earnedBadges: any[] = [];
        if (weeks.length >= 1) earnedBadges.push({ key: 'first_checkin', name: 'Primeiro Passo', emoji: '🌟' });
        if (percent >= 5) earnedBadges.push({ key: 'lost_5_percent', name: 'Estrela 5%', emoji: '⭐' });
        if (percent >= 10) earnedBadges.push({ key: 'lost_10_percent', name: 'Transform. 10%', emoji: '🏆' });
        
        if (weeks.length >= 4) {
          let consistent = false;
          for (let i = 0; i <= weeks.length - 4; i++) {
            const slice = weeks.slice(i, i + 4);
            let valid = true;
            let lastW = slice[0].measurements?.peso ?? 9999;
            for (let j = 1; j < 4; j++) {
              const currentW = slice[j].measurements?.peso;
              if (currentW === undefined || currentW >= lastW) {
                valid = false;
                break;
              }
              lastW = currentW;
            }
            if (valid) {
              consistent = true;
              break;
            }
          }
          if (consistent) earnedBadges.push({ key: 'consistent_4w', name: 'Foco Mensal', emoji: '🔥' });
        }
        setBadges(earnedBadges);

        // Fetch rank usando RPC (mesma lógica do projeto web)
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_gamification_users');
          if (!rpcError && rpcData) {
            // Descobrir turma_id da aluna logada
            const myEntry = rpcData.find((r: any) => r.id === user.id);
            const myTurmaId = myEntry?.turma_id;

            if (myTurmaId) {
              // Filtrar alunas da mesma turma (excluindo admins)
              const sameTurma = rpcData.filter((r: any) => r.turma_id === myTurmaId && !r.is_admin);

              const ranking = sameTurma.map((r: any) => {
                const initW = Number(r.initial_weight) || 0;
                const lastW = Number(r.latest_weight) || initW;
                let pLoss = 0;
                if (initW > 0 && lastW > 0) {
                  pLoss = ((initW - lastW) / initW) * 100;
                }
                return { id: r.id, percent: pLoss };
              });

              ranking.sort((a: any, b: any) => b.percent - a.percent);
              const myRankIndex = ranking.findIndex((r: any) => r.id === user.id);
              if (myRankIndex !== -1) {
                setRankInfo({ position: myRankIndex + 1, percent: ranking[myRankIndex].percent });
              }
            }
          }
        } catch (e) {
          console.log('Error fetching rank', e);
        }

        // Sincronizar permissões do perfil (ex: meal_logging_enabled)
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('meal_logging_enabled, ranking_visible')
            .eq('id', user.id)
            .maybeSingle();

          if (profileData) {
            updateCurrentUser({
              mealLoggingEnabled: profileData.meal_logging_enabled ?? false,
              rankingVisible: profileData.ranking_visible ?? true,
            });
          }
        } catch (e) {
          console.log('Error syncing profile permissions', e);
        }

        setLoading(false);
      }
      
      fetchData();
    }, [user?.id])
  );

  const weightDiff = currentWeight - initialWeight;
  const isDiffNaN = isNaN(weightDiff);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Typography variant="h2">Olá, {user?.name?.split(' ')[0] || 'Aluna'}! 👋</Typography>
          <Typography variant="body" color="mutedForeground">
            Aqui está o seu progresso até o momento.
          </Typography>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={tokens.colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.weekCard}>
              <View style={styles.weekHeader}>
                <View style={styles.weekTitleRow}>
                  <Typography variant="body" weight="semibold">📅 Semana {currentWeek}</Typography>
                </View>
                <View style={[styles.statusPill, isCurrentWeekFilled ? styles.statusFilled : styles.statusPending]}>
                  <View style={[styles.statusDot, isCurrentWeekFilled ? styles.statusDotFilled : styles.statusDotPending]} />
                  <Typography variant="caption" color={isCurrentWeekFilled ? 'success' : 'warning'} weight="medium">
                    {isCurrentWeekFilled ? 'Preenchida' : 'Pendente'}
                  </Typography>
                </View>
              </View>

              <View style={styles.weightRow}>
                <View style={styles.weightCol}>
                  <Typography variant="caption" color="mutedForeground">Peso inicial</Typography>
                  <Typography variant="h3">{initialWeight} kg</Typography>
                </View>
                <View style={styles.weightDivider}>
                  <Typography variant="h3" color="destructive">📉</Typography>
                </View>
                <View style={styles.weightCol}>
                  <Typography variant="caption" color="mutedForeground">Peso atual</Typography>
                  <Typography variant="h3">{currentWeight} kg</Typography>
                </View>
              </View>

              <View style={styles.diffBlock}>
                <Typography variant="caption" color="mutedForeground">Diferença total</Typography>
                <Typography variant="h2" color={isDiffNaN ? 'primary' : weightDiff < 0 ? 'success' : weightDiff > 0 ? 'destructive' : 'primary'}>
                  {isDiffNaN ? '---' : `${weightDiff > 0 ? '+' : ''}${weightDiff.toFixed(1)} kg`}
                </Typography>
                {weightDiff < 0 && (
                  <Typography variant="caption" color="success" style={{marginTop: tokens.spacing.xs}}>
                    Você está no caminho certo! 🎉
                  </Typography>
                )}
              </View>

              {imc > 0 && (
                <View style={styles.imcBlock}>
                  <Typography variant="caption" color="mutedForeground">IMC atual</Typography>
                  <Typography variant="h3">{imc.toFixed(1)}</Typography>
                </View>
              )}
            </View>

            {/* Conquistas */}
            <View style={styles.softCard}>
              <View style={styles.cardHeaderWithIcon}>
                <Typography variant="h4" color="primary" style={{marginRight: 6}}>🏆</Typography>
                <Typography variant="h4">Minhas Conquistas</Typography>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesContainer}>
                {badges.length > 0 ? (
                  badges.map(b => (
                    <View key={b.key} style={styles.badgeItem}>
                      <View style={styles.badgeCircle}>
                        <Typography variant="h2">{b.emoji}</Typography>
                      </View>
                      <Typography variant="caption" style={styles.badgeText}>{b.name}</Typography>
                    </View>
                  ))
                ) : (
                  <Typography variant="body" color="mutedForeground">
                    Complete check-ins para desbloquear conquistas!
                  </Typography>
                )}
              </ScrollView>
            </View>

            {/* Ranking Summary */}
            {rankInfo && (
              <View style={[styles.softCard, { borderLeftWidth: 4, borderLeftColor: '#f59e0b' }]}>
                 <Typography variant="caption" color="mutedForeground">Sua Classificação na Turma</Typography>
                 <View style={styles.rankContent}>
                   <Typography variant="h3" style={{ flex: 1 }}>🏆 {rankInfo.position}º Lugar <Typography variant="caption">({rankInfo.percent > 0 ? '-' : ''}{Math.abs(rankInfo.percent).toFixed(1)}%)</Typography></Typography>
                   <Button 
                     title="Ver Ranking" 
                     variant="outline" 
                     onPress={() => navigation.navigate('Ranking')}
                     style={{ paddingHorizontal: tokens.spacing.md, height: 40 }}
                   />
                 </View>
              </View>
            )}

            {/* Histórico Recente */}
            {last3Weeks.length > 0 && (
              <View style={styles.softCard}>
                <Typography variant="h4" style={{ marginBottom: tokens.spacing.md }}>Histórico Recente</Typography>
                {last3Weeks.map((item, index) => (
                  <View key={item.week} style={[styles.historyRow, index < last3Weeks.length - 1 && styles.historyBorder]}>
                    <Typography variant="body" weight="medium">Semana {item.week}</Typography>
                    <View style={styles.historyRight}>
                      <Typography variant="body" color="mutedForeground" style={{ marginRight: tokens.spacing.sm }}>
                        {item.weight.toFixed(1)} kg
                      </Typography>
                      <View style={[
                        styles.historyDot, 
                        item.status === 'loss' ? { backgroundColor: tokens.colors.success } :
                        item.status === 'gain' ? { backgroundColor: tokens.colors.destructive } :
                        { backgroundColor: tokens.colors.warning }
                      ]} />
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.bottomActions}>
              <Button 
                title="Registrar Minha Semana ✨" 
                onPress={() => navigation.navigate('RegistroSemanal')}
                style={styles.mainActionBtn}
              />
              {user?.mealLoggingEnabled && (
                <Button 
                  title="Minhas Refeições 🍽️" 
                  variant="outline"
                  onPress={() => navigation.navigate('Refeicoes')}
                  style={styles.mainActionBtn}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>
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
    marginTop: tokens.spacing.md,
  },
  weekCard: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  weekTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusFilled: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)', // success light
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)', // warning light
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusDotFilled: {
    backgroundColor: tokens.colors.success,
  },
  statusDotPending: {
    backgroundColor: tokens.colors.warning,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
  },
  weightCol: {
    flex: 1,
    alignItems: 'center',
  },
  weightDivider: {
    width: 40,
    alignItems: 'center',
  },
  diffBlock: {
    backgroundColor: 'rgba(249, 240, 241, 0.5)', // soft accent
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  imcBlock: {
    backgroundColor: 'rgba(249, 240, 241, 0.5)', // soft accent
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    alignItems: 'center',
  },
  softCard: {
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  cardHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  rankContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: tokens.spacing.xs,
  },
  bottomActions: {
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  mainActionBtn: {
    paddingVertical: tokens.spacing.sm,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    overflow: 'hidden',
  },
  badgeItem: {
    alignItems: 'center',
    width: 70,
  },
  badgeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: tokens.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    marginBottom: tokens.spacing.xs,
  },
  badgeText: {
    textAlign: 'center',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
  },
  historyBorder: {
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  }
});
