import { Audio } from 'expo-av';
import chime from '../../assets/sounds/chime.wav';

let soundObj = null;

export async function playChime() {
  try {
    if (soundObj) {
      await soundObj.unloadAsync().catch(() => {});
    }
    const { sound } = await Audio.Sound.createAsync(chime, { shouldPlay: true });
    soundObj = sound;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        soundObj = null;
      }
    });
  } catch {
    // ignore audio errors
  }
}
