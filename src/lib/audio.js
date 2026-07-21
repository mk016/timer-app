import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import chime from '../../assets/sounds/chime.wav';

let player = null;
let audioModeReady = false;

async function ensureAudioMode() {
  if (audioModeReady) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true, // iOS: play even with silent switch on
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers', // briefly lower other apps' audio for the alarm
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
