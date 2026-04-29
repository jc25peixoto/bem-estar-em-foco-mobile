/**
 * Configuração dos níveis e protocolos de jejum intermitente.
 * Adaptado para React Native (Mobile).
 *
 * dayOfWeek: 0 = Domingo, 1 = Segunda … 6 = Sábado
 */

export type FastingLevelKey = 'iniciante' | 'intermediario' | 'avancado' | 'expert';

export type FastingStatus = 'completed' | 'partial' | 'missed' | 'free' | 'pending';

export interface FastingProtocol {
  /** Ex: "12:12", "16:8", "livre" */
  label: string;
  /** Horas de jejum esperadas (0 para dia livre) */
  fastingHours: number;
  /** Horas de alimentação */
  eatingHours: number;
  /** Se é dia livre */
  isFree: boolean;
}

export interface FastingLevel {
  key: FastingLevelKey;
  name: string;
  emoji: string;
  description: string;
  /** Protocolo para cada dia da semana (0-6) */
  weekProtocols: Record<number, FastingProtocol>;
}

const FREE: FastingProtocol = { label: 'Livre', fastingHours: 0, eatingHours: 24, isFree: true };
const P12_12: FastingProtocol = { label: '12:12', fastingHours: 12, eatingHours: 12, isFree: false };
const P14_10: FastingProtocol = { label: '14:10', fastingHours: 14, eatingHours: 10, isFree: false };
const P16_8: FastingProtocol = { label: '16:8', fastingHours: 16, eatingHours: 8, isFree: false };
const P18_6: FastingProtocol = { label: '18:6', fastingHours: 18, eatingHours: 6, isFree: false };

export const FASTING_LEVELS: FastingLevel[] = [
  {
    key: 'iniciante',
    name: 'Iniciante',
    emoji: '🌱',
    description: '12h de jejum / 12h de alimentação nos dias úteis',
    weekProtocols: {
      0: FREE,     // Dom
      1: P12_12,   // Seg
      2: P12_12,   // Ter
      3: P12_12,   // Qua
      4: P12_12,   // Qui
      5: P12_12,   // Sex
      6: FREE,     // Sáb
    },
  },
  {
    key: 'intermediario',
    name: 'Intermediário',
    emoji: '🌿',
    description: '14h de jejum nos dias úteis, 12h no sábado',
    weekProtocols: {
      0: FREE,
      1: P14_10,
      2: P14_10,
      3: P14_10,
      4: P14_10,
      5: P14_10,
      6: P12_12,
    },
  },
  {
    key: 'avancado',
    name: 'Avançado',
    emoji: '🔥',
    description: '16h de jejum nos dias úteis, progressivo no fim de semana',
    weekProtocols: {
      0: P12_12,
      1: P16_8,
      2: P16_8,
      3: P16_8,
      4: P16_8,
      5: P16_8,
      6: P14_10,
    },
  },
  {
    key: 'expert',
    name: 'Expert',
    emoji: '⚡',
    description: '18h de jejum seg-qui, progressivo nos demais dias',
    weekProtocols: {
      0: FREE,
      1: P18_6,
      2: P18_6,
      3: P18_6,
      4: P18_6,
      5: P16_8,
      6: P14_10,
    },
  },
];

export function getLevelByKey(key: FastingLevelKey): FastingLevel | undefined {
  return FASTING_LEVELS.find((l) => l.key === key);
}

/** Nomes dos dias da semana em pt-BR (0 = Dom) */
export const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const DAY_NAMES_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/** Retorna as datas (Date) da semana que contém a data fornecida (seg-dom) */
export function getWeekDates(referenceDate: Date = new Date()): Date[] {
  const d = new Date(referenceDate);
  // Ajustar para segunda-feira como início da semana
  const dayIdx = d.getDay(); // 0=dom
  const mondayOffset = dayIdx === 0 ? -6 : 1 - dayIdx;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    dates.push(dd);
  }
  return dates;
}

/** Formata Date para "YYYY-MM-DD" */
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface FastingRecord {
  id?: string;
  user_id?: string;
  fasting_level: string;
  week_number: number;
  day_of_week: number;
  record_date: string;
  protocol: string;
  status: FastingStatus;
  fast_start_time?: string | null;
  fast_end_time?: string | null;
  fasting_hours?: number | null;
  observations?: string | null;
}

export const STATUS_CONFIG: Record<FastingStatus, { label: string; emoji: string; color: 'success' | 'warning' | 'destructive' | 'mutedForeground' }> = {
  completed: { label: 'Concluído', emoji: '✅', color: 'success' },
  partial: { label: 'Parcial', emoji: '🟡', color: 'warning' },
  missed: { label: 'Não realizado', emoji: '❌', color: 'destructive' },
  free: { label: 'Livre', emoji: '🔓', color: 'mutedForeground' },
  pending: { label: 'Pendente', emoji: '⏳', color: 'mutedForeground' },
};
