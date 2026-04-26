import { create } from 'zustand';
import { UserData } from '../types';

interface AuthState {
  currentUser: UserData | null;
  isAdmin: boolean;
  viewingAs: UserData | null;
  authReady: boolean;
  session: any | null;
  
  isImpersonating: boolean;
  effectiveUser: UserData | null;
  
  // Actions
  setSession: (session: any | null) => void;
  setCurrentUser: (user: UserData | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
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
  isImpersonating: false,
  effectiveUser: null,

  setSession: (session) => set({ session }),
  setCurrentUser: (user) => set((state) => ({ 
    currentUser: user, 
    isAdmin: user?.isAdmin || user?.tipoAcesso === 2 || state.isAdmin,
    effectiveUser: state.viewingAs || user
  })),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  setAuthReady: (ready) => set({ authReady: ready }),
  
  startImpersonation: (user) => set((state) => ({ 
    viewingAs: user,
    isImpersonating: true,
    effectiveUser: user
  })),
  stopImpersonation: () => set((state) => ({ 
    viewingAs: null,
    isImpersonating: false,
    effectiveUser: state.currentUser
  })),
}));

export const useEffectiveUser = () => {
  return useAuthStore((state) => state.effectiveUser);
};
