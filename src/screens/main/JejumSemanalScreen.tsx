import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { tokens } from '../../theme/tokens';
import { useEffectiveUser } from '../../stores/useAuthStore';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import {
  FASTING_LEVELS,
  getLevelByKey,
  getWeekDates,
  toDateStr,
  STATUS_CONFIG,
  type FastingLevelKey,
  type FastingRecord,
  type FastingStatus,
} from '../../lib/fastingConfig';
import { FastingLevelSelector } from '../../components/fasting/FastingLevelSelector';
import { FastingDayCard } from '../../components/fasting/FastingDayCard';
import { FastingRegistrationDialog } from '../../components/fasting/FastingRegistrationDialog';

const STORAGE_KEY_FASTING = 'bem-estar-fasting-records';
const STORAGE_KEY_FASTING_LEVEL = 'bem-estar-fasting-level';

export function JejumSemanalScreen() {
  const user = useEffectiveUser();
  const navigation = useNavigation<any>();

  const [fastingLevel, setFastingLevel] = useState<FastingLevelKey | null>(null);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [records, setRecords] = useState<FastingRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const refDate = new Date(today);
  refDate.setDate(refDate.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(refDate);

  // Simplified week number since mobile might not have projectWeek readily available in the same way
  // Or we can just use 1 if it's not strictly needed for basic functioning
  const offsetWeek = 1 + weekOffset;

  // ── Load level ──
  useEffect(() => {
    const loadLevel = async () => {
      try {
        if (user?.id) {
          const { data } = await supabase
            .from('profiles')
            .select('fasting_level')
            .eq('id', user.id)
            .maybeSingle();
            
          if (data?.fasting_level) {
            setFastingLevel(data.fasting_level as FastingLevelKey);
          } else {
            setShowLevelSelector(true);
          }
        } else {
          const stored = await AsyncStorage.getItem(STORAGE_KEY_FASTING_LEVEL);
          if (stored) {
            setFastingLevel(stored as FastingLevelKey);
          } else {
            setShowLevelSelector(true);
          }
        }
      } catch (err) {
        console.error('Error loading fasting level', err);
        setShowLevelSelector(true);
      }
    };
    loadLevel();
  }, [user]);

  // ── Load records for the active week ──
  const loadRecords = useCallback(async () => {
    setLoading(true);
    const startDate = toDateStr(weekDates[0]);
    const endDate = toDateStr(weekDates[6]);

    try {
      if (user?.id) {
        const { data, error } = await supabase
          .from('fasting_records')
          .select('*')
          .eq('user_id', user.id)
          .gte('record_date', startDate)
          .lte('record_date', endDate)
          .order('record_date', { ascending: true });

        if (!error && data) {
          setRecords(data as FastingRecord[]);
        }
      } else {
        const raw = await AsyncStorage.getItem(STORAGE_KEY_FASTING);
        const all: FastingRecord[] = raw ? JSON.parse(raw) : [];
        setRecords(all.filter((r) => r.record_date >= startDate && r.record_date <= endDate));
      }
    } catch (err) {
      console.error('Error loading records', err);
    } finally {
      setLoading(false);
    }
  }, [user, weekDates[0]?.toISOString(), weekDates[6]?.toISOString()]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // ── Save level ──
  const handleSelectLevel = async (key: FastingLevelKey) => {
    setFastingLevel(key);
    setShowLevelSelector(false);

    try {
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({ fasting_level: key })
          .eq('id', user.id);
      } else {
        await AsyncStorage.setItem(STORAGE_KEY_FASTING_LEVEL, key);
      }
      const level = getLevelByKey(key);
      Alert.alert('Sucesso', `Nível ${level?.emoji} ${level?.name} selecionado!`);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar o nível.');
    }
  };

  // ── Save record ──
  const handleSaveRecord = async (data: {
    status: FastingStatus;
    fast_start_time: string | null;
    fast_end_time: string | null;
    fasting_hours: number | null;
    observations: string | null;
  }) => {
    if (selectedDayIndex === null || !fastingLevel) return;

    const date = weekDates[selectedDayIndex];
    const dayOfWeek = date.getDay();
    const level = getLevelByKey(fastingLevel)!;
    const protocol = level.weekProtocols[dayOfWeek];
    const dateStr = toDateStr(date);

    const record: FastingRecord = {
      fasting_level: fastingLevel,
      week_number: offsetWeek,
      day_of_week: dayOfWeek,
      record_date: dateStr,
      protocol: protocol.label,
      ...data,
    };

    try {
      if (user?.id) {
        const { data: existing } = await supabase
          .from('fasting_records')
          .select('id')
          .eq('user_id', user.id)
          .eq('record_date', dateStr)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('fasting_records')
            .update({
              fasting_level: record.fasting_level,
              week_number: record.week_number,
              day_of_week: record.day_of_week,
              protocol: record.protocol,
              status: record.status,
              fast_start_time: record.fast_start_time,
              fast_end_time: record.fast_end_time,
              fasting_hours: record.fasting_hours,
              observations: record.observations,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        } else {
          await supabase.from('fasting_records').insert({
            user_id: user.id,
            ...record,
          });
        }
      } else {
        const raw = await AsyncStorage.getItem(STORAGE_KEY_FASTING);
        const all: FastingRecord[] = raw ? JSON.parse(raw) : [];
        const idx = all.findIndex((r) => r.record_date === dateStr);
        if (idx >= 0) {
          all[idx] = record;
        } else {
          all.push(record);
        }
        await AsyncStorage.setItem(STORAGE_KEY_FASTING, JSON.stringify(all));
      }

      await loadRecords();
      Alert.alert('Sucesso', 'Jejum registrado! 🎉');
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Erro ao salvar registro');
    }
  };

  // ── Metrics ──
  const level = fastingLevel ? getLevelByKey(fastingLevel) : null;

  const weekStats = (() => {
    if (!level) return { adherence: 0, totalHours: 0, streak: 0, daysCompleted: 0, daysRequired: 0 };

    let daysRequired = 0;
    let daysCompleted = 0;
    let totalHours = 0;

    for (let i = 0; i < 7; i++) {
      const d = weekDates[i];
      const dow = d.getDay();
      const prot = level.weekProtocols[dow];
      if (prot.isFree) continue;
      daysRequired++;

      const rec = records.find((r) => r.record_date === toDateStr(d));
      if (rec?.status === 'completed') {
        daysCompleted++;
        totalHours += rec.fasting_hours ?? prot.fastingHours;
      } else if (rec?.status === 'partial') {
        totalHours += rec.fasting_hours ?? Math.round(prot.fastingHours * 0.7);
      }
    }

    const adherence = daysRequired > 0 ? Math.round((daysCompleted / daysRequired) * 100) : 0;

    // Streak
    let streak = 0;
    const sortedDates = [...weekDates].sort((a, b) => b.getTime() - a.getTime());
    for (const d of sortedDates) {
      const dow = d.getDay();
      const prot = level.weekProtocols[dow];
      if (prot.isFree) continue;
      const rec = records.find((r) => r.record_date === toDateStr(d));
      if (rec?.status === 'completed') {
        streak++;
      } else {
        break;
      }
    }

    return { adherence, totalHours, streak, daysCompleted, daysRequired };
  })();

  const getRecordForDay = (date: Date): FastingRecord | null => {
    return records.find((r) => r.record_date === toDateStr(date)) || null;
  };

  const getStatusForDay = (date: Date): FastingStatus => {
    const rec = getRecordForDay(date);
    return rec?.status || 'pending';
  };

  const weekLabel = (() => {
    const s = weekDates[0];
    const e = weekDates[6];
    const sDay = s.getDate();
    const eDay = e.getDate();
    const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const sMonth = monthNames[s.getMonth()];
    const eMonth = monthNames[e.getMonth()];
    if (s.getMonth() === e.getMonth()) {
      return `${sDay} – ${eDay} ${sMonth}`;
    }
    return `${sDay} ${sMonth} – ${eDay} ${eMonth}`;
  })();

  const selectedDate = selectedDayIndex !== null ? weekDates[selectedDayIndex] : null;
  const selectedProtocol = selectedDate && level ? level.weekProtocols[selectedDate.getDay()] : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
          <Typography style={styles.headerIcon}>←</Typography>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.heartCircle}>
            <Typography style={styles.heartIcon}>🤍</Typography>
          </View>
          <Typography variant="h3" style={styles.headerTitle}>Meu Jejum</Typography>
        </View>

        <View style={styles.headerIconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {showLevelSelector && (
          <FastingLevelSelector
            selected={fastingLevel}
            onSelect={handleSelectLevel}
          />
        )}

        {level && !showLevelSelector && (
          <View style={styles.levelHeader}>
            <View style={styles.levelHeaderLeft}>
              <Typography style={styles.levelEmoji}>{level.emoji}</Typography>
              <View>
                <Typography variant="h4">Nível {level.name}</Typography>
                <Typography variant="caption" color="mutedForeground">{level.description}</Typography>
              </View>
            </View>
            <TouchableOpacity onPress={() => setShowLevelSelector(true)}>
              <Typography variant="caption" color="primary" weight="semibold">Alterar</Typography>
            </TouchableOpacity>
          </View>
        )}

        {level && !showLevelSelector && (
          <View style={styles.metricsGrid}>
            <Card style={styles.metricCard}>
              <Typography style={styles.metricEmoji}>📈</Typography>
              <Typography variant="h3">{weekStats.adherence}%</Typography>
              <Typography variant="caption" color="mutedForeground">Aderência</Typography>
            </Card>
            <Card style={styles.metricCard}>
              <Typography style={styles.metricEmoji}>⏱️</Typography>
              <Typography variant="h3">{weekStats.totalHours}h</Typography>
              <Typography variant="caption" color="mutedForeground">Total jejum</Typography>
            </Card>
            <Card style={styles.metricCard}>
              <Typography style={styles.metricEmoji}>🔥</Typography>
              <Typography variant="h3">{weekStats.streak}</Typography>
              <Typography variant="caption" color="mutedForeground">Sequência</Typography>
            </Card>
          </View>
        )}

        {level && !showLevelSelector && (
          <View style={styles.weekNav}>
            <TouchableOpacity 
              style={styles.navBtn} 
              onPress={() => setWeekOffset(p => p - 1)}
            >
              <Typography>◀</Typography>
            </TouchableOpacity>
            
            <View style={styles.weekLabelContainer}>
              <Typography variant="body" weight="semibold">{weekLabel}</Typography>
              {weekOffset === 0 && (
                <Typography variant="caption" color="primary" weight="semibold">Semana atual</Typography>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.navBtn, weekOffset >= 0 && styles.navBtnDisabled]} 
              onPress={() => setWeekOffset(p => Math.min(p + 1, 0))}
              disabled={weekOffset >= 0}
            >
              <Typography style={weekOffset >= 0 ? {opacity: 0.3} : {}}>▶</Typography>
            </TouchableOpacity>
          </View>
        )}

        {level && !showLevelSelector && !loading && (
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysGrid}
          >
            {weekDates.map((date, idx) => {
              const dow = date.getDay();
              const protocol = level.weekProtocols[dow];
              const isToday = toDateStr(date) === toDateStr(today);

              return (
                <View key={toDateStr(date)} style={styles.dayCardWrapper}>
                  <FastingDayCard
                    dayOfWeek={dow}
                    date={date}
                    protocol={protocol}
                    status={getStatusForDay(date)}
                    isToday={isToday}
                    onClick={() => {
                      if (!protocol.isFree) {
                        setSelectedDayIndex(idx);
                        setDialogOpen(true);
                      }
                    }}
                  />
                </View>
              );
            })}
          </ScrollView>
        )}

        {level && !showLevelSelector && loading && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={tokens.colors.primary} />
          </View>
        )}

        {level && !showLevelSelector && (
          <Card style={styles.legendCard}>
            <Typography variant="caption" weight="semibold" color="mutedForeground" style={styles.legendTitle}>
              LEGENDA
            </Typography>
            <View style={styles.legendGrid}>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <View key={key} style={styles.legendItem}>
                  <Typography style={{ fontSize: 12 }}>{config.emoji}</Typography>
                  <Typography variant="caption" color={config.color as any}>{config.label}</Typography>
                </View>
              ))}
            </View>
          </Card>
        )}

        <TouchableOpacity 
          style={styles.bottomBackBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Typography style={styles.bottomBackBtnText}>←  Voltar ao Dashboard</Typography>
        </TouchableOpacity>
      </ScrollView>

      {selectedDate && selectedProtocol && (
        <FastingRegistrationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          date={selectedDate}
          dayOfWeek={selectedDate.getDay()}
          protocol={selectedProtocol}
          existingRecord={getRecordForDay(selectedDate)}
          onSave={handleSaveRecord}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFBF8', // very light cream background matching the image
  },
  header: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FCFBF8',
  },
  headerIconBtn: {
    padding: tokens.spacing.xs,
  },
  headerIcon: {
    fontSize: 24,
    color: '#888888',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  heartCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DE5D83', // pink/red color from image
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  scrollContent: {
    padding: tokens.spacing.lg,
    paddingBottom: 40,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
  },
  levelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    flex: 1,
  },
  levelEmoji: {
    fontSize: 32,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.xl,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    padding: tokens.spacing.sm,
  },
  metricEmoji: {
    marginBottom: 4,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.lg,
  },
  navBtn: {
    padding: tokens.spacing.sm,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.colors.muted,
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  weekLabelContainer: {
    alignItems: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.xl,
    paddingHorizontal: 2, // Para a sombra não ser cortada
    paddingVertical: 10,
  },
  dayCardWrapper: {
    // A largura e altura do card agora são ditadas pelo FastingDayCard
  },
  legendCard: {
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  legendTitle: {
    marginBottom: tokens.spacing.sm,
    letterSpacing: 1,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '45%',
  },
  bottomBackBtn: {
    marginTop: tokens.spacing.xl,
    backgroundColor: '#F8F4EC',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBackBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  }
});
