export const MEAL_TYPES = [
  { id: 'cafe_manha', label: 'Café da Manhã' },
  { id: 'almoco', label: 'Almoço' },
  { id: 'lanche', label: 'Lanche' },
  { id: 'jantar', label: 'Jantar' },
  { id: 'outro', label: 'Outro' },
] as const;

export type MealTypeKey = typeof MEAL_TYPES[number]['id'];

export const getMealTypeLabel = (id: string): string => {
  const meal = MEAL_TYPES.find((m) => m.id === id);
  return meal ? meal.label : 'Desconhecido';
};
