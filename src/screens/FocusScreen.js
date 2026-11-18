import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCountdown } from '../hooks/useCountdown';
import { useCountUp } from '../hooks/useCountUp';
import Scene, { sceneLayout } from '../components/Scene';
import { GiftBox, TrashDrop } from '../components/Effects';
import RoundButton from '../components/RoundButton';
import RollingClock from '../components/RollingClock';
import PressableScale from '../components/PressableScale';
import Segmented from '../components/Segmented';
import TreatPill from '../components/TreatPill';
import { formatTime } from '../utils/format';
import { COLORS, FONT_BOLD, FONT_MEDIUM, FONT_SEMIBOLD, SHADOW } from '../theme';
import { useStore } from '../context/StoreContext';
import { MIN_REWARD_MINUTES, rollGift, rollTrash, sessionReward } from '../data/catalog';
import {
  buzzComplete,
  buzzImpact,
  cancelAllNotifications,
  requestNotificationPermission,
  scheduleEndNotification,
  setupAndroidChannel,
} from '../lib/notifications';
import { playChime, startAmbient, stopAmbient } from '../lib/audio';

const DURATIONS = [10, 15, 25, 45, 60];
const MODES = [
  { key: 'pomodoro', label: 'Pomodoro' },
  { key: 'countup', label: 'Count up' },
];
const CHEERS = ['Let’s do this!', 'I believe in you!', 'Pet me more~', 'Focus time?', 'You’ve got this!'];
const TAB_BAR_SPACE = 84;
const TRACK_W = 190;
const PANEL_H = 196;
// A running session is mirrored here so it survives the app being closed
const SESSION_KEY = 'focus_friends_session_v1';

export default function FocusScreen({ onBusy }) {
  const { animal, chair, room, settings, treats, setSetting, recordSession } = useStore();
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState('pomodoro');
  const [phase, setPhase] = useState('idle'); // idle | focus | break
  const [reward, setReward] = useState(null); // { kind: 'gift'|'trash', item, treats, opened, key }
  const [pokeKey, setPokeKey] = useState(0);
  const [bubble, setBubble] = useState(null);
  const [catAt, setCatAt] = useState('chair'); // where the critter is sitting, so speech bubbles follow it
  const [sad, setSad] = useState(false);
  const [breakMin, setBreakMin] = useState(settings.breakMin);
  const cycleRef = useRef(0);
  const sessionMinRef = useRef(settings.focusMin);
  const restoredRef = useRef(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const bubbleTimer = useRef(null);
  const sadTimer = useRef(null);

  const say = useCallback((text, ms = 1800) => {
    clearTimeout(bubbleTimer.current);
    setBubble({ text, key: Date.now() });
    bubbleTimer.current = setTimeout(() => setBubble(null), ms);
  }, []);

  const finishBreak = useCallback(() => {
    buzzComplete();
    if (settings.soundOn) playChime();
    setPhase('idle');
    say('Break’s over! Ready?', 2600);
  }, [settings.soundOn, say]);

  function grantGift(minutes, sessionMode, allowBreak = true) {
    const item = rollGift(minutes);
    const earned = sessionReward(minutes);
    recordSession({ minutes, mode: sessionMode, completed: true, item, treats: earned });
    buzzComplete();
    if (settings.soundOn) playChime();
    stopAmbient();
    setReward({ kind: 'gift', item, treats: earned, opened: false, key: Date.now() });
    cycleRef.current += 1;
    if (settings.autoBreak && allowBreak) beginBreak();
    else setPhase('idle');
  }

  const timer = useCountdown(() => {
    if (phaseRef.current === 'break') finishBreak();
    else grantGift(sessionMinRef.current, 'pomodoro');
  });
  const countUp = useCountUp();

  useEffect(() => {
    setupAndroidChannel();
    requestNotificationPermission();
    return () => {
      clearTimeout(bubbleTimer.current);
      clearTimeout(sadTimer.current);
    };
  }, []);

  // Bring back a session that was running when the app was last closed
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        const saved = raw ? JSON.parse(raw) : null;
        if (saved && (saved.phase === 'focus' || saved.phase === 'break')) {
          setMode(saved.mode);
          setBreakMin(saved.breakMin);
          sessionMinRef.current = saved.minutes;
          cycleRef.current = saved.cycle || 0;
          const usesTimer = saved.phase === 'break' || saved.mode === 'pomodoro';
          const ended = usesTimer && saved.timer.running && saved.timer.endAt <= Date.now();
          if (ended) {
            AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
            // Focus finished while we were away: the gift is waiting. A finished break needs nothing.
            if (saved.phase === 'focus') grantGift(saved.minutes, 'pomodoro', false);
          } else {
            phaseRef.current = saved.phase;
            setPhase(saved.phase);
            if (usesTimer) timer.restore(saved.timer);
            else countUp.restore(saved.countUp);
          }
        }
      } catch {
        // unreadable session: start fresh
      }
      restoredRef.current = true;
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { snapshot: timerSnapshot } = timer;
  const { snapshot: countUpSnapshot } = countUp;
  useEffect(() => {
    if (!restoredRef.current) return;
    if (phase === 'idle') {
      AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
      return;
    }
    const snap = {
      phase,
      mode,
      breakMin,
      minutes: sessionMinRef.current,
      cycle: cycleRef.current,
      timer: timerSnapshot(),
      countUp: countUpSnapshot(),
    };
    AsyncStorage.setItem(SESSION_KEY, JSON.stringify(snap)).catch(() => {});
  }, [phase, mode, breakMin, timer.isRunning, countUp.isRunning, timer.total, timerSnapshot, countUpSnapshot]);

  useEffect(() => {
    onBusy?.(phase === 'focus');
    if (phase !== 'idle') activateKeepAwakeAsync('focus').catch(() => {});
    else deactivateKeepAwake('focus');
  }, [phase, onBusy]);

  useEffect(
    () => () => {
      deactivateKeepAwake('focus');
      stopAmbient();
    },
    []
  );

  const paused = phase === 'focus' && (mode === 'pomodoro' ? !timer.isRunning : !countUp.isRunning);
  useEffect(() => {
    if (phase === 'focus' && !paused && settings.ambient !== 'off') startAmbient(settings.ambient, settings.ambientVolume);
    else stopAmbient();
  }, [phase, paused, settings.ambient, settings.ambientVolume]);

  function beginBreak() {
    const long = cycleRef.current > 0 && cycleRef.current % settings.longBreakEvery === 0;
    const mins = long ? settings.longBreakMin : settings.breakMin;
    setBreakMin(mins);
    setPhase('break');
    timer.start(mins * 60000);
    cancelAllNotifications().then(() => scheduleEndNotification(mins * 60, 'Break’s over', `${animal.name} is ready to focus again.`));
  }

  const startFocus = async () => {
    buzzImpact();
    setReward(null);
    setSad(false);
    setBubble(null);
    await cancelAllNotifications();
    sessionMinRef.current = settings.focusMin;
    setPhase('focus');
    say(mode === 'pomodoro' ? `${settings.focusMin} minutes, let’s go!` : 'Let’s go!', 1600);
    if (mode === 'pomodoro') {
      timer.start(settings.focusMin * 60000);
      await scheduleEndNotification(
        settings.focusMin * 60,
        `${animal.name} has a gift for you!`,
        `You focused for ${settings.focusMin} minutes. Come see what ${animal.name} found.`
      );
    } else {
      countUp.start();
    }
  };

  const togglePause = async () => {
    buzzImpact();
    if (mode === 'countup') {
      countUp.isRunning ? countUp.pause() : countUp.resume();
      return;
    }
    if (timer.isRunning) {
      timer.pause();
      await cancelAllNotifications();
    } else {
      const rem = timer.resume();
      if (rem > 0) await scheduleEndNotification(Math.ceil(rem / 1000), `${animal.name} has a gift for you!`);
    }
  };

  const abandon = async (minutes) => {
    // The session may have finished while the confirm dialog was open
    if (phaseRef.current !== 'focus') return;
    const item = rollTrash();
    recordSession({ minutes, mode, completed: false, item });
    timer.reset();
    countUp.reset();
    stopAmbient();
    await cancelAllNotifications();
    setPhase('idle');
    setReward({ kind: 'trash', item, treats: 0, key: Date.now() });
    setSad(true);
    buzzImpact('heavy');
    clearTimeout(sadTimer.current);
    sadTimer.current = setTimeout(() => setSad(false), 4500);
  };

  const giveUp = () => {
    buzzImpact();
    const elapsedMs = mode === 'countup' ? countUp.elapsed : timer.total - timer.remaining;
    const elapsedMin = Math.floor(elapsedMs / 60000);
    Alert.alert('Leave the session?', `${animal.name} will be sad, and you'll only get some trash for this one.`, [
      { text: 'Keep focusing', style: 'cancel' },
      { text: 'Give up', style: 'destructive', onPress: () => abandon(elapsedMin) },
    ]);
  };

  const finishCountUp = () => {
    const minutes = Math.floor(countUp.elapsed / 60000);
    if (minutes < MIN_REWARD_MINUTES) {
      Alert.alert('Too short for a gift', `Focus for at least ${MIN_REWARD_MINUTES} minutes and ${animal.name} will bring you something.`, [
        { text: 'Keep going', style: 'cancel' },
        { text: 'Stop anyway', style: 'destructive', onPress: () => abandon(minutes) },
      ]);
      return;
    }
    countUp.reset();
    grantGift(minutes, 'countup');
  };

  const skipBreak = async () => {
    buzzImpact();
    timer.reset();
    await cancelAllNotifications();
    setPhase('idle');
  };

  const openGift = () => {
    buzzComplete();
    setReward((r) => (r ? { ...r, opened: true } : r));
  };

  const pet = () => {
    buzzImpact('light');
    if (phase === 'focus') {
      say(`Shh… ${animal.name} is napping`);
      return;
    }
    setPokeKey((k) => k + 1);
    say(Math.random() < 0.5 ? animal.sound : CHEERS[Math.floor(Math.random() * CHEERS.length)]);
  };

  // ---------- layout ----------
  const bottomSpace = PANEL_H + TAB_BAR_SPACE + Math.max(insets.bottom, 12);
  const seatY = Math.max(insets.top + 260, H - bottomSpace - 30);
  const L = sceneLayout(W, seatY, H);
  const night = !!room.dark;
  const ink = night ? '#FFFFFF' : COLORS.text;
  const inkDim = night ? 'rgba(255,255,255,0.75)' : COLORS.textDim;

  const giftVisible = reward?.kind === 'gift' && phase !== 'focus';
  const mood = sad ? 'sad' : phase === 'focus' ? 'sleep' : giftVisible && !reward.opened ? 'happy' : 'idle';
  const spot = phase === 'break' ? 'rug' : 'chair';

  let clock;
  let caption;
  let progress = null;
  if (phase === 'focus') {
    if (mode === 'pomodoro') {
      clock = formatTime(timer.remaining);
      progress = timer.total > 0 ? 1 - timer.remaining / timer.total : 0;
    } else {
      clock = formatTime(countUp.elapsed);
    }
    caption = paused ? 'Paused' : `${animal.name} is napping while you focus`;
  } else if (phase === 'break') {
    clock = formatTime(timer.remaining);
    progress = timer.total > 0 ? 1 - timer.remaining / timer.total : 0;
    caption = `${breakMin}-min break · ${animal.name} is playing`;
  } else {
    clock = mode === 'pomodoro' ? formatTime(settings.focusMin * 60000) : '00:00';
    caption = `Tap ${animal.name} to say hi`;
  }
  if (giftVisible) caption = reward.opened ? `You got a ${reward.item.name}!` : `${animal.name} brought you a gift! Tap it`;

  const spotBox = L.spots[catAt] || (spot === 'rug' ? L.rugSpot : L.chairSpot);

  return (
    <View style={styles.fill}>
      <Scene
        width={W}
        height={H}
        seatY={seatY}
        room={room}
        chair={chair}
        animal={animal}
        mood={mood}
        spot={spot}
        dim={phase === 'focus' ? 1 : 0}
        raining={sad}
        pokeKey={pokeKey}
        onPet={pet}
        onMove={setCatAt}
      >
        {giftVisible && (
          <GiftBox
            key={reward.key}
            x={L.giftSpot.x}
            y={L.giftSpot.y}
            s={L.s}
            opened={reward.opened}
            item={reward.item}
            treats={reward.treats}
            onPress={openGift}
          />
        )}
        {reward?.kind === 'trash' && phase === 'idle' && <TrashDrop key={reward.key} x={L.giftSpot.x} y={L.giftSpot.y} s={L.s} item={reward.item} />}
        {bubble && (
          <View
            key={bubble.key}
           
           
            style={[styles.speech, { left: spotBox.left + spotBox.width / 2 - 100, top: spotBox.top - 40 }]}
            pointerEvents="none"
          >
            <View style={styles.speechInner}>
              <Text style={styles.speechText} numberOfLines={1}>
                {bubble.text}
              </Text>
            </View>
            <View style={styles.speechTail} />
          </View>
        )}
      </Scene>

      {/* header */}
      <View style={[styles.header, { top: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.namePill}>
          <Text style={styles.nameText}>
            {animal.name} <Text style={styles.species}>the {animal.species.toLowerCase()}</Text>
          </Text>
        </View>
        <TreatPill amount={treats} />
      </View>

      {/* clock on the wall */}
      <View style={[styles.clockWrap, { top: insets.top + 58 }]} pointerEvents="none">
        <RollingClock value={clock} style={[styles.clock, { color: ink }, paused && { opacity: 0.5 }]} />
        {progress !== null && (
          <View style={[styles.track, night && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <View style={[styles.bar, { width: `${Math.round((progress || 0) * 1000) / 10}%`, backgroundColor: phase === 'break' ? COLORS.sage : COLORS.accent }]} />
          </View>
        )}
        <Text style={[styles.caption, { color: inkDim }]}>{caption}</Text>
      </View>

      {/* controls */}
      <View
       
        style={[styles.panel, SHADOW, { bottom: (phase === 'focus' ? 0 : TAB_BAR_SPACE) + Math.max(insets.bottom, 12) }]}
      >
        {phase === 'idle' && (
          <View key="idle">
            <Segmented
              options={MODES}
              value={mode}
              onChange={(m) => {
                buzzImpact('light');
                setMode(m);
              }}
            />
            {mode === 'pomodoro' ? (
              <View style={styles.chips}>
                {DURATIONS.map((d) => {
                  const on = settings.focusMin === d;
                  return (
                    <View key={d} style={styles.flex}>
                      <PressableScale
                       
                        onPress={() => {
                          buzzImpact('light');
                          setSetting('focusMin', d);
                        }}
                        style={[styles.chip, on && styles.chipOn]}
                      >
                        <Text key={on ? 'on' : 'off'} style={[styles.chipText, on && styles.chipTextOn]}>
                          {d}m
                        </Text>
                      </PressableScale>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.hint}>Stop whenever you like · {MIN_REWARD_MINUTES}+ min earns a gift</Text>
            )}
            <RoundButton label="Start focus" onPress={startFocus} style={{ marginTop: 14 }} />
          </View>
        )}
        {phase === 'focus' && (
          <View key="focus" style={styles.row}>
            <RoundButton label="Give up" variant="secondary" compact onPress={giveUp} style={styles.flex} />
            <RoundButton label={paused ? 'Resume' : 'Pause'} variant="secondary" compact onPress={togglePause} style={styles.flex} />
            {mode === 'countup' && <RoundButton label="Finish" compact onPress={finishCountUp} style={styles.flex} />}
          </View>
        )}
        {phase === 'break' && (
          <View key="break" style={styles.row}>
            <RoundButton label="Skip break" variant="secondary" compact onPress={skipBreak} style={styles.flex} />
          </View>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  namePill: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 7 },
  nameText: { fontFamily: FONT_SEMIBOLD, fontSize: 15, color: COLORS.text },
  species: { fontFamily: FONT_MEDIUM, color: COLORS.textDim },
  clockWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  clock: {
    fontFamily: FONT_BOLD,
    fontSize: 68,
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(0,0,0,0.08)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  track: { width: TRACK_W, height: 10, borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.08)', overflow: 'hidden', marginTop: 4 },
  bar: { height: 10, borderRadius: 5 },
  caption: { fontFamily: FONT_MEDIUM, fontSize: 15, marginTop: 8, textAlign: 'center', paddingHorizontal: 24 },
  panel: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 28,
    padding: 14,
  },
  chips: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginTop: 12 },
  chip: {
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipOn: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  chipText: { fontFamily: FONT_SEMIBOLD, fontSize: 15, color: COLORS.text },
  chipTextOn: { color: '#FFFFFF' },
  hint: { fontFamily: FONT_MEDIUM, fontSize: 14, color: COLORS.textDim, textAlign: 'center', marginTop: 14, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  speech: { position: 'absolute', width: 200, alignItems: 'center' },
  speechInner: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7, ...SHADOW },
  speechText: { fontFamily: FONT_SEMIBOLD, fontSize: 14, color: COLORS.text },
  speechTail: { width: 12, height: 12, backgroundColor: '#FFFFFF', transform: [{ rotate: '45deg' }], marginTop: -7 },
});
