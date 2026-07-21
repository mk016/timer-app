import { useState, useEffect, useCallback } from 'react';
import { loadPresets, savePresets } from '../lib/storage';
import { DEFAULT_PRESETS } from '../constants/presets';

export function usePresets() {
  const [presets, setPresets] = useState(DEFAULT_PRESETS);

  useEffect(() => {
    (async () => {
      const stored = await loadPresets();
      if (stored && stored.length) setPresets(stored);
    })();
  }, []);

  const addPreset = useCallback((preset) => {
    setPresets((prev) => {
      const next = [...prev, preset];
      savePresets(next);
      return next;
    });
  }, []);

  const removePreset = useCallback((id) => {
    setPresets((prev) => {
      const next = prev.filter((p) => p.id !== id);
      savePresets(next);
      return next;
    });
  }, []);

  return { presets, addPreset, removePreset };
}
