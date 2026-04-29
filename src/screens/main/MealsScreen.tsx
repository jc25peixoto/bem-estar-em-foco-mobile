import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui/Typography';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { useEffectiveUser } from '../../stores/useAuthStore';
import { supabase } from '../../lib/supabase';
import { getWeekDates, toDateStr } from '../../lib/fastingConfig';
import { uploadMealPhotoBase64, MEAL_PHOTOS_BUCKET } from '../../lib/mealPhotos';

import type { MealRecord } from '../../types/meal';
import { MealDayGroup } from '../../components/meals/MealDayGroup';
import { MealRegistrationDialog } from '../../components/meals/MealRegistrationDialog';

export function MealsScreen() {
  const user = useEffectiveUser();
  const navigation = useNavigation<any>();

  const [weekOffset, setWeekOffset] = useState(0);
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDayIndex, setExpandedDayIndex] = useState<number | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(1);
  const [selectedRecord, setSelectedRecord] = useState<MealRecord | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<string>('cafe_manha');

  // Photo URLs cache
  const [photoUrls, setPhotoUrls] = useState<Record<string, string | null>>({});

  const today = new Date();
  const refDate = new Date(today);
  refDate.setDate(refDate.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(refDate);
  const weekStart = toDateStr(weekDates[0]);
  const weekEnd = toDateStr(weekDates[6]);

  const loadRecords = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const { data: mealData, error: mealErr } = await supabase
        .from('meal_records')
        .select('*')
        .eq('user_id', user.id)
        .gte('record_date', weekStart)
        .lte('record_date', weekEnd)
        .order('record_date', { ascending: true })
        .order('slot_index', { ascending: true });

      if (!mealErr && mealData) {
        setRecords(mealData as MealRecord[]);
        
        const urlMap: Record<string, string | null> = {};
        const recordsWithPhotos = (mealData as MealRecord[]).filter(r => r.photo_url);
        
        for (const rec of recordsWithPhotos) {
          if (rec.photo_url && rec.id) {
            const { data: urlData } = supabase.storage
              .from(MEAL_PHOTOS_BUCKET)
              .getPublicUrl(rec.photo_url);
            urlMap[rec.id] = urlData?.publicUrl || null;
          }
        }
        setPhotoUrls(urlMap);

        // Inicializar o dia expandido como o dia de hoje, se estiver na semana atual
        if (weekOffset === 0 && expandedDayIndex === null) {
          const todayStr = toDateStr(today);
          const index = weekDates.findIndex(d => toDateStr(d) === todayStr);
          if (index !== -1) setExpandedDayIndex(index);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar refeições:', err);
    }
    setLoading(false);
  }, [user?.id, weekStart, weekEnd, weekOffset, expandedDayIndex]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleSaveMeal = async (data: any) => {
    if (!user?.id || !selectedDate) return;

    try {
      const dateStr = toDateStr(selectedDate);
      let photoPath: string | null = selectedRecord?.photo_url || null;

      if (data.photoBase64) {
        photoPath = await uploadMealPhotoBase64(
          user.id,
          dateStr,
          selectedSlotIndex,
          data.photoBase64
        );
      }

      const record = {
        user_id: user.id,
        record_date: dateStr,
        slot_index: selectedSlotIndex,
        meal_type: data.meal_type,
        meal_time: data.meal_time,
        fasting_time: data.fasting_time,
        description: data.description,
        photo_url: photoPath,
        observations: data.observations,
      };

      const { data: existing } = await supabase
        .from('meal_records')
        .select('id')
        .eq('user_id', user.id)
        .eq('record_date', dateStr)
        .eq('meal_type', data.meal_type) // Usar meal_type como chave principal
        .maybeSingle();

      if (existing) {
        await supabase.from('meal_records').update({ ...record, updated_at: new Date().toISOString() }).eq('id', existing.id);
      } else {
        await supabase.from('meal_records').insert(record);
      }

      await loadRecords();
      Alert.alert("Sucesso", "Refeição salva com sucesso!");
    } catch (err) {
      Alert.alert("Erro", "Erro ao salvar refeição.");
    }
  };

  const handleDeleteMeal = async (record: MealRecord) => {
    if (!record.id) return;
    try {
      if (record.photo_url) {
        await supabase.storage.from(MEAL_PHOTOS_BUCKET).remove([record.photo_url]);
      }
      await supabase.from('meal_records').delete().eq('id', record.id);
      await loadRecords();
    } catch (err) {
      Alert.alert("Erro", "Erro ao excluir refeição.");
    }
  };

  const openDialog = (slotIndex: number, existingRecord: MealRecord | null, mealType: string, date: Date) => {
    setSelectedDate(date);
    setSelectedSlotIndex(slotIndex);
    setSelectedRecord(existingRecord);
    setSelectedMealType(mealType);
    setDialogOpen(true);
  };

  const getRecordsForDate = (date: Date): MealRecord[] => {
    const ds = toDateStr(date);
    return records.filter((r) => r.record_date === ds);
  };

  const weekLabel = (() => {
    const s = weekDates[0];
    const e = weekDates[6];
    const sMonth = s.toLocaleString('pt-BR', { month: 'short' });
    const eMonth = e.toLocaleString('pt-BR', { month: 'short' });
    if (s.getMonth() === e.getMonth()) return `${s.getDate()} ${sMonth}. – ${e.getDate()} ${eMonth}.`;
    return `${s.getDate()} ${sMonth} – ${e.getDate()} ${eMonth}`;
  })();

  const totalMeals = records.filter((r) => r.description || r.meal_time || r.photo_url).length;
  const daysWithRecords = new Set(records.filter((r) => r.description || r.meal_time || r.photo_url).map((r) => r.record_date)).size;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={tokens.colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <View style={styles.headerIconCircle}>
            <Feather name="coffee" size={16} color="#FFF" />
          </View>
          <Typography variant="h3">Minhas Refeições</Typography>
          <Feather name="chevron-down" size={18} color={tokens.colors.foreground} style={{ marginLeft: 4 }} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!loading && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Typography variant="h2" weight="bold">{totalMeals}</Typography>
              <Typography variant="caption" color="mutedForeground">Refeições registradas</Typography>
            </View>
            <View style={styles.statCard}>
              <Typography variant="h2" weight="bold">{daysWithRecords}/7</Typography>
              <Typography variant="caption" color="mutedForeground">Dias com registro</Typography>
            </View>
          </View>
        )}

        <View style={styles.weekNav}>
          <TouchableOpacity onPress={() => setWeekOffset(p => p - 1)} style={styles.navBtn}>
            <Feather name="chevron-left" size={20} color={tokens.colors.mutedForeground} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Typography variant="body" weight="bold" style={{ fontSize: 14 }}>{weekLabel}</Typography>
            {weekOffset === 0 && <Typography variant="caption" color="primary" weight="bold" style={{ fontSize: 10 }}>Semana atual</Typography>}
          </View>
          <TouchableOpacity 
            onPress={() => setWeekOffset(p => Math.min(p + 1, 0))} 
            style={[styles.navBtn, weekOffset >= 0 && { opacity: 0.3 }]}
            disabled={weekOffset >= 0}
          >
            <Feather name="chevron-right" size={20} color={tokens.colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={tokens.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.daysContainer}>
            {weekDates.map((date, idx) => {
              const dateStr = toDateStr(date);
              const isToday = dateStr === toDateStr(today);
              return (
                <MealDayGroup
                  key={dateStr}
                  date={date}
                  dayNumber={idx + 1}
                  records={getRecordsForDate(date)}
                  isToday={isToday}
                  isExpanded={expandedDayIndex === idx}
                  onToggle={() => setExpandedDayIndex(expandedDayIndex === idx ? null : idx)}
                  onEditSlot={(slotIndex, existingRecord, mealType) => openDialog(slotIndex, existingRecord, mealType, date)}
                  onDeleteSlot={handleDeleteMeal}
                  mealPhotoUrls={photoUrls}
                />
              );
            })}
          </View>
        )}

        <TouchableOpacity 
          style={styles.bottomBackBtn} 
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={18} color={tokens.colors.foreground} />
          <Typography variant="body" weight="bold">Voltar ao Dashboard</Typography>
        </TouchableOpacity>
      </ScrollView>

      {selectedDate && (
        <MealRegistrationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          date={selectedDate}
          slotIndex={selectedSlotIndex}
          existingRecord={selectedRecord}
          initialMealType={selectedMealType}
          onSave={handleSaveMeal}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: tokens.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  backBtn: { padding: tokens.spacing.sm },
  scrollContent: { padding: tokens.spacing.md, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  weekNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
    paddingHorizontal: tokens.spacing.sm,
  },
  navBtn: { padding: tokens.spacing.sm },
  daysContainer: { gap: tokens.spacing.sm, marginBottom: tokens.spacing.xl },
  bottomBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
    paddingVertical: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colors.card,
  },
});

