import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { validateSession, logout as logoutFn } from "./auth.functions";
import { getDeviceFingerprint, sessionStore } from "./device";

type AuthState = {
  loading: boolean;
  authed: boolean;
  isAdmin: boolean;
  tier: string | null;
  daysLeft: number | null;
  token: string | null;
  device: string;
};

type Ctx = AuthState & {
  setSession: (token: string, isAdmin: boolean, tier: string, daysLeft: number | null) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    loading: true,
    authed: false,
    isAdmin: false,
    tier: null,
    daysLeft: null,
    token: null,
    device: "",
  });
  const validate = useServerFn(validateSession);
  const logoutSrv = useServerFn(logoutFn);
  const navigate = useNavigate();

  const refresh = async () => {
    const device = getDeviceFingerprint();
    const token = sessionStore.get();
    if (!token) {
      setState({ loading: false, authed: false, isAdmin: false, tier: null, daysLeft: null, token: null, device });
      return;
    }
    try {
      const res = await validate({ data: { token, device } });
      if (res.valid) {
        setState({ loading: false, authed: true, isAdmin: res.isAdmin, tier: res.tier, daysLeft: res.daysLeft, token, device });
      } else {
        sessionStore.clear();
        setState({ loading: false, authed: false, isAdmin: false, tier: null, daysLeft: null, token: null, device });
      }
    } catch {
      setState({ loading: false, authed: false, isAdmin: false, tier: null, daysLeft: null, token: null, device });
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSession: Ctx["setSession"] = (token, isAdmin, tier, daysLeft) => {
    setState((s) => ({ ...s, loading: false, authed: true, token, isAdmin, tier, daysLeft }));
  };

  const logout = async () => {
    const token = sessionStore.get();
    sessionStore.clear();
    if (token) {
      try { await logoutSrv({ data: { token } }); } catch { /* ignore */ }
    }
    setState((s) => ({ ...s, authed: false, isAdmin: false, tier: null, daysLeft: null, token: null }));
    navigate({ to: "/login" });
  };

  return <AuthCtx.Provider value={{ ...state, setSession, logout, refresh }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
