import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon, { ItemIcon, TreatIcon } from './Icon';
import { FONT_BOLD, FONT_SEMIBOLD } from '../theme';

const CONFETTI_COLORS = ['#E07A5F', '#81B29A', '#E9B44C', '#7B6FB0', '#F0627A', '#5EC2E0'];

function ConfettiPiece({ w, h, seed }) {
  const t = useSharedValue(0);
  const x0 = seed.x * w;
  const drift = (seed.d - 0.5) * 120;
  useEffect(() => {
    t.value = withDelay(seed.delay, withTiming(1, { duration: seed.dur, easing: Easing.in(Easing.quad) }));
  }, [t, seed]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value > 0.85 ? (1 - t.value) / 0.15 : 1,
    transform: [
      { translateX: x0 + drift * t.value + Math.sin(t.value * 10 + seed.d * 6) * 18 },
      { translateY: -40 + t.value * (h + 80) },
      { rotate: `${seed.r + t.value * 720 * (seed.d > 0.5 ? 1 : -1)}deg` },
      { scaleX: Math.cos(t.value * 12 + seed.d * 3) },
    ],
  }));
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: 0, top: 0, width: seed.size, height: seed.size * (seed.round ? 1 : 0.45), borderRadius: seed.round ? seed.size : 2, backgroundColor: seed.color },
        style,
      ]}
    />
  );
}

export function Confetti({ burstKey }) {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(
    () =>
      Array.from({ length: 46 }, () => ({
        x: Math.random(),
        d: Math.random(),
        r: Math.random() * 360,
        delay: Math.random() * 500,
        dur: 2000 + Math.random() * 1400,
        size: 7 + Math.random() * 7,
        round: Math.random() < 0.3,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      })),
    [burstKey] // eslint-disable-line react-hooks/exhaustive-deps
  );
  if (!burstKey) return null;
  return (
    <View key={burstKey} pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} w={width} h={height} seed={p} />
      ))}
    </View>
  );
}

export function Rays({ size, color = '#FFE9A8' }) {
  const spin = useSharedValue(0);
  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(spin);
  }, [spin]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const c = size / 2;
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a0 = (i / 12) * Math.PI * 2;
    const a1 = a0 + Math.PI / 18;
    return `M${c} ${c} L${c + Math.cos(a0) * c} ${c + Math.sin(a0) * c} L${c + Math.cos(a1) * c} ${c + Math.sin(a1) * c} Z`;
  }).join(' ');
  return (
    <Animated.View entering={FadeIn.duration(500)} style={[{ position: 'absolute', width: size, height: size, left: -size / 2, top: -size / 2 }, style]}>
      <Svg width={size} height={size}>
        <Path d={rays} fill={color} opacity={0.55} />
      </Svg>
    </Animated.View>
  );
}

function Sparkle({ dx, dy, delay }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 500 }), withTiming(0, { duration: 500 })), -1, false));
    return () => cancelAnimation(t);
  }, [t, delay]);
  const style = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ scale: 0.4 + t.value * 0.8 }, { rotate: `${t.value * 90}deg` }] }));
  return (
    <Animated.View style={[styles.sparkle, { left: dx, top: dy }, style]}>
      <Icon name="sparkle" size={18} color="#FFC94D" />
    </Animated.View>
  );
}

/**
 * A gift box that falls in, wiggles until tapped, then bursts open to reveal `item`.
 * (x, y) is the point on the floor where it lands, in dp.
 */
export function GiftBox({ x, y, s, opened, item, onPress, treats }) {
  const drop = useSharedValue(0);
  const squash = useSharedValue(0);
  const wiggle = useSharedValue(0);
  const lid = useSharedValue(0);
  const reveal = useSharedValue(0);
  const W = 64 * s;
  const H = 52 * s;

  useEffect(() => {
    drop.value = withTiming(1, { duration: 650, easing: Easing.in(Easing.quad) }, () => {
      squash.value = withSequence(withTiming(1, { duration: 90 }), withSpring(0, { damping: 6, stiffness: 220 }));
    });
    wiggle.value = withDelay(1200, withRepeat(withSequence(withTiming(1, { duration: 90 }), withTiming(-1, { duration: 90 }), withTiming(1, { duration: 90 }), withTiming(0, { duration: 90 }), withDelay(1300, withTiming(0, { duration: 1 }))), -1, false));
    return () => cancelAnimation(wiggle);
  }, [drop, squash, wiggle]);

  useEffect(() => {
    if (!opened) return;
    cancelAnimation(wiggle);
    wiggle.value = withTiming(0, { duration: 80 });
    lid.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    reveal.value = withDelay(120, withSpring(1, { damping: 9, stiffness: 120 }));
  }, [opened, lid, reveal, wiggle]);

  const boxStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(drop.value, [0, 1], [-y - 120, 0]) },
      { rotate: `${wiggle.value * 7}deg` },
      { scaleY: 1 - squash.value * 0.22 },
      { scaleX: 1 + squash.value * 0.18 },
    ],
  }));
  const shadowStyle = useAnimatedStyle(() => ({ opacity: drop.value * 0.18, transform: [{ scaleX: 0.4 + drop.value * 0.6 }] }));
  const lidStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.max(0, lid.value - 0.6) / 0.4,
    transform: [{ translateY: -lid.value * 90 * s }, { translateX: lid.value * 50 * s }, { rotate: `${lid.value * 70}deg` }],
  }));
  const itemStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, reveal.value * 2),
    transform: [{ translateY: -reveal.value * 78 * s }, { scale: 0.2 + reveal.value * 0.9 }],
  }));

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: x - W / 2, top: y - H, width: W, height: H }}>
      <Animated.View style={[styles.boxShadow, { width: W, height: 10 * s, bottom: -5 * s, borderRadius: W }, shadowStyle]} />
      {opened && (
        <Animated.View style={[{ position: 'absolute', left: W / 2, top: H / 2 }, itemStyle]}>
          <Rays size={170 * s} />
          <View style={{ position: 'absolute', left: -26 * s, top: -30 * s }}>
            <ItemIcon name={item.key} size={52 * s} />
          </View>
          <Sparkle dx={-50 * s} dy={-40 * s} delay={0} />
          <Sparkle dx={34 * s} dy={-48 * s} delay={300} />
          <Sparkle dx={40 * s} dy={10 * s} delay={600} />
          {treats > 0 && (
            <Animated.View entering={FadeIn.delay(500)} style={[styles.plusRow, { top: 26 * s, left: -40 * s, width: 80 * s }]}>
              <Text style={styles.plus}>+{treats}</Text>
              <TreatIcon size={20 * s} />
            </Animated.View>
          )}
        </Animated.View>
      )}
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '50% 100%' }, boxStyle]}>
        <Pressable onPress={onPress} disabled={opened} hitSlop={20} style={StyleSheet.absoluteFill}>
          <Svg width={W} height={H} viewBox="0 0 64 52">
            <Rect x="4" y="14" width="56" height="38" rx="5" fill="#E07A5F" />
            <Rect x="27" y="14" width="10" height="38" fill="#F6D5CB" />
            <Rect x="4" y="14" width="56" height="6" fill="#000" opacity="0.08" />
          </Svg>
          <Animated.View style={[StyleSheet.absoluteFill, lidStyle]}>
            <Svg width={W} height={H} viewBox="0 0 64 52">
              <Path d="M32 10 C22 -2 12 4 20 10 Z M32 10 C42 -2 52 4 44 10 Z" fill="#F6D5CB" />
              <Rect x="0" y="8" width="64" height="12" rx="4" fill="#C8553D" />
              <Rect x="27" y="8" width="10" height="12" fill="#F6D5CB" />
            </Svg>
          </Animated.View>
        </Pressable>
      </Animated.View>
      {!opened && (
        <Animated.View entering={FadeIn.delay(900)} exiting={FadeOut} style={[styles.tapHint, { top: -34 * s, left: W / 2 - 34 * s, width: 68 * s }]}>
          <Text style={styles.tapText}>Tap!</Text>
        </Animated.View>
      )}
    </View>
  );
}

/** Trash tossed onto the floor after giving up */
export function TrashDrop({ x, y, s, item }) {
  const t = useSharedValue(0);
  const puff = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: 600, easing: Easing.bounce });
    puff.value = withDelay(260, withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) }));
  }, [t, puff]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(t.value, [0, 1], [-y - 60, 0]) }, { rotate: `${t.value * 200}deg` }],
  }));
  const puffStyle = (dir) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => ({
      opacity: puff.value < 0.1 ? puff.value * 8 : 0.8 * (1 - puff.value),
      transform: [{ translateX: dir * puff.value * 30 * s }, { translateY: -puff.value * 10 * s }, { scale: 0.5 + puff.value }],
    }));
  const pl = puffStyle(-1);
  const pr = puffStyle(1);
  const size = 34 * s;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x - size / 2, top: y - size }}>
      <Animated.View style={[styles.puff, { width: 14 * s, height: 14 * s, left: size / 2 - 7 * s, top: size - 10 * s }, pl]} />
      <Animated.View style={[styles.puff, { width: 14 * s, height: 14 * s, left: size / 2 - 7 * s, top: size - 10 * s }, pr]} />
      <Animated.View style={style}>
        <ItemIcon name={item.key} size={size} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  boxShadow: { position: 'absolute', left: 0, backgroundColor: '#000' },
  sparkle: { position: 'absolute' },
  plusRow: { position: 'absolute', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  plus: { fontFamily: FONT_BOLD, fontSize: 18, color: '#3B2F2A' },
  tapHint: { position: 'absolute', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 3 },
  tapText: { fontFamily: FONT_SEMIBOLD, fontSize: 13, color: '#E07A5F' },
  puff: { position: 'absolute', borderRadius: 20, backgroundColor: '#FFFFFF' },
});
