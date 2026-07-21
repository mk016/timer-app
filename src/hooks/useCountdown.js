import { useRef, useState, useEffect, useCallback } from 'react';

export function useCountdown(onComplete) {
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const endTimeRef = useRef(0);
  const intervalRef = useRef(null);
  const completedRef = useRef(false);

  const clear = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const tick = useCallback(() => {
    const rem = Math.max(0, endTimeRef.current - Date.now());
    setRemaining(rem);
    if (rem <= 0 && !completedRef.current) {
      completedRef.current = true;
      setIsRunning(false);
      clear();
      onComplete && onComplete();
    }
  }, [onComplete]);

  const start = useCallback(
    (durationMs) => {
      setTotal(durationMs);
      endTimeRef.current = Date.now() + durationMs;
      completedRef.current = false;
      setIsRunning(true);
      setRemaining(durationMs);
      clear();
      intervalRef.current = setInterval(tick, 100);
    },
    [tick]
  );

  const pause = useCallback(() => {
    clear();
    const rem = Math.max(0, endTimeRef.current - Date.now());
    setRemaining(rem);
    setIsRunning(false);
    return rem;
  }, []);

  const resume = useCallback(() => {
    if (remaining <= 0) return;
    endTimeRef.current = Date.now() + remaining;
    completedRef.current = false;
    setIsRunning(true);
    clear();
    intervalRef.current = setInterval(tick, 100);
  }, [remaining, tick]);

  const reset = useCallback(() => {
    clear();
    setIsRunning(false);
    setRemaining(0);
    setTotal(0);
    completedRef.current = false;
  }, []);

  const addTime = useCallback((ms) => {
    if (isRunning) {
      endTimeRef.current += ms;
      setTotal((t) => t + ms);
      setRemaining((r) => r + ms);
    } else {
      setTotal((t) => t + ms);
      setRemaining((r) => r + ms);
    }
  }, [isRunning]);

  useEffect(() => clear, []);

  return { remaining, total, isRunning, start, pause, resume, reset, addTime };
}
