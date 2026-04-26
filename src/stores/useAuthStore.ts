import { create } from 'zustand';
import { UserData } from '../types';

interface AuthState {
  currentUser: UserData | null;
  isAdmin: boolean;
  viewingAs: UserData | null;
  authReady: boolean;
  session: any | null;
  
  // Actions
  setSession: (session: any | null) => void;
  setCurrentUser: (user: UserData | null) => void;
  setAuthReady: (ready: boolean) => void;
  startImpersonation: (user: UserData) => void;
  stopImpersonation: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAdmin: false,
  viewingAs: null,
  authReady: false,
  session: null,

  setSession: (session) => set({ session }),
  setCurrentUser: (user) => set({ 
    currentUser: user, 
    isAdmin: user?.isAdmin || user?.tipoAcesso === 2 
  }),
  setAuthReady: (ready) => set({ authReady: ready }),
  
  startImpersonation: (user) => set({ viewingAs: user }),
  stopImpersonation: () => set({ viewingAs: null }),
}));

export const useEffectiveUser = () => {
  const { currentUser, viewingAs } = useAuthStore();
  return viewingAs || currentUser;
};
