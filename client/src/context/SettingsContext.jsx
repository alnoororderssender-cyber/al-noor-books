import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const SettingsContext = createContext({ settings: null, loading: true });

/** Public store settings (announcement, delivery rules, store details) from the backend. */
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    api.settings(ctrl.signal)
      .then(setSettings)
      .catch(() => {})
      .finally(() => !ctrl.signal.aborted && setLoading(false));
    return () => ctrl.abort();
  }, []);

  const value = useMemo(() => ({ settings, loading }), [settings, loading]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
