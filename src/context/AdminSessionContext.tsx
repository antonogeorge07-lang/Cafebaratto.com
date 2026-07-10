import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type OwnerProfile = { name: string; email: string };

type AuthResult = { ok: boolean; error?: string };

type Ctx = {
  isAuthenticated: boolean;
  isLoading: boolean;
  isEditMode: boolean;
  setEditMode: (v: boolean) => void;
  profile: OwnerProfile;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (input: { name: string; email: string; password: string }) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateProfile: (p: Partial<OwnerProfile>) => Promise<void>;
  changePassword: (nextPassword: string) => Promise<AuthResult>;
  sendPasswordResetEmail: (email: string) => Promise<AuthResult>;
};

const AdminSessionContext = createContext<Ctx>({
  isAuthenticated: false,
  isLoading: true,
  isEditMode: false,
  setEditMode: () => {},
  profile: { name: "", email: "" },
  signIn: async () => ({ ok: false }),
  signUp: async () => ({ ok: false }),
  signOut: async () => {},
  updateProfile: async () => {},
  changePassword: async () => ({ ok: false }),
  sendPasswordResetEmail: async () => ({ ok: false }),
});

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isEditMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState<OwnerProfile>({ name: "", email: "" });

  // Load profile row for the current user (name comes from profiles, email from auth).
  const hydrateProfile = useCallback(async (s: Session | null) => {
    if (!s?.user) {
      setProfile({ name: "", email: "" });
      return;
    }
    const email = s.user.email ?? "";
    const metaName =
      (s.user.user_metadata as { name?: string } | null | undefined)?.name ?? "";
    try {
      const { data } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", s.user.id)
        .maybeSingle();
      if (data) {
        setProfile({ name: data.name ?? metaName, email: data.email ?? email });
      } else {
        // First login after signup: ensure a profile row exists.
        await supabase.from("profiles").upsert({
          id: s.user.id,
          name: metaName,
          email,
        });
        setProfile({ name: metaName, email });
      }
    } catch {
      setProfile({ name: metaName, email });
    }
  }, []);

  useEffect(() => {
    // Register listener FIRST, then read the current session (Supabase best practice).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // Defer supabase queries to avoid deadlocking the auth callback.
      setTimeout(() => void hydrateProfile(s), 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      void hydrateProfile(data.session);
    });
    return () => sub.subscription.unsubscribe();
  }, [hydrateProfile]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const signUp = useCallback(
    async ({ name, email, password }: { name: string; email: string; password: string }): Promise<AuthResult> => {
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim() },
          emailRedirectTo: redirectTo,
        },
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setEditMode(false);
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<OwnerProfile>) => {
      if (!session?.user) return;
      const next: OwnerProfile = {
        name: patch.name ?? profile.name,
        email: patch.email ?? profile.email,
      };
      setProfile(next);
      await supabase
        .from("profiles")
        .upsert({ id: session.user.id, name: next.name, email: next.email });
    },
    [session, profile],
  );

  const changePassword = useCallback(async (nextPassword: string): Promise<AuthResult> => {
    if (!nextPassword || nextPassword.length < 6) {
      return { ok: false, error: "Password must be at least 6 characters." };
    }
    const { error } = await supabase.auth.updateUser({ password: nextPassword });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const sendPasswordResetEmail = useCallback(async (email: string): Promise<AuthResult> => {
    if (typeof window === "undefined") return { ok: false, error: "Unavailable." };
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      isAuthenticated: !!session,
      isLoading,
      isEditMode,
      setEditMode,
      profile,
      signIn,
      signUp,
      signOut,
      updateProfile,
      changePassword,
      sendPasswordResetEmail,
    }),
    [
      session,
      isLoading,
      isEditMode,
      profile,
      signIn,
      signUp,
      signOut,
      updateProfile,
      changePassword,
      sendPasswordResetEmail,
    ],
  );

  return (
    <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>
  );
}

export function useAdminSession() {
  return useContext(AdminSessionContext);
}
