/**
 * useSafeAsync — prevents setState after unmount (memory leak / React warning).
 *
 * Usage:
 *   const mounted = useMountedRef();
 *   if (mounted.current) setLoading(false);
 *
 * Or with useSafeAsync:
 *   const safe = useSafeAsync();
 *   safe(setLoading, false);
 */
import { useRef, useEffect, useCallback, useState } from 'react';

export function useMountedRef() {
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  return mountedRef;
}

export function useSafeAsync() {
  const mountedRef = useMountedRef();
  return useCallback((setter, value) => {
    if (mountedRef.current) setter(value);
  }, [mountedRef]);
}

/**
 * useSafeState — drop-in useState replacement that ignores updates after unmount.
 * Usage: const [loading, setLoading] = useSafeState(false);
 */
export function useSafeState(initial) {
  const [state, setState] = useState(initial);
  const mountedRef = useMountedRef();
  const safeSet = useCallback((value) => {
    if (mountedRef.current) setState(value);
  }, [mountedRef]);
  return [state, safeSet];
}

export default useSafeAsync;
