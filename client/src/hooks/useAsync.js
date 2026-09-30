import { useCallback, useEffect, useRef, useState } from 'react';

/** Runs an async loader when `deps` change. Returns { data, loading, error, reload }. */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    loaderRef.current(ctrl.signal)
      .then((data) => !ctrl.signal.aborted && setState({ data, loading: false, error: null }))
      .catch((error) => {
        if (error?.name === 'AbortError') return;
        setState({ data: null, loading: false, error });
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
