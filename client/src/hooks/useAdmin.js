import { useCallback, useEffect } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from './useAsync';

/** useAsync that signs the admin out when the session has expired (401). */
export function useAdminLoader(loader, deps) {
  const { expire } = useAdminAuth();
  const state = useAsync(loader, deps);
  useEffect(() => { if (state.error?.status === 401) expire(); }, [state.error, expire]);
  return state;
}

/** Shows a toast for a failed admin action; handles expired sessions. */
export function useAdminError() {
  const { expire } = useAdminAuth();
  const { notify } = useToast();
  return useCallback((err) => {
    if (err?.status === 401) { expire(); return; }
    notify(err?.message || 'Something went wrong. Please try again.', 'error');
  }, [expire, notify]);
}
