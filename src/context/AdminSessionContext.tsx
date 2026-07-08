import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { sha256 } from "@/lib/crypto";

const SESSION_KEY = "baratto.admin.session.v1";
const MASTER_HASH_KEY = "baratto.masterhash.v1";
const PROFILE_KEY = "baratto.owner.profile.v1";

export type OwnerProfile = { name: string; email: string };

function readSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function readProfile(): OwnerProfile {
  if (typeof window === "undefined") return { name: "", email: "" };
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { name: "", email: "" };
    const p = JSON.parse(raw);
    return { name: p.name ?? "", email: p.email ?? "" };
  } catch {
    return { name: "", email: "" };
  }
}

export function hasOwnerAccount(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(MASTER_HASH_KEY);
}

// Server-safe read used by route beforeLoad guards. Returns false during SSR.
export function isAuthenticatedClient(): boolean {
  return readSession();
}

type Ctx = {
  isAuthenticated: boolean;
  isEditMode: boolean;
  setEditMode: (v: boolean) => void;
  validateToken: (token: string) => Promise<boolean>;
  createAccount: (input: { name: string; email: string; password: string }) => Promise<boolean>;
  changePassword: (current: string, next: string) => Promise<boolean>;
  updateProfile: (p: Partial<OwnerProfile>) => void;
  deleteAccount: (current: string) => Promise<boolean>;
  profile: OwnerProfile;
  hasAccount: boolean;
  signOut: () => void;
};

const AdminSessionContext = createContext<Ctx>({
  isAuthenticated: false,
  isEditMode: false,
  setEditMode: () => {},
  validateToken: async () => false,
  createAccount: async () => false,
  changePassword: async () => false,
  updateProfile: () => {},
  deleteAccount: async () => false,
  profile: { name: "", email: "" },
  hasAccount: false,
  signOut: () => {},
});

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuth] = useState(false);
  const [isEditMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState<OwnerProfile>({ name: "", email: "" });
  const [hasAccount, setHasAccount] = useState(false);

  useEffect(() => {
    setAuth(readSession());
    setProfile(readProfile());
    setHasAccount(hasOwnerAccount());
    const onStorage = () => {
      setAuth(readSession());
      setProfile(readProfile());
      setHasAccount(hasOwnerAccount());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const validateToken = useCallback(async (token: string) => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(MASTER_HASH_KEY);
    if (!stored) {
      // First-run fallback: set the master hash from this token.
      const h = await sha256(token);
      localStorage.setItem(MASTER_HASH_KEY, h);
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuth(true);
      setHasAccount(true);
      return true;
    }
    const incoming = await sha256(token);
    const ok = incoming === stored;
    if (ok) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuth(true);
    }
    return ok;
  }, []);

  const createAccount = useCallback(
    async ({ name, email, password }: { name: string; email: string; password: string }) => {
      if (typeof window === "undefined") return false;
      if (localStorage.getItem(MASTER_HASH_KEY)) return false; // account already exists
      if (!password || password.length < 6) return false;
      const h = await sha256(password);
      localStorage.setItem(MASTER_HASH_KEY, h);
      const p: OwnerProfile = { name: name.trim(), email: email.trim() };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
      sessionStorage.setItem(SESSION_KEY, "1");
      setProfile(p);
      setHasAccount(true);
      setAuth(true);
      return true;
    },
    [],
  );

  const changePassword = useCallback(async (current: string, next: string) => {
    if (typeof window === "undefined") return false;
    if (!next || next.length < 6) return false;
    const stored = localStorage.getItem(MASTER_HASH_KEY);
    if (!stored) return false;
    const cur = await sha256(current);
    if (cur !== stored) return false;
    const nxt = await sha256(next);
    localStorage.setItem(MASTER_HASH_KEY, nxt);
    return true;
  }, []);

  const updateProfile = useCallback((patch: Partial<OwnerProfile>) => {
    setProfile((prev) => {
      const next = { name: patch.name ?? prev.name, email: patch.email ?? prev.email };
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const deleteAccount = useCallback(async (current: string) => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(MASTER_HASH_KEY);
    if (!stored) return false;
    const cur = await sha256(current);
    if (cur !== stored) return false;
    localStorage.removeItem(MASTER_HASH_KEY);
    localStorage.removeItem(PROFILE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setAuth(false);
    setEditMode(false);
    setProfile({ name: "", email: "" });
    setHasAccount(false);
    return true;
  }, []);

  const signOut = useCallback(() => {
    if (typeof window !== "undefined") sessionStorage.removeItem(SESSION_KEY);
    setAuth(false);
    setEditMode(false);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      isAuthenticated,
      isEditMode,
      setEditMode,
      validateToken,
      createAccount,
      changePassword,
      updateProfile,
      deleteAccount,
      profile,
      hasAccount,
      signOut,
    }),
    [
      isAuthenticated,
      isEditMode,
      validateToken,
      createAccount,
      changePassword,
      updateProfile,
      deleteAccount,
      profile,
      hasAccount,
      signOut,
    ],
  );

  return (
    <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>
  );
}

export function useAdminSession() {
  return useContext(AdminSessionContext);
}
