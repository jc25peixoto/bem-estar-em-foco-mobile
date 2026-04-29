export interface UserData {
  id: string;
  name: string;
  email: string;
  turmaId?: string;
  onboardingComplete: boolean;
  isAdmin?: boolean;
  tipoAcesso?: number;
  phone?: string;
  birthDate?: string;
  city?: string;
  state?: string;
  occupation?: string;
  goals?: string;
  rankingVisible?: boolean;
  mealLoggingEnabled?: boolean;
  initialData?: {
    measurements?: {
      peso: number;
      cintura: number;
      quadril: number;
      braco: number;
      coxa: number;
      altura: number;
    };
    symptoms?: Record<string, number | boolean | string>;
    date?: string;
  };
}
