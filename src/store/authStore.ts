import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { ProfileRow } from "@/types/database";

type ProfilePatch = Partial<
  Pick<ProfileRow, "name" | "username" | "bio" | "favourite_food" | "favourite_drink" | "avatar_url">
>;

interface SignUpResult {
  ok: boolean;
  /** True when email confirmation is required before a session exists. */
  needsEmailConfirmation?: boolean;
}

interface AuthState {
  session: Session | null;
  profile: ProfileRow | null;
  /** True until the first session check (from disk) resolves. */
  initializing: boolean;
  profileLoading: boolean;
  authError: string | null;

  signUp: (email: string, password: string, name: string, username: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  initializing: true,
  profileLoading: false,
  authError: null,

  signUp: async (email, password, name, username) => {
    set({ authError: null });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, username } },
    });
    if (error) {
      set({ authError: error.message });
      return { ok: false };
    }
    return { ok: true, needsEmailConfirmation: !data.session };
  },

  signIn: async (email, password) => {
    set({ authError: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ authError: error.message });
      return false;
    }
    return true;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ profile: null });
  },

  refreshProfile: async () => {
    const userId = get().session?.user.id;
    if (!userId) return;
    set({ profileLoading: true });
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (!error && data) set({ profile: data });
    set({ profileLoading: false });
  },

  updateProfile: async (patch) => {
    const userId = get().session?.user.id;
    if (!userId) return false;
    set({ authError: null });
    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", userId)
      .select()
      .single();
    if (error) {
      set({ authError: error.message });
      return false;
    }
    if (data) set({ profile: data });
    return true;
  },

  clearError: () => set({ authError: null }),
}));

if (isSupabaseConfigured) {
  supabase.auth.getSession().then(({ data }) => {
    useAuthStore.setState({ session: data.session, initializing: false });
    if (data.session) useAuthStore.getState().refreshProfile();
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.setState({ session, initializing: false });
    if (session) {
      useAuthStore.getState().refreshProfile();
    } else {
      useAuthStore.setState({ profile: null });
    }
  });
} else {
  // No credentials yet — skip straight past the loading state so the app
  // (and its mock data) keeps working in Expo Go.
  useAuthStore.setState({ initializing: false });
}
