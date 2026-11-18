import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import chime from '../../assets/sounds/chime.wav';
import rain from '../../assets/sounds/rain.wav';
import waves from '../../assets/sounds/waves.wav';
import brown from '../../assets/sounds/brown.wav';
import purr from '../../assets/sounds/purr.wav';

export const AMBIENTS = [
  { key: 'off', label: 'Off', icon: 'mute' },
  { key: 'rain', label: 'Rain', icon: 'rain', source: rain },
  { key: 'waves', label: 'Waves', icon: 'waves', source: waves },
  { key: 'brown', label: 'Brown noise', icon: 'noise', source: brown },
  { key: 'purr', label: 'Purring', icon: 'paw', source: purr },
];

let player = null;
let ambientPlayer = null;
let ambientKey = null;
let audioModeReady = false;

async function ensureAudioMode() {
  if (audioModeReady) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true, // iOS: play even with silent switch on
      shouldPlayInBackground: false, // focus screen keeps the device awake instead
      interruptionMode: 'mixWithOthers',
    });
    audioModeReady = true;
  } catch {
    // ignore — playback will use default mode
  }
}

export async function playChime() {
  try {
    await ensureAudioMode();
    if (player) {
      player.remove();
      player = null;
    }
    const p = createAudioPlayer(chime);
    player = p;
    p.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        if (player === p) player = null;
        p.remove();
      }
    });
    p.play();
  } catch {
    // ignore audio errors
  }
}

export async function startAmbient(key, volume = 0.6) {
  const entry = AMBIENTS.find((a) => a.key === key);
  if (!entry?.source) {
    stopAmbient();
    return;
  }
  try {
    await ensureAudioMode();
    if (ambientPlayer && ambientKey === key) {
      ambientPlayer.volume = volume;
      if (!ambientPlayer.playing) ambientPlayer.play();
      return;
    }
    stopAmbient();
    const p = createAudioPlayer(entry.source);
    p.loop = true;
    p.volume = volume;
    p.play();
    ambientPlayer = p;
    ambientKey = key;
  } catch {
    // ignore audio errors
  }
}

export function setAmbientVolume(volume) {
  if (ambientPlayer) ambientPlayer.volume = volume;
}

export function stopAmbient() {
  if (!ambientPlayer) return;
  try {
    ambientPlayer.pause();
    ambientPlayer.remove();
  } catch {
    // ignore
  }
  ambientPlayer = null;
  ambientKey = null;
}
