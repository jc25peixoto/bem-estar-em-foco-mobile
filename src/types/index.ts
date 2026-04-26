export interface UserData {
  id: string;
  name: string;
  email: string;
  turmaId?: string;
  onboardingComplete: boolean;
  isAdmin?: boolean;
  tipoAcesso?: number;
}
