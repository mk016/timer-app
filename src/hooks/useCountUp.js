import { useCallback, useEffect, useRef, useState } from 'react';

// Wall-clock based so it stays accurate while the app is backgrounded
export function useCountUp() {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startRef = useRef(0);
  const baseRef = useRef(0);
  const intervalRef = useRef(null);
  const runningRef = useRef(false);

  const clear = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const run = useCallback(() => {
    startRef.current = Date.now();
    runningRef.current = true;
    setIsRunning(true);
    clear();
    intervalRef.current = setInterval(() => setElapsed(baseRef.current + Date.now() - startRef.current), 250);
  }, []);

  const start = useCallback(() => {
    baseRef.current = 0;
    setElapsed(0);
    run();
  }, [run]);

  const pause = useCallback(() => {
    clear();
    baseRef.current += Date.now() - startRef.current;
    setElapsed(baseRef.current);
    runningRef.current = false;
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    clear();
    baseRef.current = 0;
    setElapsed(0);
    runningRef.current = false;
    setIsRunning(false);
  }, []);

  const snapshot = useCallback(() => ({ base: baseRef.current, startAt: startRef.current, running: runningRef.current }), []);

  const restore = useCallback((snap) => {
    clear();
    baseRef.current = snap.base;
    if (snap.running) {
      startRef.current = snap.startAt;
      runningRef.current = true;
      setIsRunning(true);
      setElapsed(snap.base + Date.now() - snap.startAt);
      intervalRef.current = setInterval(() => setElapsed(baseRef.current + Date.now() - startRef.current), 250);
    } else {
      runningRef.current = false;
      setIsRunning(false);
      setElapsed(snap.base);
    }
  }, []);

  useEffect(() => clear, []);

  return { elapsed, isRunning, start, pause, resume: run, reset, snapshot, restore };
}
