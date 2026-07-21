import { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACCENTS, DEFAULT_ACCENT } from '../theme';

const KEY = 'aura_settings';
const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [accentKey, setAccentKey] = useState(DEFAULT_ACCENT);
  const [soundOn, setSoundOn] = useState(true);
  const [fontStyle, setFontStyle] = useState('modern'); // 'modern' | 'mono' | 'classic'

  // Always-fresh copy of settings so rapid consecutive updates can't overwrite each other
  const latestRef = useRef({ accentKey: DEFAULT_ACCENT, soundOn: true, fontStyle: 'modern' });

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const s = JSON.parse(raw);
          if (s.accentKey) setAccentKey(s.accentKey);
          if (typeof s.soundOn === 'boolean') setSoundOn(s.soundOn);
          if (s.fontStyle) setFontStyle(s.fontStyle);
          latestRef.current = {
            accentKey: s.accentKey || DEFAULT_ACCENT,
            soundOn: typeof s.soundOn === 'boolean' ? s.soundOn : true,
            fontStyle: s.fontStyle || 'modern',
          };
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const persist = (partial) => {
    latestRef.current = { ...latestRef.current, ...partial };
    AsyncStorage.setItem(KEY, JSON.stringify(latestRef.current)).catch(() => {});
  };

  const updateAccent = (key) => {
    setAccentKey(key);
    persist({ accentKey: key });
  };

  const updateSound = (val) => {
    setSoundOn(val);
    persist({ soundOn: val });
  };

  const updateFontStyle = (style) => {
    setFontStyle(style);
    persist({ fontStyle: style });
  };

  const accent = ACCENTS[accentKey] || ACCENTS[DEFAULT_ACCENT];

  return (
    <SettingsContext.Provider
      value={{
        accent,
        accentKey,
        soundOn,
        fontStyle,
        setAccent: updateAccent,
        setSound: updateSound,
        setFontStyle: updateFontStyle,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
