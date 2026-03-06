import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';

interface AuthStore {
  session: Session | null;
  user: User | null;
  loading: boolean;
  language: string | null;
  householdSize: number | null;
  state: string | null;
  onboardingComplete: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setLanguage: (language: string) => void;
  setHouseholdSize: (size: number) => void;
  setState: (state: string) => void;
  setOnboardingComplete: (complete: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  loading: true,
  language: null,
  householdSize: null,
  state: null,
  onboardingComplete: false,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setLanguage: (language) => set({ language }),
  setHouseholdSize: (householdSize) => set({ householdSize }),
  setState: (state) => set({ state }),
  setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
}));
