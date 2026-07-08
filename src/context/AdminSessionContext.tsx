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

function readSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

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

function readSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuth] = useState(false);
  const [isEditMode, setEditMode] = useState(false);

  useEffect(() => {
    setAuth(readSession());
    const onStorage = () => setAuth(readSession());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const validateToken = useCallback(async (token: string) => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(MASTER_HASH_KEY);
    if (!stored) {
      // First-run: set the master hash from this token so the owner can lock later.
      const h = await sha256(token);
      localStorage.setItem(MASTER_HASH_KEY, h);
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuth(true);
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

  const signOut = useCallback(() => {
    if (typeof window !== "undefined") sessionStorage.removeItem(SESSION_KEY);
    setAuth(false);
    setEditMode(false);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ isAuthenticated, isEditMode, setEditMode, validateToken, signOut }),
    [isAuthenticated, isEditMode, validateToken, signOut],
  );

  return (
    <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>
  );
}

export function useAdminSession() {
  return useContext(AdminSessionContext);
}

// Server-safe read used by route beforeLoad guards. Returns false during SSR.
export function isAuthenticatedClient(): boolean {
  return readSession();
}
