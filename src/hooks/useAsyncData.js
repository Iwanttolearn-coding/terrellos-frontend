/**
 * useAsyncData — safe async data fetching with:
 * - unmount/stale-state prevention
 * - loading + error state
 * - manual refetch
 * - optional dependency array
 *
 * Usage:
 *   const { data, loading, error, refetch } = useAsyncData(
 *     () => base44.entities.Project.list(),
 *     []
 *   );
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export default function useAsyncData(asyncFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const runCountRef = useRef(0);

  const execute = useCallback(async () => {
    const runId = ++runCountRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      if (mountedRef.current && runId === runCountRef.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current && runId === runCountRef.current) {
        setError(err?.message || 'An error occurred');
        console.error('[useAsyncData]', err?.message);
      }
    } finally {
      if (mountedRef.current && runId === runCountRef.current) {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    execute();
    return () => { mountedRef.current = false; };
  }, [execute]);

  return { data, loading, error, refetch: execute };
}