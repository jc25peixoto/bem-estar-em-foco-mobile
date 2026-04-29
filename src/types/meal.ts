export interface MealRecord {
  id?: string;
  user_id?: string;
  record_date: string;
  slot_index: number;
  meal_type: string;
  meal_time?: string | null;
  fasting_time?: string | null;
  description?: string | null;
  photo_url?: string | null;
  observations?: string | null;
  edited_by_admin?: boolean;
  admin_edited_at?: string | null;
  admin_editor_id?: string | null;
  obs_internas_admin?: string | null;
  obs_externas_admin?: string | null;
  avaliacao_feita?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MealPeriodSummary {
  id?: string;
  user_id?: string;
  week_start: string;
  week_end: string;
  initial_weight?: number | null;
  final_weight?: number | null;
  created_at?: string;
  updated_at?: string;
}
