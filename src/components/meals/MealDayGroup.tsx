import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Typography } from '../ui/Typography';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { tokens } from '../../theme/tokens';
import type { MealRecord } from '../../types/meal';
import { MEAL_TYPES, getMealTypeLabel } from '../../lib/mealConfig';

const DAY_NAMES_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

interface MealDayGroupProps {
  date: Date;
  dayNumber: number;
  records: MealRecord[];
  isToday: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onEditSlot: (slotIndex: number, existingRecord: MealRecord | null, mealType: string) => void;
  onDeleteSlot: (record: MealRecord) => void;
  mealPhotoUrls: Record<string, string | null>;
}

const MEAL_COLORS: Record<string, string> = {
  cafe_manha: '#FFF4E5',
  almoco: '#FFE5E5',
  lanche: '#FFE5F0',
  jantar: '#F0E5FF',
  outro: '#F5F5F5',
};

const MEAL_TEXT_COLORS: Record<string, string> = {
  cafe_manha: '#B7791F',
  almoco: '#C53030',
  lanche: '#D53F8C',
  jantar: '#6B46C1',
  outro: '#718096',
};

export function MealDayGroup({
  date,
  dayNumber,
  records,
  isToday,
  isExpanded,
  onToggle,
  onEditSlot,
  onDeleteSlot,
  mealPhotoUrls,
}: MealDayGroupProps) {
  const dayName = DAY_NAMES_SHORT[date.getDay()];
  const dayOfMonth = date.getDate();

  const handleDelete = (record: MealRecord) => {
    Alert.alert(
      "Excluir Refeição",
      "Tem certeza que deseja excluir este registro?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => onDeleteSlot(record) }
      ]
    );
  };

  const hasRecords = records.some(r => r.description || r.meal_time || r.photo_url);

  return (
    <View style={[styles.container, isToday && styles.todayContainer, isExpanded && styles.expandedContainer]}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.dateCircle, isToday && styles.todayCircle]}>
            <Typography variant="caption" style={[styles.dateDayName, isToday && styles.todayText]}>{dayName}</Typography>
            <Typography variant="h3" style={[styles.dateDayNumber, isToday && styles.todayText]}>{dayOfMonth}</Typography>
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.titleRow}>
              <Typography variant="body" weight="bold">Dia {dayNumber}</Typography>
              {isToday && (
                <View style={styles.todayBadge}>
                  <Typography variant="caption" style={styles.todayBadgeText}>Hoje</Typography>
                </View>
              )}
            </View>
            <Typography variant="caption" color="mutedForeground">
              {hasRecords ? `${records.length} registro(s)` : 'Nenhum registro ainda'}
            </Typography>
          </View>
        </View>
        <Feather 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={tokens.colors.mutedForeground} 
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.slotsContainer}>
          {MEAL_TYPES.map((type, index) => {
            // No mobile, estamos usando meal_type como identificador principal.
            // Para manter compatibilidade com slots da web, vamos procurar por meal_type.
            const record = records.find((r) => r.meal_type === type.id) || null;
            const hasData = record && (record.description || record.meal_time || record.photo_url);
            const photoUrl = record?.id ? mealPhotoUrls[record.id] : null;

            return (
              <TouchableOpacity 
                key={type.id} 
                style={[styles.slot, hasData && styles.slotFilled]}
                onPress={() => onEditSlot(index + 1, record, type.id)}
                activeOpacity={0.7}
              >
                <View style={styles.slotHeader}>
                  <View style={[styles.mealBadge, { backgroundColor: MEAL_COLORS[type.id] || '#F5F5F5' }]}>
                    <Typography 
                      variant="caption" 
                      weight="bold" 
                      style={{ color: MEAL_TEXT_COLORS[type.id] || '#718096', fontSize: 10 }}
                    >
                      {type.label}
                    </Typography>
                  </View>
                  <TouchableOpacity 
                    onPress={() => onEditSlot(index + 1, record, type.id)}
                    style={styles.pencilBtn}
                  >
                    <Feather name="edit-2" size={14} color={tokens.colors.mutedForeground} />
                  </TouchableOpacity>
                </View>

                {!hasData ? (
                  <View style={styles.emptySlotContent}>
                    <Typography variant="caption" color="mutedForeground">+ Toque para registrar</Typography>
                  </View>
                ) : (
                  <View style={styles.filledSlotContent}>
                    {photoUrl ? (
                      <Image
                        source={{ uri: photoUrl }}
                        style={styles.mealImage}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : null}
                    
                    <View style={styles.slotDetails}>
                      {record.meal_time && (
                        <Typography variant="caption" weight="medium" style={styles.timeText}>
                          🕒 {record.meal_time} {record.fasting_time ? `• Jejum: ${record.fasting_time}` : ''}
                        </Typography>
                      )}
                      {record.description && (
                        <Typography variant="caption" style={styles.descText}>
                          {record.description}
                        </Typography>
                      )}
                    </View>

                    <TouchableOpacity 
                      onPress={() => handleDelete(record)} 
                      style={styles.deleteBtn}
                    >
                      <Feather name="trash-2" size={14} color={tokens.colors.destructive} />
                    </TouchableOpacity>

                    {/* Feedback da nutricionista */}
                    {record.obs_externas_admin && (
                      <View style={styles.evaluationBox}>
                        <Typography variant="caption" weight="bold" style={styles.evaluationTitle}>
                          💬 Feedback da nutricionista
                        </Typography>
                        <Typography variant="caption" style={styles.evaluationText}>
                          {record.obs_externas_admin}
                        </Typography>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginBottom: tokens.spacing.sm,
  },
  expandedContainer: {
    borderColor: 'rgba(233, 80, 101, 0.3)',
  },
  todayContainer: {
    borderColor: tokens.colors.primary,
    backgroundColor: '#FFF5F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  dateCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: tokens.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    backgroundColor: tokens.colors.primary,
  },
  dateDayName: {
    fontSize: 8,
    color: tokens.colors.mutedForeground,
    lineHeight: 10,
  },
  dateDayNumber: {
    fontSize: 16,
    color: tokens.colors.foreground,
    lineHeight: 18,
  },
  todayText: {
    color: '#FFF',
  },
  headerInfo: {
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  todayBadge: {
    backgroundColor: 'rgba(233, 80, 101, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  todayBadgeText: {
    color: tokens.colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  slotsContainer: {
    marginTop: tokens.spacing.sm,
    gap: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.xs,
  },
  slot: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.sm,
    borderStyle: 'dashed',
    minHeight: 80,
  },
  slotFilled: {
    borderStyle: 'solid',
    backgroundColor: tokens.colors.card,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.xs,
  },
  mealBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pencilBtn: {
    padding: 4,
  },
  emptySlotContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing.xs,
  },
  filledSlotContent: {
    flex: 1,
  },
  mealImage: {
    width: '100%',
    height: 120,
    borderRadius: tokens.radius.md,
    marginBottom: tokens.spacing.sm,
  },
  slotDetails: {
    gap: 2,
  },
  timeText: {
    color: tokens.colors.mutedForeground,
  },
  descText: {
    color: tokens.colors.foreground,
  },
  deleteBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    padding: 8,
  },
  evaluationBox: {
    marginTop: tokens.spacing.sm,
    padding: tokens.spacing.sm,
    backgroundColor: '#F5F3FF',
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: '#E9E4FF',
  },
  evaluationTitle: {
    color: '#7C3AED',
    marginBottom: 4,
  },
  evaluationText: {
    color: '#5B21B6',
    lineHeight: 16,
  },
});

