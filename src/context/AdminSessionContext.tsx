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
const RECOVERY_HASH_KEY = "baratto.recovery.v1";

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

// Human-friendly recovery code: 4 groups of 4 chars (A-Z, 2-9). ~20 bits/group.
function generateRecoveryCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < 16; i++) {
    out += alphabet[bytes[i] % alphabet.length];
    if (i % 4 === 3 && i < 15) out += "-";
  }
  return out;
}

function normalizeCode(code: string): string {
  return code.replace(/[\s-]/g, "").toUpperCase();
}

type Ctx = {
  isAuthenticated: boolean;
  isEditMode: boolean;
  setEditMode: (v: boolean) => void;
  validateToken: (token: string) => Promise<boolean>;
  createAccount: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<{ ok: boolean; recoveryCode?: string }>;
  changePassword: (current: string, next: string) => Promise<boolean>;
  updateProfile: (p: Partial<OwnerProfile>) => void;
  deleteAccount: (current: string) => Promise<boolean>;
  resetPasswordWithCode: (
    code: string,
    nextPassword: string,
  ) => Promise<{ ok: boolean; recoveryCode?: string; error?: string }>;
  regenerateRecoveryCode: (currentPassword: string) => Promise<string | null>;
  hasRecoveryCode: boolean;
  profile: OwnerProfile;
  hasAccount: boolean;
  signOut: () => void;
};

const AdminSessionContext = createContext<Ctx>({
  isAuthenticated: false,
  isEditMode: false,
  setEditMode: () => {},
  validateToken: async () => false,
  createAccount: async () => ({ ok: false }),
  changePassword: async () => false,
  updateProfile: () => {},
  deleteAccount: async () => false,
  resetPasswordWithCode: async () => ({ ok: false }),
  regenerateRecoveryCode: async () => null,
  hasRecoveryCode: false,
  profile: { name: "", email: "" },
  hasAccount: false,
  signOut: () => {},
});

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuth] = useState(false);
  const [isEditMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState<OwnerProfile>({ name: "", email: "" });
  const [hasAccount, setHasAccount] = useState(false);
  const [hasRecoveryCode, setHasRecoveryCode] = useState(false);

  useEffect(() => {
    const sync = () => {
      setAuth(readSession());
      setProfile(readProfile());
      setHasAccount(hasOwnerAccount());
      setHasRecoveryCode(!!localStorage.getItem(RECOVERY_HASH_KEY));
    };
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
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
      if (typeof window === "undefined") return { ok: false };
      if (localStorage.getItem(MASTER_HASH_KEY)) return { ok: false };
      if (!password || password.length < 6) return { ok: false };
      const h = await sha256(password);
      localStorage.setItem(MASTER_HASH_KEY, h);
      const p: OwnerProfile = { name: name.trim(), email: email.trim() };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
      const code = generateRecoveryCode();
      const codeHash = await sha256(normalizeCode(code));
      localStorage.setItem(RECOVERY_HASH_KEY, codeHash);
      sessionStorage.setItem(SESSION_KEY, "1");
      setProfile(p);
      setHasAccount(true);
      setHasRecoveryCode(true);
      setAuth(true);
      return { ok: true, recoveryCode: code };
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
    localStorage.removeItem(RECOVERY_HASH_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setAuth(false);
    setEditMode(false);
    setProfile({ name: "", email: "" });
    setHasAccount(false);
    setHasRecoveryCode(false);
    return true;
  }, []);

  const resetPasswordWithCode = useCallback(
    async (code: string, nextPassword: string) => {
      if (typeof window === "undefined") return { ok: false, error: "Unavailable." };
      const storedCode = localStorage.getItem(RECOVERY_HASH_KEY);
      if (!storedCode) return { ok: false, error: "No recovery code is set on this device." };
      if (!nextPassword || nextPassword.length < 6)
        return { ok: false, error: "New password must be at least 6 characters." };
      const incoming = await sha256(normalizeCode(code));
      if (incoming !== storedCode) return { ok: false, error: "Recovery code is incorrect." };
      const nxt = await sha256(nextPassword);
      localStorage.setItem(MASTER_HASH_KEY, nxt);
      // Rotate the recovery code after successful reset.
      const newCode = generateRecoveryCode();
      const newHash = await sha256(normalizeCode(newCode));
      localStorage.setItem(RECOVERY_HASH_KEY, newHash);
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuth(true);
      setHasRecoveryCode(true);
      return { ok: true, recoveryCode: newCode };
    },
    [],
  );

  const regenerateRecoveryCode = useCallback(async (currentPassword: string) => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(MASTER_HASH_KEY);
    if (!stored) return null;
    const cur = await sha256(currentPassword);
    if (cur !== stored) return null;
    const code = generateRecoveryCode();
    const h = await sha256(normalizeCode(code));
    localStorage.setItem(RECOVERY_HASH_KEY, h);
    setHasRecoveryCode(true);
    return code;
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
      resetPasswordWithCode,
      regenerateRecoveryCode,
      hasRecoveryCode,
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
      resetPasswordWithCode,
      regenerateRecoveryCode,
      hasRecoveryCode,
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
