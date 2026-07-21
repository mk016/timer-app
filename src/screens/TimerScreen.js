import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCountdown } from '../hooks/useCountdown';
import ProgressRing from '../components/ProgressRing';
import RoundButton from '../components/RoundButton';
import TimePicker from '../components/TimePicker';
import { formatTime, hmsToSeconds } from '../utils/format';
import { COLORS, getFontsForStyle } from '../theme';
import { useSettings } from '../context/SettingsContext';
import {
  scheduleEndNotification,
  cancelAllNotifications,
  buzzComplete,
  buzzImpact,
  requestNotificationPermission,
  setupAndroidChannel,
} from '../lib/notifications';
import { playChime } from '../lib/audio';

export default function TimerScreen({ presetRequest, onImmersive }) {
  const { accent, soundOn, fontStyle } = useSettings();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState({ h: 0, m: 0, s: 0 });
  const [finished, setFinished] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [viewMode, setViewMode] = useState('flip'); // 'flip' | 'oled' | 'ring'

  const fonts = getFontsForStyle(fontStyle);

  const { remaining, total, isRunning, start, pause, resume, reset, addTime } = useCountdown(() => {
    setFinished(true);
    setControlsVisible(true); // ensure the Done button is visible on completion
    buzzComplete();
    if (soundOn) playChime();
    // The timer already completed in-app; no pending notification needed
    cancelAllNotifications();
  });

  useEffect(() => {
    setupAndroidChannel();
    requestNotificationPermission();
  }, []);

  // Apply a preset tapped on the Presets tab
  useEffect(() => {
    if (presetRequest?.seconds > 0) {
      const secs = presetRequest.seconds;
      setDraft({
        h: Math.floor(secs / 3600),
        m: Math.floor((secs % 3600) / 60),
        s: secs % 60,
      });
      setFinished(false);
      cancelAllNotifications();
      reset();
    }
  }, [presetRequest, reset]);

  const draftSeconds = hmsToSeconds(draft);
  const active = remaining > 0 || isRunning;

  // Notify parent about immersive mode
  useEffect(() => {
    onImmersive?.(active || finished);
  }, [active, finished, onImmersive]);

  // Keep the screen awake while the timer is visible in immersive mode
  useEffect(() => {
    if (active || finished) {
      activateKeepAwakeAsync('timer').catch(() => {});
    } else {
      deactivateKeepAwake('timer');
    }
    return () => deactivateKeepAwake('timer');
  }, [active, finished]);

  const handleStart = async () => {
    if (draftSeconds <= 0) return;
    buzzImpact();
    setFinished(false);
    setControlsVisible(true);
    await cancelAllNotifications();
    start(draftSeconds * 1000);
    await scheduleEndNotification(draftSeconds, 'Timer');
  };

  const handlePause = async () => {
    buzzImpact('light');
    pause();
    // A paused timer must not fire its "Time's up" notification
    await cancelAllNotifications();
  };

  const handleResume = async () => {
    buzzImpact();
    const rem = resume();
    if (rem > 0) {
      await cancelAllNotifications();
      await scheduleEndNotification(Math.ceil(rem / 1000), 'Timer');
    }
  };

  const handleReset = async () => {
    await cancelAllNotifications();
    buzzImpact('light');
    reset();
    setFinished(false);
  };

  const handleAdd = async (ms) => {
    const newRemaining = addTime(ms);
    if (isRunning && newRemaining > 0) {
      await cancelAllNotifications();
      await scheduleEndNotification(Math.ceil(newRemaining / 1000), 'Timer');
    }
  };

  const progress = total > 0 ? remaining / total : 0;

  // Cycle view styles on tap
  const handleToggleStyle = () => {
    buzzImpact('light');
    setViewMode((prev) => {
      if (prev === 'flip') return 'oled';
      if (prev === 'oled') return 'ring';
      return 'flip';
    });
  };

  // Stack values helper for flip clock style
  const totalSecs = Math.max(0, Math.ceil(remaining / 1000));
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  let topVal = String(mins).padStart(2, '0');
  let topLabel = 'MINUTES';
  let bottomVal = String(secs).padStart(2, '0');
  let bottomLabel = 'SECONDS';

  if (hrs > 0) {
    topVal = String(hrs).padStart(2, '0');
    topLabel = 'HOURS';
    bottomVal = String(mins).padStart(2, '0');
    bottomLabel = 'MINUTES';
  }

  // ── FULL-SCREEN IMMERSIVE MODE ──
  if (active || finished) {
    const isLandscape = screenW > screenH;
    const ringSize = isLandscape ? Math.min(screenH - 120, 240) : Math.min(screenW - 48, 300);
    const cardHeight = Math.min((screenH - 260) / 2, 230);

    // Calculate landscape-specific horizontal flip card dimensions
    const horizontalCardSize = isLandscape
      ? Math.min(screenW * 0.36, screenH * 0.65)
      : Math.min(screenW * 0.42, 170);

    return (
      <View style={styles.immersive}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setControlsVisible((v) => !v)}
          style={styles.immersiveTap}
        >
          {finished ? (
            <View style={styles.doneWrap}>
              <Text style={[styles.doneTitle, { color: accent.from, fontFamily: fonts.bold }]}>Time's up</Text>
              <Text style={[styles.doneSub, { fontFamily: fonts.medium }]}>Well done ✨</Text>
            </View>
          ) : (
            <View style={[styles.mainContent, isLandscape && styles.mainContentLandscape]}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleToggleStyle}
                style={[styles.modeContainer, isLandscape && styles.modeContainerLandscape]}
              >
                {/* Automatically adjust Flip clock style based on phone position */}
                {viewMode === 'flip' && isLandscape && (
                  <View style={styles.flipHorizontalWrapper}>
                    {/* Left card */}
                    <View style={[styles.flipCardHorizontal, { width: horizontalCardSize, height: horizontalCardSize }]}>
                      <View style={styles.flipSeam} />
                      <Text style={[styles.flipNumberHorizontal, { color: accent.from, fontFamily: fonts.bold, fontSize: isLandscape ? 90 : 76 }]}>{topVal}</Text>
                      <Text style={[styles.flipLabelHorizontal, { fontFamily: fonts.medium }]}>{topLabel.slice(0, 3)}</Text>
                    </View>

                    <Text style={[styles.flipColon, { color: accent.from, fontFamily: fonts.bold, fontSize: isLandscape ? 64 : 54 }]}>:</Text>

                    {/* Right card */}
                    <View style={[styles.flipCardHorizontal, { width: horizontalCardSize, height: horizontalCardSize }]}>
                      <View style={styles.flipSeam} />
                      <Text style={[styles.flipNumberHorizontal, { color: accent.from, fontFamily: fonts.bold, fontSize: isLandscape ? 90 : 76 }]}>{bottomVal}</Text>
                      <Text style={[styles.flipLabelHorizontal, { fontFamily: fonts.medium }]}>{bottomLabel.slice(0, 3)}</Text>
                    </View>
                  </View>
                )}

                {viewMode === 'flip' && !isLandscape && (
                  <View style={styles.flipWrapper}>
                    {/* Top card */}
                    <View style={[styles.flipCard, { height: cardHeight }]}>
                      <View style={styles.flipSeam} />
                      <Text style={[styles.flipNumber, { color: accent.from, fontFamily: fonts.bold }]}>{topVal}</Text>
                      <Text style={[styles.flipLabel, { fontFamily: fonts.medium }]}>{topLabel}</Text>
                    </View>
                    {/* Bottom card */}
                    <View style={[styles.flipCard, { height: cardHeight }]}>
                      <View style={styles.flipSeam} />
                      <Text style={[styles.flipNumber, { color: accent.from, fontFamily: fonts.bold }]}>{bottomVal}</Text>
                      <Text style={[styles.flipLabel, { fontFamily: fonts.medium }]}>{bottomLabel}</Text>
                    </View>
                  </View>
                )}

                {viewMode === 'oled' && (
                  <View style={[styles.oledContainer, isLandscape && styles.oledContainerLandscape]}>
                    <Text style={[styles.oledTime, { color: accent.from, fontFamily: fonts.bold, fontSize: isLandscape ? 72 : 58 }]}>{formatTime(remaining)}</Text>
                  </View>
                )}

                {viewMode === 'ring' && (
                  <View style={[styles.ringArea, isLandscape && styles.ringAreaLandscape]}>
                    <ProgressRing progress={progress} size={ringSize} strokeWidth={isLandscape ? 10 : 14} />
                    <View style={styles.ringCenter}>
                      <View style={styles.timeWrap}>
                        <Text style={[styles.bigTime, { color: COLORS.text, fontFamily: fonts.bold, fontSize: isLandscape ? 44 : 58 }]}>
                          {formatTime(remaining)}
                        </Text>
                        <Text style={[styles.status, { color: accent.from, fontFamily: fonts.medium, fontSize: isLandscape ? 10 : 12 }]}>
                          {isRunning ? '● Running' : '❚❚ Paused'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
              {controlsVisible && (
                <Text style={[styles.toggleHint, { fontFamily: fonts.medium, marginTop: isLandscape ? 10 : 20 }]}>Tap time to change style · tap outside to hide controls</Text>
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Controls — tap to toggle */}
        {controlsVisible && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={[
              styles.immersiveControls,
              isLandscape && styles.immersiveControlsLandscape,
              { bottom: Math.max(insets.bottom, 12) + 12 },
            ]}
          >
            <View style={styles.glassBarWrap}>
              <BlurView intensity={30} tint="dark" style={[styles.glassBar, isLandscape && styles.glassBarLandscape]}>
                {finished ? (
                  <RoundButton label="Done" variant="primary" onPress={handleReset} compact />
                ) : (
                  <>
                    <RoundButton
                      label={isRunning ? 'Pause' : 'Resume'}
                      variant="primary"
                      onPress={isRunning ? handlePause : handleResume}
                      compact
                    />
                    <View style={styles.immersiveRow}>
                      <RoundButton label="+1m" variant="glass" onPress={() => handleAdd(60000)} compact />
                      <View style={{ width: 10 }} />
                      <RoundButton label="+5m" variant="glass" onPress={() => handleAdd(300000)} compact />
                      <View style={{ width: 10 }} />
                      <RoundButton label="Reset" variant="glass" onPress={handleReset} compact />
                    </View>
                  </>
                )}
              </BlurView>
            </View>
          </Animated.View>
        )}
      </View>
    );
  }

  // ── SETUP MODE ──
  return (
    <View style={[styles.setup, { paddingTop: insets.top }]}>
      <Text style={[styles.setupTitle, { fontFamily: fonts.bold }]}>Set Timer</Text>
      <Text style={[styles.setupSub, { fontFamily: fonts.medium }]}>Choose your duration</Text>

      <View style={styles.previewWrap}>
        <Text style={[styles.previewTime, { color: draftSeconds > 0 ? COLORS.text : COLORS.textDim, fontFamily: fonts.bold }]}>
          {formatTime(draftSeconds * 1000)}
        </Text>
      </View>

      <TimePicker value={draft} onChange={setDraft} />

      <View style={{ height: 28 }} />
      <RoundButton label="Start" variant="primary" onPress={handleStart} disabled={draftSeconds <= 0} />
    </View>
  );
}

const styles = StyleSheet.create({
  // ── IMMERSIVE ──
  immersive: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  immersiveTap: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 20,
    textAlign: 'center',
  },

  // Style 1: Flip Clock Style (Vertical)
  flipWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipCard: {
    width: '88%',
    backgroundColor: '#111115',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  flipSeam: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1.5,
    backgroundColor: '#000000',
    opacity: 0.75,
    zIndex: 2,
  },
  flipNumber: {
    fontSize: 120,
    zIndex: 1,
  },
  flipLabel: {
    position: 'absolute',
    bottom: 12,
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
    zIndex: 3,
  },

  // Style 1B: Flip Clock Style (Horizontal)
  flipHorizontalWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  flipCardHorizontal: {
    backgroundColor: '#111115',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  flipNumberHorizontal: {
    fontSize: 76,
    zIndex: 1,
  },
  flipLabelHorizontal: {
    position: 'absolute',
    bottom: 10,
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5,
    zIndex: 3,
    textTransform: 'uppercase',
  },
  flipColon: {
    fontSize: 54,
    marginHorizontal: 10,
  },

  // Style 2: OLED Minimalist Pill
  oledContainer: {
    width: '88%',
    aspectRatio: 1.8,
    backgroundColor: '#0F0F12',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oledTime: {
    fontSize: 58,
    letterSpacing: 1.5,
  },

  // Style 3: Ring View
  ringArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeWrap: {
    alignItems: 'center',
  },
  bigTime: {
    fontSize: 58,
    letterSpacing: 2,
  },
  status: {
    fontSize: 12,
    marginTop: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  doneWrap: {
    alignItems: 'center',
  },
  doneTitle: {
    fontSize: 42,
  },
  doneSub: {
    fontSize: 16,
    color: COLORS.textDim,
    marginTop: 8,
  },
  immersiveControls: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  glassBarWrap: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  glassBar: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  immersiveRow: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'center',
  },

  // ── SETUP ──
  setup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  setupTitle: {
    fontSize: 32,
    color: COLORS.text,
    marginBottom: 6,
  },
  setupSub: {
    fontSize: 14,
    color: COLORS.textDim,
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  previewWrap: {
    marginBottom: 24,
  },
  previewTime: {
    fontSize: 52,
    letterSpacing: 2,
  },
  mainContentLandscape: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  modeContainerLandscape: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  oledContainerLandscape: {
    width: '70%',
    aspectRatio: 3,
    borderRadius: 24,
  },
  ringAreaLandscape: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  immersiveControlsLandscape: {
    position: 'absolute',
    width: '90%',
    alignSelf: 'center',
  },
  glassBarLandscape: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
});
