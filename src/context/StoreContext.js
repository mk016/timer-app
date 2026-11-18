import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ANIMALS, CHAIRS, ROOMS, findItem } from '../data/catalog';

const KEY = 'focus_friends_v1';
const MAX_HISTORY = 500;

const DEFAULT_STATE = {
  treats: 20,
  owned: { animals: ['cat'], chairs: ['wooden'], rooms: ['cozy'] },
  selected: { animal: 'cat', chair: 'wooden', room: 'cozy' },
  inventory: {}, // itemKey -> count
  history: [], // { id, start, minutes, mode, completed, animal, item }
  settings: {
    focusMin: 25,
    breakMin: 5,
    longBreakMin: 15,
    longBreakEvery: 4,
    autoBreak: true,
    soundOn: true,
    ambient: 'off',
    ambientVolume: 0.6,
    onboarded: false,
  },
};

const StoreContext = createContext(null);

function merge(saved) {
  return {
    ...DEFAULT_STATE,
    ...saved,
    owned: { ...DEFAULT_STATE.owned, ...saved.owned },
    selected: { ...DEFAULT_STATE.selected, ...saved.selected },
    settings: { ...DEFAULT_STATE.settings, ...saved.settings },
  };
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(DEFAULT_STATE);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const next = merge(JSON.parse(raw));
          stateRef.current = next;
          setState(next);
        }
      } catch {
        // corrupted storage: start fresh
      }
      setReady(true);
    })();
  }, []);

  // All writes go through here so rapid consecutive updates never clobber each other
  const update = useCallback((fn) => {
    const next = fn(stateRef.current);
    stateRef.current = next;
    setState(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const setSetting = useCallback(
    (key, value) => update((s) => ({ ...s, settings: { ...s.settings, [key]: value } })),
    [update]
  );

  const select = useCallback(
    (kind, key) => update((s) => ({ ...s, selected: { ...s.selected, [kind]: key } })),
    [update]
  );

  // kind: 'animals' | 'chairs' | 'rooms'. Returns false if unaffordable.
  const buy = useCallback(
    (kind, item) => {
      const s = stateRef.current;
      if (s.owned[kind].includes(item.key)) return true;
      if (s.treats < item.price) return false;
      const selKind = { animals: 'animal', chairs: 'chair', rooms: 'room' }[kind];
      update((cur) => ({
        ...cur,
        treats: cur.treats - item.price,
        owned: { ...cur.owned, [kind]: [...cur.owned[kind], item.key] },
        selected: { ...cur.selected, [selKind]: item.key },
      }));
      return true;
    },
    [update]
  );

  const recordSession = useCallback(
    ({ minutes, mode, completed, item, treats = 0 }) =>
      update((s) => ({
        ...s,
        treats: s.treats + treats,
        inventory: item ? { ...s.inventory, [item.key]: (s.inventory[item.key] || 0) + 1 } : s.inventory,
        history: [
          {
            id: `${Date.now()}`,
            start: Date.now() - minutes * 60000,
            minutes,
            mode,
            completed,
            animal: s.selected.animal,
            item: item?.key || null,
          },
          ...s.history,
        ].slice(0, MAX_HISTORY),
      })),
    [update]
  );

  const tradeInventory = useCallback(() => {
    let earned = 0;
    update((s) => {
      for (const [key, count] of Object.entries(s.inventory)) {
        earned += (findItem(key)?.value || 0) * count;
      }
      return { ...s, treats: s.treats + earned, inventory: {} };
    });
    return earned;
  }, [update]);

  const resetProgress = useCallback(() => update((s) => ({ ...DEFAULT_STATE, settings: s.settings })), [update]);

  const animal = ANIMALS.find((a) => a.key === state.selected.animal) || ANIMALS[0];
  const chair = CHAIRS.find((c) => c.key === state.selected.chair) || CHAIRS[0];
  const room = ROOMS.find((r) => r.key === state.selected.room) || ROOMS[0];

  return (
    <StoreContext.Provider
      value={{
        ...state,
        ready,
        animal,
        chair,
        room,
        setSetting,
        select,
        buy,
        recordSession,
        tradeInventory,
        resetProgress,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
