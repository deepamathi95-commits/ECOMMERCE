import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services";
import { tokenStore } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()?.access));

  useEffect(() => {
    if (!tokenStore.get()?.access) return;
    authService
      .profile()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onForcedLogout = () => setUser(null);
    window.addEventListener("stepup:logout", onForcedLogout);
    return () => window.removeEventListener("stepup:logout", onForcedLogout);
  }, []);

  const finishAuth = useCallback((data) => {
    tokenStore.set({ access: data.access, refresh: data.refresh });
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback((email, password) => authService.login({ email, password }).then(finishAuth), [finishAuth]);
  const register = useCallback((payload) => authService.register(payload).then(finishAuth), [finishAuth]);

  const logout = useCallback(async () => {
    // End the session locally first so a reload can never find a live session,
    // then revoke the refresh token on the server (best effort).
    const refresh = tokenStore.get()?.refresh;
    tokenStore.clear();
    setUser(null);
    if (!refresh) return;
    try {
      await authService.logout(refresh);
    } catch {
      /* token already invalid or server unreachable - local logout is already done */
    }
  }, []);

  const updateProfile = useCallback(async (payload) => setUser(await authService.updateProfile(payload)), []);

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: Boolean(user), login, register, logout, updateProfile }),
    [user, loading, login, register, logout, updateProfile]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
