import { useRef, useState, useEffect, useCallback } from 'react';

export function useCountdown(onComplete) {
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const endTimeRef = useRef(0);
  const intervalRef = useRef(null);
  const completedRef = useRef(false);
  // Mirrors of state for use inside stable callbacks (avoids stale closures)
  const remainingRef = useRef(0);
  const isRunningRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const setRemainingSynced = useCallback((ms) => {
    remainingRef.current = ms;
    setRemaining(ms);
  }, []);

  const setRunningSynced = useCallback((val) => {
    isRunningRef.current = val;
    setIsRunning(val);
  }, []);

  const clear = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const tick = useCallback(() => {
    const rem = Math.max(0, endTimeRef.current - Date.now());
    setRemainingSynced(rem);
    if (rem <= 0 && !completedRef.current) {
      completedRef.current = true;
      setRunningSynced(false);
      clear();
      onCompleteRef.current && onCompleteRef.current();
    }
  }, [setRemainingSynced, setRunningSynced]);

  const start = useCallback(
    (durationMs) => {
      setTotal(durationMs);
      endTimeRef.current = Date.now() + durationMs;
      completedRef.current = false;
      setRunningSynced(true);
      setRemainingSynced(durationMs);
      clear();
      intervalRef.current = setInterval(tick, 100);
    },
    [tick, setRemainingSynced, setRunningSynced]
  );

  const pause = useCallback(() => {
    clear();
    const rem = Math.max(0, endTimeRef.current - Date.now());
    setRemainingSynced(rem);
    setRunningSynced(false);
    return rem;
  }, [setRemainingSynced, setRunningSynced]);

  const resume = useCallback(() => {
    if (remainingRef.current <= 0) return 0;
    endTimeRef.current = Date.now() + remainingRef.current;
    completedRef.current = false;
    setRunningSynced(true);
    clear();
    intervalRef.current = setInterval(tick, 100);
    return remainingRef.current;
  }, [tick, setRunningSynced]);

  const reset = useCallback(() => {
    clear();
    setRunningSynced(false);
    setRemainingSynced(0);
    setTotal(0);
    completedRef.current = false;
  }, [setRemainingSynced, setRunningSynced]);

  // Returns the new accurate remaining time in ms
  const addTime = useCallback(
    (ms) => {
      if (isRunningRef.current) {
        endTimeRef.current += ms;
        const rem = Math.max(0, endTimeRef.current - Date.now());
        setTotal((t) => t + ms);
        setRemainingSynced(rem);
        return rem;
      }
      const rem = remainingRef.current + ms;
      setTotal((t) => t + ms);
      setRemainingSynced(rem);
      return rem;
    },
    [setRemainingSynced]
  );

  useEffect(() => clear, []);

  return { remaining, total, isRunning, start, pause, resume, reset, addTime };
}
