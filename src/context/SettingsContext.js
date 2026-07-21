import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACCENTS, DEFAULT_ACCENT } from '../theme';

const KEY = 'aura_settings';
const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [accentKey, setAccentKey] = useState(DEFAULT_ACCENT);
  const [soundOn, setSoundOn] = useState(true);
  const [fontStyle, setFontStyle] = useState('modern'); // 'modern' | 'mono' | 'classic'

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const s = JSON.parse(raw);
          if (s.accentKey) setAccentKey(s.accentKey);
          if (typeof s.soundOn === 'boolean') setSoundOn(s.soundOn);
          if (s.fontStyle) setFontStyle(s.fontStyle);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const persist = async (next) => {
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const updateAccent = (key) => {
    setAccentKey(key);
    persist({ accentKey: key, soundOn, fontStyle });
  };

  const updateSound = (val) => {
    setSoundOn(val);
    persist({ accentKey, soundOn: val, fontStyle });
  };

  const updateFontStyle = (style) => {
    setFontStyle(style);
    persist({ accentKey, soundOn, fontStyle: style });
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
