import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.admin.me().then((a) => active && setAdmin(a)).catch(() => {}).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const login = useCallback(async (email, password) => { setAdmin(await api.admin.login(email, password)); }, []);
  const logout = useCallback(async () => { try { await api.admin.logout(); } finally { setAdmin(null); } }, []);
  /** Called when any admin request comes back 401. */
  const expire = useCallback(() => setAdmin(null), []);

  const value = useMemo(() => ({ admin, loading, login, logout, expire }), [admin, loading, login, logout, expire]);
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export const useAdminAuth = () => useContext(AdminAuthContext);
