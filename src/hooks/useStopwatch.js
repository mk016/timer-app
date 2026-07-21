import { useRef, useState, useEffect, useCallback } from 'react';

export function useStopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState([]);

  const startRef = useRef(0);
  const baseRef = useRef(0);
  const intervalRef = useRef(null);

  const clear = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const tick = useCallback(() => {
    setElapsed(baseRef.current + (Date.now() - startRef.current));
  }, []);

  const start = useCallback(() => {
    if (isRunning) return;
    startRef.current = Date.now();
    setIsRunning(true);
    clear();
    intervalRef.current = setInterval(tick, 50);
  }, [isRunning, tick]);

  const pause = useCallback(() => {
    if (!isRunning) return;
    baseRef.current += Date.now() - startRef.current;
    setIsRunning(false);
    clear();
    setElapsed(baseRef.current);
  }, [isRunning]);

  const reset = useCallback(() => {
    clear();
    setIsRunning(false);
    baseRef.current = 0;
    startRef.current = 0;
    setElapsed(0);
    setLaps([]);
  }, []);

  const lap = useCallback(() => {
    if (!isRunning && baseRef.current === 0) return; // ignore laps before starting
    const current = baseRef.current + (isRunning ? Date.now() - startRef.current : 0);
    setLaps((prev) => {
      const last = prev.length ? prev[prev.length - 1].total : 0;
      return [...prev, { id: prev.length + 1, total: current, split: current - last }];
    });
  }, [isRunning]);

  useEffect(() => clear, []);

  return { elapsed, isRunning, laps, start, pause, reset, lap };
}
