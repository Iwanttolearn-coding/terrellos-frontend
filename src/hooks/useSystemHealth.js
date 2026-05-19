/**
 * useSystemHealth — React hook for subscribing to system health state.
 * Usage: const { backendHealthy, backendLatency, backendColdStarting } = useSystemHealth();
 */
import { useState, useEffect } from 'react';
import { subscribe, getHealth, startHealthMonitor, stopHealthMonitor } from '@/lib/systemHealth';

let _monitorStarted = false;

export function useSystemHealth(options = {}) {
  const { autoStart = true, pingInterval = 60000 } = options;
  const [health, setHealth] = useState(getHealth());

  useEffect(() => {
    const unsub = subscribe(setHealth);

    if (autoStart && !_monitorStarted) {
      _monitorStarted = true;
      startHealthMonitor(pingInterval);
    }

    return () => {
      unsub();
    };
  }, [autoStart, pingInterval]);

  return health;
}

export default useSystemHealth;
