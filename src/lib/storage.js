import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'aura_presets';

export async function loadPresets() {
  try {
    const value = await AsyncStorage.getItem(KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export async function savePresets(presets) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(presets));
  } catch {
    // ignore persistence errors
  }
}
