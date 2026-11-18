import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
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
  withTiming,
} from 'react-native-reanimated';
import Critter, { CRITTER_VB } from './Critter';
import { shade } from '../utils/color';

// Design space is 360 units wide; everything is laid out relative to the chair seat (SEAT = 300 in chair art).
const DW = 360;
const SEAT = 300;

// Window glass in design units, and the margin its frame/curtain overlay adds around it
const WIN = { x: 46, w: 124, h: 108, padX: 34, padTop: 26, padBottom: 18 };

export function sceneLayout(width, seatY, height = Infinity) {
  // On wide screens keep the room at phone proportions and centre it
  const s = Math.min(width / DW, height / 700);
  const ox = (width - DW * s) / 2;
  const seatU = seatY / s;
  const floorU = seatU - 30;
  const spot = (cx, feetU, w) => {
    const cw = w * s;
    const ch = (cw * CRITTER_VB.h) / CRITTER_VB.w;
    const feet = (ch * 204) / CRITTER_VB.h;
    return { left: ox + cx * s - cw / 2, top: feetU * s - feet, width: cw, height: ch };
  };
  const chairSpot = spot(180, seatU + 6, 150);
  const rugSpot = spot(96, seatU + 62, 104);
  return {
    s,
    ox,
    seatU,
    floorU,
    chairSpot,
    rugSpot,
    giftSpot: { x: ox + 272 * s, y: (seatU + 64) * s },
    // everywhere the critter can sit while wandering around the room
    spots: {
      chair: chairSpot,
      rug: rugSpot,
      floorLeft: rugSpot,
      floorMid: spot(180, seatU + 66, 106),
      floorRight: spot(262, seatU + 64, 104),
      sill: spot(96, floorU - 196 + WIN.h + 5, 70),
    },
  };
}

const rand = (a, b) => a + Math.random() * (b - a);
const WALK_SPEED = 70; // design units per second

function useLoop(duration, { delay = 0, reverse = true, easing = Easing.inOut(Easing.sin), enabled = true } = {}) {
  const v = useSharedValue(0);
  useEffect(() => {
    if (!enabled) return undefined;
    v.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing }), -1, reverse));
    return () => cancelAnimation(v);
  }, [v, duration, delay, reverse, easing, enabled]);
  return v;
}

// Hand-drawn outline colour for a room's furniture
const lineFor = (room) => (room.dark ? '#120F24' : '#5B4033');

// ---------- things that move outside the window ----------

function Cloud({ w, y, scale, duration, delay, live, tint = '#FFFFFF' }) {
  const t = useLoop(duration, { delay, reverse: false, easing: Easing.linear, enabled: live });
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(t.value, [0, 1], [-60 * scale, w + 10]) }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', top: y }, live ? style : { left: w * 0.3 }]}>
      <Svg width={60 * scale} height={24 * scale} viewBox="0 0 60 24">
        <Ellipse cx="22" cy="15" rx="18" ry="8" fill={tint} />
        <Ellipse cx="36" cy="11" rx="14" ry="9" fill={tint} />
        <Ellipse cx="46" cy="16" rx="12" ry="6" fill={tint} />
      </Svg>
    </Animated.View>
  );
}

function Star({ x, y, r, delay, live }) {
  const t = useLoop(1400 + (delay % 900), { delay, enabled: live });
  const style = useAnimatedStyle(() => ({ opacity: 0.3 + t.value * 0.7, transform: [{ scale: 0.7 + t.value * 0.5 }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: r, backgroundColor: '#FFFFFF' }, style]} />
  );
}

function Drop({ x, h, delay, speed, live }) {
  const t = useLoop(speed, { delay, reverse: false, easing: Easing.linear, enabled: live });
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: interpolate(t.value, [0, 1], [-20, h + 10]) }, { rotate: '12deg' }] }));
  return <Animated.View style={[styles.drop, { left: x }, style]} />;
}

// Blossom petals and snowflakes: fall slowly while drifting side to side
function Drifter({ x, h, delay, speed, size, color, petal, s, live }) {
  const t = useLoop(speed, { delay, reverse: false, easing: Easing.linear, enabled: live });
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.1 ? t.value * 10 : t.value > 0.9 ? (1 - t.value) * 10 : 1,
    transform: [
      { translateY: interpolate(t.value, [0, 1], [-10, h + 6]) },
      { translateX: Math.sin(t.value * Math.PI * 3) * 7 * s },
      { rotate: `${t.value * (petal ? 520 : 0)}deg` },
    ],
  }));
  if (!live) return null;
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: x, top: 0, width: size * (petal ? 1.5 : 1), height: size, borderRadius: size, backgroundColor: color },
        petal && { borderTopLeftRadius: 0 },
        style,
      ]}
    />
  );
}

// Something that crosses the glass now and then, with a long pause in between
function useCrossing(live, { delay, travel, pause, easing = Easing.linear }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (!live) return undefined;
    t.value = 0;
    t.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: travel, easing }), withDelay(pause, withTiming(0, { duration: 0 }))), -1, false));
    return () => cancelAnimation(t);
  }, [live, t, delay, travel, pause, easing]);
  return t;
}

function Bird({ w, y, s, delay, live }) {
  const t = useCrossing(live, { delay, travel: 6500, pause: 12000 });
  const flap = useLoop(200, { enabled: live, easing: Easing.inOut(Easing.quad) });
  const fly = useAnimatedStyle(() => ({
    opacity: t.value > 0.001 && t.value < 0.999 ? 1 : 0,
    transform: [{ translateX: interpolate(t.value, [0, 1], [-16 * s, w + 8 * s]) }, { translateY: Math.sin(t.value * Math.PI * 3) * 3 * s }],
  }));
  const wings = useAnimatedStyle(() => ({ transform: [{ scaleY: 0.35 + flap.value * 0.75 }] }));
  if (!live) return null;
  return (
    <Animated.View style={[{ position: 'absolute', left: 0, top: y }, fly]}>
      <Animated.View style={wings}>
        <Svg width={12 * s} height={5 * s} viewBox="0 0 12 5">
          <Path d="M0.5 4 Q3 0.5 6 3.5 Q9 0.5 11.5 4" stroke="#5B4636" strokeWidth="1.3" strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

function ShootingStar({ w, h, s, live }) {
  const t = useCrossing(live, { delay: 4000, travel: 900, pause: 14000, easing: Easing.out(Easing.quad) });
  const style = useAnimatedStyle(() => ({
    opacity: t.value > 0.001 && t.value < 0.999 ? Math.sin(t.value * Math.PI) : 0,
    transform: [{ translateX: interpolate(t.value, [0, 1], [w * 0.15, w * 0.75]) }, { translateY: interpolate(t.value, [0, 1], [h * 0.06, h * 0.32]) }, { rotate: '24deg' }],
  }));
  if (!live) return null;
  return <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: 20 * s, height: 1.6 * s, borderRadius: s, backgroundColor: '#FFF8D6' }, style]} />;
}

// Raindrop sliding down the inside of the glass, speeding up as it goes
function GlassDrip({ x, h, s, delay, live }) {
  const t = useCrossing(live, { delay, travel: 4200, pause: 2600, easing: Easing.in(Easing.quad) });
  const style = useAnimatedStyle(() => ({
    opacity: t.value > 0.001 && t.value < 0.95 ? 0.75 : 0,
    transform: [{ translateY: interpolate(t.value, [0, 1], [h * 0.1, h]) }],
  }));
  if (!live) return null;
  return <Animated.View style={[{ position: 'absolute', left: x, top: 0, width: 3 * s, height: 4.5 * s, borderRadius: 2 * s, backgroundColor: 'rgba(255,255,255,0.7)' }, style]} />;
}

// A curtain hanging from the rod, drifting slightly in a breeze
function Curtain({ side, ow, oh, VW, VH, breeze, live, children }) {
  const on = live && breeze;
  const t = useLoop(side === 'L' ? 4800 : 5600, { delay: side === 'L' ? 0 : 1300, enabled: on });
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${interpolate(t.value, [0, 1], [-1, 1.6]) * (side === 'L' ? 1 : -1)}deg` }] }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: side === 'L' ? '14% 8%' : '86% 8%' }, on && style]}>
      <Svg width={ow} height={oh} viewBox={`0 0 ${VW} ${VH}`}>
        {side === 'L' ? children : <G transform={`translate(${VW} 0) scale(-1 1)`}>{children}</G>}
      </Svg>
    </Animated.View>
  );
}

// ---------- window views (drawn in the 124x108 glass box) ----------

function Hills({ far, near, w = 124, h = 108 }) {
  return (
    <G>
      <Path d={`M0 ${h * 0.7} Q${w * 0.3} ${h * 0.52} ${w * 0.6} ${h * 0.66} T${w} ${h * 0.6} L${w} ${h} L0 ${h} Z`} fill={far} />
      <Path d={`M0 ${h * 0.84} Q${w * 0.25} ${h * 0.7} ${w * 0.5} ${h * 0.8} T${w} ${h * 0.76} L${w} ${h} L0 ${h} Z`} fill={near} />
    </G>
  );
}

function Tree({ x, y, r, c }) {
  return (
    <G>
      <Rect x={x - 1} y={y} width="2" height={r * 1.2} fill="#7A5A44" />
      <Circle cx={x} cy={y - r * 0.2} r={r} fill={c} />
    </G>
  );
}

function WindowView({ room }) {
  const id = `sky-${room.key}`;
  const sky = (
    <Defs>
      <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={room.sky} />
        <Stop offset="1" stopColor={room.skyLow} />
      </LinearGradient>
    </Defs>
  );
  let art = null;
  switch (room.view) {
    case 'sea':
      art = (
        <G>
          <Circle cx="62" cy="72" r="30" fill="#FFD79A" opacity="0.35" />
          <Circle cx="62" cy="72" r="18" fill="#FFB36B" />
          <Rect x="0" y="72" width="124" height="36" fill="#E8907A" />
          <Rect x="0" y="72" width="124" height="5" fill="#F4B08F" />
          <G stroke="#FFD8A8" strokeWidth="2" strokeLinecap="round" opacity="0.9">
            <Line x1="46" y1="80" x2="78" y2="80" />
            <Line x1="52" y1="86" x2="72" y2="86" />
            <Line x1="57" y1="92" x2="67" y2="92" />
          </G>
          <G stroke="#8A4E4E" strokeWidth="1.4" fill="none" strokeLinecap="round">
            <Path d="M20 30 Q23 27 26 30 Q29 27 32 30" />
            <Path d="M34 40 Q36 38 38 40 Q40 38 42 40" />
          </G>
          <Path d="M96 72 L100 50 L104 72 Z" fill="#FFF4E8" />
          <Path d="M92 72 L108 72 L105 76 L95 76 Z" fill="#8A4E4E" />
        </G>
      );
      break;
    case 'city':
      art = (
        <G>
          <Circle cx="92" cy="26" r="11" fill="#F8F1D0" />
          <Circle cx="98" cy="22" r="10" fill={room.sky} />
          <G fill="#23264A">
            <Rect x="0" y="62" width="18" height="46" />
            <Rect x="20" y="50" width="16" height="58" />
            <Rect x="38" y="70" width="22" height="38" />
            <Rect x="62" y="44" width="14" height="64" />
            <Rect x="78" y="66" width="20" height="42" />
            <Rect x="100" y="56" width="24" height="52" />
          </G>
          <G fill="#FFD97A">
            {[
              [4, 68], [10, 80], [24, 56], [30, 66], [24, 84], [42, 76], [50, 86], [66, 50], [66, 62], [70, 80],
              [82, 72], [90, 84], [104, 62], [112, 74], [118, 90],
            ].map(([x, y]) => (
              <Rect key={`${x}-${y}`} x={x} y={y} width="3" height="4" rx="0.6" />
            ))}
          </G>
        </G>
      );
      break;
    case 'meadow':
      art = (
        <G>
          <Circle cx="98" cy="24" r="16" fill="#FFF6C9" opacity="0.5" />
          <Circle cx="98" cy="24" r="10" fill="#FFE68A" />
          <Path d="M0 72 Q30 50 64 64 T124 58 L124 108 L0 108 Z" fill="#B9DDB0" />
          {/* little cottage on the hill */}
          <Rect x="78" y="56" width="18" height="12" fill="#FFF7EC" />
          <Path d="M75 57 L87 47 L99 57 Z" fill="#E07A5F" />
          <Rect x="85" y="61" width="4" height="7" fill="#8A5E3E" />
          <Rect x="80" y="59" width="3" height="3" fill="#9CC8E6" />
          <Tree x={30} y={60} r={6} c="#8CC59A" />
          <Tree x={40} y={63} r={4.5} c="#7DB88C" />
          <Path d="M0 86 Q34 72 70 82 T124 78 L124 108 L0 108 Z" fill="#94C98E" />
          <G>
            {[[10, 94, '#FFFFFF'], [22, 100, '#F7C6CF'], [34, 92, '#FFE68A'], [52, 98, '#FFFFFF'], [66, 92, '#F7C6CF'], [84, 100, '#FFE68A'], [100, 92, '#FFFFFF'], [114, 98, '#F7C6CF']].map(
              ([x, y, c]) => (
                <Circle key={`${x}`} cx={x} cy={y} r="1.8" fill={c} />
              )
            )}
          </G>
        </G>
      );
      break;
    case 'blossom':
      art = (
        <G>
          <Hills far="#D7EBCF" near="#BFDDB4" />
          <Tree x={24} y={72} r={7} c="#F7C6CF" />
          <Tree x={96} y={76} r={5} c="#F4B3C2" />
          {/* branch reaching in from the corner */}
          <Path d="M124 6 C104 10 92 18 78 34 M98 16 C94 26 96 34 92 42" stroke="#7A5246" strokeWidth="3" strokeLinecap="round" fill="none" />
          {[[78, 34, 6], [86, 26, 5], [96, 18, 6], [108, 10, 6], [92, 42, 5], [100, 30, 4], [118, 18, 5]].map(([x, y, r]) => (
            <G key={`${x}-${y}`}>
              <Circle cx={x} cy={y} r={r} fill="#F7C6CF" />
              <Circle cx={x - 1} cy={y - 1} r={r * 0.45} fill="#FFFFFF" opacity="0.7" />
            </G>
          ))}
        </G>
      );
      break;
    case 'snow':
      art = (
        <G>
          <Circle cx="96" cy="24" r="10" fill="#F8F1D0" />
          <Circle cx="96" cy="24" r="16" fill="#F8F1D0" opacity="0.18" />
          <Path d="M0 70 Q30 54 62 66 T124 62 L124 108 L0 108 Z" fill="#C9D2EE" />
          {[[18, 68], [32, 64], [104, 66]].map(([x, y]) => (
            <G key={x}>
              <Path d={`M${x} ${y - 18} L${x + 8} ${y} L${x - 8} ${y} Z`} fill="#2F5D50" />
              <Path d={`M${x} ${y - 18} L${x + 3} ${y - 11} L${x - 3} ${y - 11} Z`} fill="#FFFFFF" />
            </G>
          ))}
          <Path d="M0 84 Q40 74 74 82 T124 80 L124 108 L0 108 Z" fill="#F4F6FF" />
          {/* someone's home across the field */}
          <Rect x="62" y="70" width="14" height="10" fill="#6B4A3A" />
          <Path d="M60 71 L69 63 L78 71 Z" fill="#FFFFFF" />
          <Rect x="66" y="73" width="4" height="4" fill="#FFD97A" />
        </G>
      );
      break;
    case 'rain':
      art = <Hills far="#A4AEB6" near="#8E9AA3" />;
      break;
    default:
      art = (
        <G>
          <Circle cx="98" cy="24" r="18" fill="#FFF6C9" opacity="0.45" />
          <Circle cx="98" cy="24" r="11" fill="#FFF0A0" />
          <Hills far="#B9E0BD" near="#9FD3A8" />
          <Tree x={22} y={78} r={6} c="#7DB88C" />
          <Tree x={34} y={80} r={4} c="#8CC59A" />
          <Tree x={104} y={80} r={5} c="#7DB88C" />
        </G>
      );
  }
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${WIN.w} ${WIN.h}`} preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
      {sky}
      <Rect width={WIN.w} height={WIN.h} fill={`url(#${id})`} />
      {art}
    </Svg>
  );
}

function SkyWindow({ room, x, y, s, live }) {
  const w = WIN.w * s;
  const h = WIN.h * s;
  const view = room.view;
  const drops = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ x: (i / 14) * w + Math.random() * 6, delay: Math.random() * 900, speed: 550 + Math.random() * 300 })), [w]);
  const stars = useMemo(
    () => Array.from({ length: 9 }, (_, i) => ({ x: 8 + Math.random() * (w - 16), y: 6 + Math.random() * (h * 0.45), r: 1 + Math.random() * 1.4, delay: i * 330 })),
    [w, h]
  );
  const drifters = useMemo(
    () => Array.from({ length: view === 'snow' ? 16 : 7 }, (_, i) => ({ x: Math.random() * w, delay: i * 650 + Math.random() * 400, speed: 5200 + Math.random() * 3000 })),
    [w, view]
  );
  const ow = (WIN.w + WIN.padX * 2) * s;
  const oh = (WIN.h + WIN.padTop + WIN.padBottom) * s;
  const VW = WIN.w + WIN.padX * 2;
  const VH = WIN.h + WIN.padTop + WIN.padBottom;
  const gx = WIN.padX;
  const gy = WIN.padTop;
  const frame = room.dark ? (room.view === 'snow' ? '#5A3A2A' : '#C9C3E6') : '#FFFDF8';
  const line = lineFor(room);
  const curtain = room.curtain;
  const fold = shade(curtain, -0.14);
  const trim = room.curtainTrim || shade(curtain, -0.2);
  const breeze = room.time === 'day' || room.time === 'sunset';
  const half = (
    <G>
      <Path d={`M4 12 L50 12 C48 44 40 70 30 86 C36 104 42 124 44 ${VH - 4} Q24 ${VH} 2 ${VH - 4} L4 12 Z`} fill={curtain} stroke={line} strokeOpacity="0.45" strokeWidth="1.6" />
      <G stroke={fold} strokeWidth="2" fill="none" strokeLinecap="round">
        <Path d="M16 16 C16 40 18 64 22 84" />
        <Path d="M32 16 C32 40 30 66 26 84" />
        <Path d="M22 92 C20 110 18 128 14 146" />
        <Path d="M32 94 C34 112 34 130 34 146" />
      </G>
      <Path d={`M50 12 C48 44 40 70 30 86 C36 104 42 124 44 ${VH - 4}`} stroke={trim} strokeWidth="3" fill="none" />
      <Ellipse cx="29" cy="87" rx="10" ry="4.5" fill={trim} stroke={line} strokeOpacity="0.4" strokeWidth="1.2" />
    </G>
  );
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x - WIN.padX * s, top: y - WIN.padTop * s, width: ow, height: oh }}>
      <View style={{ position: 'absolute', left: gx * s, top: gy * s, width: w, height: h, overflow: 'hidden', borderRadius: 4 * s }}>
        <WindowView room={room} />
        {(view === 'city' || view === 'snow') && stars.map((st, i) => <Star key={i} {...st} live={live} />)}
        {(room.time === 'day' || room.time === 'sunset') && (
          <>
            <Cloud w={w} y={h * 0.1} scale={s} duration={26000} delay={0} live={live} tint={room.time === 'sunset' ? '#FFE3D0' : '#FFFFFF'} />
            <Cloud w={w} y={h * 0.36} scale={s * 0.7} duration={34000} delay={9000} live={live} tint={room.time === 'sunset' ? '#FFE3D0' : '#FFFFFF'} />
          </>
        )}
        {view === 'rain' && (
          <>
            <Cloud w={w} y={-4 * s} scale={s * 1.3} duration={40000} delay={0} live={live} tint="#C9D0DA" />
            {drops.map((d, i) => (
              <Drop key={i} {...d} h={h} live={live} />
            ))}
          </>
        )}
        {view === 'blossom' &&
          drifters.map((d, i) => <Drifter key={i} {...d} h={h} s={s} size={4 * s} color={i % 2 ? '#F7C6CF' : '#FBDDE3'} petal live={live} />)}
        {view === 'snow' && drifters.map((d, i) => <Drifter key={i} {...d} h={h} s={s} size={(2 + (i % 3)) * s} color="#FFFFFF" live={live} />)}
        {(view === 'hills' || view === 'meadow' || view === 'blossom' || view === 'sea') && (
          <>
            <Bird w={w} y={h * 0.22} s={s} delay={3000} live={live} />
            <Bird w={w} y={h * 0.3} s={s * 0.8} delay={3600} live={live} />
          </>
        )}
        {(view === 'city' || view === 'snow') && <ShootingStar w={w} h={h} s={s} live={live} />}
        {view === 'rain' &&
          [0.2, 0.55, 0.8].map((k, i) => <GlassDrip key={k} x={w * k} h={h} s={s} delay={i * 1700} live={live} />)}
      </View>
      <Svg width={ow} height={oh} viewBox={`0 0 ${VW} ${VH}`} style={StyleSheet.absoluteFill}>
        {/* glass glare */}
        <G opacity="0.22">
          <Path d={`M${gx + 12} ${gy + 4} L${gx + 22} ${gy + 4} L${gx + 6} ${gy + 44} L${gx + 2} ${gy + 44} Z`} fill="#FFFFFF" />
          <Path d={`M${gx + 26} ${gy + 4} L${gx + 30} ${gy + 4} L${gx + 14} ${gy + 44} L${gx + 10} ${gy + 44} Z`} fill="#FFFFFF" />
        </G>
        {/* frame + muntins */}
        <Rect x={gx - 4} y={gy - 4} width={WIN.w + 8} height={WIN.h + 8} rx="7" fill="none" stroke={frame} strokeWidth="8" />
        <Rect x={gx - 8} y={gy - 8} width={WIN.w + 16} height={WIN.h + 16} rx="10" fill="none" stroke={line} strokeOpacity="0.35" strokeWidth="1.4" />
        <Rect x={gx + WIN.w / 2 - 3} y={gy} width="6" height={WIN.h} fill={frame} />
        <Rect x={gx} y={gy + WIN.h / 2 - 3} width={WIN.w} height="6" fill={frame} />
        {/* sill */}
        <Rect x={gx - 14} y={gy + WIN.h + 4} width={WIN.w + 28} height="9" rx="4" fill={frame} stroke={line} strokeOpacity="0.35" strokeWidth="1.4" />
        <Rect x={gx - 10} y={gy + WIN.h + 13} width={WIN.w + 20} height="3" rx="1.5" fill="#000" opacity="0.08" />
        {/* tiny pot on the sill */}
        <Path d={`M${gx + 92} ${gy + WIN.h - 4} L${gx + 104} ${gy + WIN.h - 4} L${gx + 102} ${gy + WIN.h + 4} L${gx + 94} ${gy + WIN.h + 4} Z`} fill="#D98C6A" />
        <Circle cx={gx + 95} cy={gy + WIN.h - 7} r="3.4" fill="#7DB88C" />
        <Circle cx={gx + 101} cy={gy + WIN.h - 8} r="3.8" fill="#8CC59A" />
        <Circle cx={gx + 98} cy={gy + WIN.h - 11} r="3.2" fill="#6FA287" />
      </Svg>
      <Curtain side="L" ow={ow} oh={oh} VW={VW} VH={VH} breeze={breeze} live={live}>
        {half}
      </Curtain>
      <Curtain side="R" ow={ow} oh={oh} VW={VW} VH={VH} breeze={breeze} live={live}>
        {half}
      </Curtain>
      <Svg width={ow} height={oh} viewBox={`0 0 ${VW} ${VH}`} style={StyleSheet.absoluteFill}>
        <Rect x="-2" y="8" width={VW + 4} height="5" rx="2.5" fill="#8A5E3E" />
        <Circle cx="3" cy="10.5" r="5" fill="#8A5E3E" />
        <Circle cx={VW - 3} cy="10.5" r="5" fill="#8A5E3E" />
      </Svg>
    </View>
  );
}

// ---------- wallpaper + floor ----------

function WallPattern({ room, id }) {
  const c = room.pattern;
  const dim = room.dark ? 0.35 : 1;
  switch (room.wallpaper) {
    case 'florals':
      return (
        <Pattern id={id} patternUnits="userSpaceOnUse" width="48" height="48">
          {[
            [12, 14, 1],
            [36, 38, 0.8],
          ].map(([x, y, k]) => (
            <G key={x} opacity={0.75 * dim}>
              <Ellipse cx={x - 6 * k} cy={y + 5 * k} rx={3.4 * k} ry={1.8 * k} fill="#9CB79F" transform={`rotate(-30 ${x - 6 * k} ${y + 5 * k})`} />
              {[0, 72, 144, 216, 288].map((deg) => (
                <Circle key={deg} cx={x + Math.cos((deg * Math.PI) / 180) * 3.6 * k} cy={y + Math.sin((deg * Math.PI) / 180) * 3.6 * k} r={2.8 * k} fill={c} />
              ))}
              <Circle cx={x} cy={y} r={1.8 * k} fill="#F4D27A" />
            </G>
          ))}
          <Circle cx="36" cy="12" r="1.3" fill={c} opacity={0.5 * dim} />
          <Circle cx="12" cy="36" r="1.3" fill={c} opacity={0.5 * dim} />
        </Pattern>
      );
    case 'gingham':
      return (
        <Pattern id={id} patternUnits="userSpaceOnUse" width="20" height="20">
          <Rect x="0" y="0" width="10" height="20" fill={c} opacity={0.3 * dim} />
          <Rect x="0" y="0" width="20" height="10" fill={c} opacity={0.3 * dim} />
        </Pattern>
      );
    case 'dots':
      return (
        <Pattern id={id} patternUnits="userSpaceOnUse" width="28" height="28">
          <Circle cx="7" cy="7" r="2.6" fill={c} opacity={0.6 * dim} />
          <Circle cx="21" cy="21" r="2.6" fill={c} opacity={0.6 * dim} />
        </Pattern>
      );
    case 'planks':
      return (
        <Pattern id={id} patternUnits="userSpaceOnUse" width="64" height="240">
          <Rect x="0" y="0" width="2" height="240" fill={c} opacity="0.22" />
          <Rect x="32" y="0" width="2" height="240" fill={c} opacity="0.22" />
          <Rect x="0" y="90" width="32" height="2" fill={c} opacity="0.18" />
          <Rect x="32" y="190" width="32" height="2" fill={c} opacity="0.18" />
          <Ellipse cx="16" cy="40" rx="4" ry="2.4" fill={c} opacity="0.14" />
          <Ellipse cx="48" cy="130" rx="3" ry="2" fill={c} opacity="0.14" />
          <Rect x="6" y="0" width="1" height="240" fill="#FFFFFF" opacity="0.06" />
          <Rect x="40" y="0" width="1" height="240" fill="#FFFFFF" opacity="0.06" />
        </Pattern>
      );
    default:
      return (
        <Pattern id={id} patternUnits="userSpaceOnUse" width="24" height="24">
          <Rect x="0" y="0" width="10" height="24" fill={c} opacity={room.dark ? 0.04 : 0.18} />
        </Pattern>
      );
  }
}

function Floor({ room, OU, FW, floorU, H }) {
  const id = `floor-${room.key}`;
  const dark = shade(room.floor, -0.1);
  return (
    <G>
      <Defs>
        <Pattern id={id} patternUnits="userSpaceOnUse" width="36" height="36" y={floorU}>
          {room.floorStyle === 'tiles' ? (
            <G>
              <Rect x="0" y="0" width="18" height="18" fill={dark} opacity="0.5" />
              <Rect x="18" y="18" width="18" height="18" fill={dark} opacity="0.5" />
            </G>
          ) : (
            <G>
              <Rect x="0" y="17" width="36" height="1.5" fill="#000" opacity="0.07" />
              <Rect x="0" y="35" width="36" height="1.5" fill="#000" opacity="0.07" />
              <Rect x="10" y="0" width="1.5" height="17" fill="#000" opacity="0.06" />
              <Rect x="28" y="18" width="1.5" height="17" fill="#000" opacity="0.06" />
            </G>
          )}
        </Pattern>
      </Defs>
      <Rect x={-OU} y={floorU} width={FW} height={H - floorU} fill={room.floor} />
      <Rect x={-OU} y={floorU} width={FW} height={H - floorU} fill={`url(#${id})`} />
    </G>
  );
}

// ---------- wall decor (right side) ----------

function Shelf({ floorU, room }) {
  const line = lineFor(room);
  return (
    <G transform={`translate(0 ${floorU - 236})`}>
      <Rect x="222" y="96" width="104" height="7" rx="3" fill={room.dark ? '#5A5F86' : '#C9A889'} stroke={line} strokeOpacity="0.4" strokeWidth="1.2" />
      <Path d="M232 103 L238 112 L244 103" fill="none" stroke={line} strokeOpacity="0.35" strokeWidth="1.4" />
      <Path d="M304 103 L310 112 L316 103" fill="none" stroke={line} strokeOpacity="0.35" strokeWidth="1.4" />
      <Rect x="232" y="68" width="10" height="28" rx="2" fill="#E07A5F" />
      <Rect x="244" y="72" width="9" height="24" rx="2" fill="#81B29A" />
      <Rect x="255" y="64" width="11" height="32" rx="2" fill="#E9B44C" />
      <Rect x="268" y="70" width="8" height="26" rx="2" fill="#7B6FB0" transform="rotate(12 272 96)" />
      <Path d="M296 96 L312 96 L310 84 L298 84 Z" fill="#D98C6A" />
      <Circle cx="304" cy="78" r="7" fill="#81B29A" />
      {/* trailing ivy */}
      <Path d="M300 98 C298 112 304 120 300 134" stroke="#6FA287" strokeWidth="1.6" fill="none" />
      {[[299, 108], [302, 118], [300, 128]].map(([x, y]) => (
        <Ellipse key={y} cx={x + (y % 20 ? 3 : -3)} cy={y} rx="3.2" ry="2" fill="#81B29A" />
      ))}
    </G>
  );
}

function Frames({ floorU, room }) {
  const line = lineFor(room);
  const wood = '#B07D57';
  const y = floorU - 212;
  return (
    <G>
      {/* mountain print */}
      <Line x1="237" y1={y - 10} x2="227" y2={y} stroke={line} strokeOpacity="0.35" strokeWidth="1" />
      <Line x1="237" y1={y - 10} x2="247" y2={y} stroke={line} strokeOpacity="0.35" strokeWidth="1" />
      <Rect x="218" y={y} width="38" height="48" rx="2" fill={wood} stroke={line} strokeOpacity="0.4" strokeWidth="1.2" />
      <Rect x="222" y={y + 4} width="30" height="40" fill="#FFF8EE" />
      <Circle cx="244" cy={y + 13} r="4" fill="#F2A65A" />
      <Path d={`M222 ${y + 44} L232 ${y + 22} L238 ${y + 32} L242 ${y + 26} L252 ${y + 44} Z`} fill="#81B29A" />
      {/* round fish doodle */}
      <Circle cx="282" cy={y + 18} r="16" fill="#FFFFFF" stroke={wood} strokeWidth="3" />
      <Path d={`M273 ${y + 18} Q281 ${y + 10} 289 ${y + 18} Q281 ${y + 26} 273 ${y + 18} Z`} fill="#7FB2E5" />
      <Path d={`M289 ${y + 18} L295 ${y + 13} L295 ${y + 23} Z`} fill="#7FB2E5" />
      <Circle cx="277" cy={y + 17} r="1" fill="#2E2420" />
      {/* little heart */}
      <Rect x="264" y={y + 44} width="30" height="24" rx="2" fill="#E9B44C" stroke={line} strokeOpacity="0.4" strokeWidth="1.2" />
      <Rect x="267" y={y + 47} width="24" height="18" fill="#FFF8EE" />
      <Path d={`M279 ${y + 61} C270 ${y + 55} 273 ${y + 49} 279 ${y + 53} C285 ${y + 49} 288 ${y + 55} 279 ${y + 61} Z`} fill="#E07A5F" />
    </G>
  );
}

// Real wall clock: hour/minute hands follow the time, second hand sweeps
function WallClock({ cx, cy, r, live, dark }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!live) return undefined;
    const id = setInterval(() => setNow(new Date()), 20000);
    return () => clearInterval(id);
  }, [live]);
  const sec = useSharedValue(0);
  useEffect(() => {
    if (!live) return undefined;
    const start = new Date().getSeconds() * 6;
    sec.value = start;
    sec.value = withRepeat(withTiming(start + 360, { duration: 60000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(sec);
  }, [live, sec]);
  const secStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${sec.value}deg` }] }));
  const m = now.getMinutes();
  const hr = (now.getHours() % 12) + m / 60;
  const size = r * 2.6;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: cx - size / 2, top: cy - size / 2, width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 52 52">
        <Circle cx="26" cy="27.5" r="20" fill="#000" opacity="0.08" />
        <Circle cx="26" cy="26" r="20" fill="#E07A5F" stroke={dark ? '#120F24' : '#5B4033'} strokeOpacity="0.45" strokeWidth="1" />
        <Circle cx="26" cy="26" r="16" fill="#FFF8EE" />
        {Array.from({ length: 12 }, (_, i) => (
          <Rect key={i} x="25.3" y="11.5" width="1.4" height={i % 3 ? 2 : 3.2} rx="0.7" fill="#5B4033" transform={`rotate(${i * 30} 26 26)`} />
        ))}
        <Rect x="25" y="17" width="2" height="10" rx="1" fill="#3B2F2A" transform={`rotate(${hr * 30} 26 26)`} />
        <Rect x="25.3" y="13" width="1.4" height="14" rx="0.7" fill="#3B2F2A" transform={`rotate(${m * 6} 26 26)`} />
        {/* cat ears on top */}
        <Path d="M12 12 L13 3 L20 8 Z" fill="#E07A5F" />
        <Path d="M40 12 L39 3 L32 8 Z" fill="#E07A5F" />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, secStyle]}>
        <Svg width={size} height={size} viewBox="0 0 52 52">
          <Rect x="25.6" y="12" width="0.8" height="16" fill="#E07A5F" />
          <Circle cx="26" cy="26" r="1.6" fill="#E07A5F" />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ---------- floor furniture (right of the chair) ----------

function Plant({ x, bottom, s, live }) {
  const t = useLoop(5600, { delay: 500, enabled: live });
  const sway = useAnimatedStyle(() => ({ transform: [{ rotate: `${interpolate(t.value, [0, 1], [-1.6, 1.6])}deg` }] }));
  const w = 60 * s;
  const h = 110 * s;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x - w / 2, top: bottom - h, width: w, height: h }}>
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '50% 68%' }, live && sway]}>
        <Svg width={w} height={h} viewBox="0 0 60 110">
          <G stroke="#3F6B55" strokeOpacity="0.45" strokeWidth="1">
            <Path d="M28 76 C10 50 14 26 30 16 C30 36 32 56 32 76 Z" fill="#6FA287" />
            <Path d="M32 76 C52 54 50 30 36 20 C34 40 32 58 30 76 Z" fill="#81B29A" />
            <Path d="M30 76 C22 46 28 22 32 6 C38 26 36 52 32 76 Z" fill="#5E8F77" />
            <Path d="M26 76 C8 66 4 52 8 44 C16 54 22 62 28 74 Z" fill="#8CC2A6" />
          </G>
          <G stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1" fill="none">
            <Path d="M30 70 C24 52 24 34 30 20" />
            <Path d="M32 70 C40 54 42 38 36 26" />
          </G>
        </Svg>
      </Animated.View>
      <Svg width={w} height={h} viewBox="0 0 60 110" style={StyleSheet.absoluteFill}>
        <Path d="M12 74 L48 74 L43 110 L17 110 Z" fill="#D98C6A" stroke="#5B4033" strokeOpacity="0.4" strokeWidth="1" />
        <Rect x="10" y="72" width="40" height="8" rx="3" fill="#C4775A" stroke="#5B4033" strokeOpacity="0.4" strokeWidth="1" />
        <Path d="M18 90 Q30 96 42 90" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="2" fill="none" />
      </Svg>
    </View>
  );
}

function SideTable({ floorU, room }) {
  const line = lineFor(room);
  const top = floorU - 44;
  return (
    <G stroke={line} strokeOpacity="0.4" strokeWidth="1.2">
      <Ellipse cx="312" cy={floorU + 8} rx="18" ry="4" fill="#000" opacity="0.1" stroke="none" />
      <Rect x="308" y={top + 4} width="8" height="48" fill="#8A5E3E" />
      <Ellipse cx="312" cy={floorU + 6} rx="16" ry="4" fill="#8A5E3E" />
      <Ellipse cx="312" cy={top + 4} rx="36" ry="8" fill="#8A5E3E" />
      <Ellipse cx="312" cy={top} rx="36" ry="8" fill="#B07D57" />
      {/* plate + toast */}
      <Ellipse cx="324" cy={top - 2} rx="13" ry="3.4" fill="#FFFFFF" />
      <Path d={`M316 ${top - 3} L316 ${top - 13} Q316 ${top - 18} 322 ${top - 18} Q328 ${top - 18} 328 ${top - 13} L328 ${top - 3} Z`} fill="#E9B872" />
      <Path d={`M318 ${top - 4} L318 ${top - 12} Q318 ${top - 15.5} 322 ${top - 15.5} Q326 ${top - 15.5} 326 ${top - 12} L326 ${top - 4} Z`} fill="#FCE7C2" stroke="none" />
      {/* mug */}
      <Path d={`M303 ${top - 14} Q309 ${top - 14} 309 ${top - 9} Q309 ${top - 5} 303 ${top - 6}`} fill="none" stroke="#FFFFFF" strokeOpacity="1" strokeWidth="2.6" />
      <Rect x="288" y={top - 18} width="15" height="16" rx="3" fill="#FFFFFF" />
      <Rect x="288" y={top - 13} width="15" height="4" fill="#E07A5F" stroke="none" />
    </G>
  );
}

function Steam({ x, y, s, live }) {
  const a = useLoop(2600, { reverse: false, easing: Easing.linear, enabled: live });
  const b = useLoop(2600, { delay: 1300, reverse: false, easing: Easing.linear, enabled: live });
  const mk = (t) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => ({ opacity: Math.sin(t.value * Math.PI) * 0.75, transform: [{ translateY: -t.value * 12 * s }] }));
  const sa = mk(a);
  const sb = mk(b);
  if (!live) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x - 8 * s, top: y - 22 * s, width: 16 * s, height: 22 * s }}>
      {[sa, sb].map((st, i) => (
        <Animated.View key={i} style={[StyleSheet.absoluteFill, st]}>
          <Svg width={16 * s} height={22 * s} viewBox="0 0 16 22">
            <Path d={i ? 'M10 20 C6 15 13 11 9 5' : 'M6 20 C10 15 3 11 7 5'} stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}

function Bookcase({ floorU, room }) {
  const line = lineFor(room);
  const top = floorU - 132;
  const books = [
    ['#E07A5F', 10, 22], ['#81B29A', 8, 20], ['#E9B44C', 11, 24], ['#7B6FB0', 9, 18], ['#F2C6A0', 8, 22],
    ['#8FA3B8', 10, 24], ['#E8A598', 9, 19], ['#81B29A', 11, 23],
  ];
  const row = (y, offset) => {
    let x = 276;
    return books.slice(offset, offset + 5).map(([c, w, h], i) => {
      const el = <Rect key={`${y}-${i}`} x={x} y={y - h} width={w} height={h} rx="1.5" fill={c} />;
      x += w + 1.5;
      return el;
    });
  };
  return (
    <G>
      <G stroke={line} strokeOpacity="0.4" strokeWidth="1.2">
        <Rect x="268" y={top} width="80" height={floorU + 6 - top} rx="3" fill="#A87553" />
        <Rect x="274" y={top + 6} width="68" height={floorU - top - 6} fill="#7A5240" />
      </G>
      {row(top + 42, 0)}
      {row(top + 84, 3)}
      <Rect x="274" y={top + 42} width="68" height="5" fill="#A87553" />
      <Rect x="274" y={top + 84} width="68" height="5" fill="#A87553" />
      {/* basket on the bottom shelf */}
      <Rect x="300" y={top + 106} width="34" height="18" rx="4" fill="#D9B38C" />
      <Path d={`M302 ${top + 112} H332 M302 ${top + 118} H332`} stroke="#B8926B" strokeWidth="1.4" />
      {/* succulent on top */}
      <Path d={`M286 ${top} L298 ${top} L296 ${top - 10} L288 ${top - 10} Z`} fill="#E9D7C2" />
      <Ellipse cx="292" cy={top - 12} rx="8" ry="4" fill="#81B29A" />
      <Ellipse cx="292" cy={top - 15} rx="4" ry="4" fill="#6FA287" />
    </G>
  );
}

function Fireplace({ floorU, room }) {
  const line = lineFor(room);
  const top = floorU - 116;
  const bricks = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 6; c++) {
      const x = 266 + c * 16 + (r % 2 ? 8 : 0);
      const y = top + 12 + r * 14;
      if (x < 360) bricks.push(<Rect key={`${r}-${c}`} x={x} y={y} width="14" height="12" rx="2" fill={(r + c) % 3 ? '#B8695A' : '#A65C4F'} />);
    }
  }
  return (
    <G>
      <Rect x="262" y={top} width="100" height={floorU + 6 - top} fill="#C9776A" stroke={line} strokeOpacity="0.45" strokeWidth="1.4" />
      {bricks}
      {/* firebox */}
      <Path d={`M284 ${floorU + 6} L284 ${floorU - 56} Q311 ${floorU - 80} 338 ${floorU - 56} L338 ${floorU + 6} Z`} fill="#2B1B17" stroke={line} strokeOpacity="0.6" strokeWidth="1.4" />
      <Rect x="290" y={floorU - 6} width="42" height="7" rx="3.5" fill="#6B4130" transform={`rotate(-8 311 ${floorU - 3})`} />
      <Rect x="290" y={floorU - 4} width="42" height="7" rx="3.5" fill="#7A4E36" transform={`rotate(8 311 ${floorU})`} />
      {/* mantel */}
      <Rect x="254" y={top - 8} width="112" height="10" rx="2" fill="#5A3A2A" stroke={line} strokeOpacity="0.5" strokeWidth="1.2" />
      {/* candles + a little stocking */}
      <Rect x="268" y={top - 26} width="6" height="18" rx="1" fill="#FFF4E0" />
      <Rect x="278" y={top - 20} width="6" height="12" rx="1" fill="#FFF4E0" />
      <Ellipse cx="271" cy={top - 30} rx="2.2" ry="3.6" fill="#FFD166" />
      <Ellipse cx="281" cy={top - 24} rx="2.2" ry="3.6" fill="#FFD166" />
      <Path d={`M336 ${top + 2} L336 ${top + 22} Q336 ${top + 28} 342 ${top + 28} L350 ${top + 28} Q354 ${top + 24} 348 ${top + 20} L344 ${top + 20} L344 ${top + 2} Z`} fill="#B8453A" />
      <Rect x="335" y={top + 2} width="10" height="5" fill="#FFFFFF" />
      <Path d={`M296 ${top - 8} L304 ${top - 24} L312 ${top - 8} Z`} fill="#2F5D50" />
      <Path d={`M306 ${top - 8} L313 ${top - 20} L320 ${top - 8} Z`} fill="#3D7363" />
    </G>
  );
}

function Fire({ x, y, w, h, live }) {
  const a = useLoop(360, { enabled: live });
  const b = useLoop(480, { delay: 140, enabled: live });
  const outer = useAnimatedStyle(() => ({ transform: [{ scaleY: 0.86 + a.value * 0.2 }, { scaleX: 1.04 - a.value * 0.08 }] }));
  const inner = useAnimatedStyle(() => ({ transform: [{ scaleY: 0.78 + b.value * 0.28 }, { translateX: (b.value - 0.5) * 2 }] }));
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '50% 100%' }, live && outer]}>
        <Svg width={w} height={h} viewBox="0 0 50 46">
          <Path d="M6 44 C2 30 10 22 12 12 C16 22 18 24 20 16 C22 8 26 4 25 0 C34 10 36 20 34 26 C38 22 40 18 40 12 C46 22 48 32 44 44 Z" fill="#F28A3C" />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '50% 100%' }, live && inner]}>
        <Svg width={w} height={h} viewBox="0 0 50 46">
          <Path d="M14 44 C12 34 16 28 18 22 C20 28 22 28 24 22 C26 16 28 14 28 10 C34 20 36 28 34 34 C36 32 37 30 38 28 C40 34 38 40 36 44 Z" fill="#FFD166" />
          <Path d="M20 44 C19 38 22 34 24 30 C26 34 28 36 30 34 C31 38 30 42 29 44 Z" fill="#FFF3C4" />
        </Svg>
      </Animated.View>
    </View>
  );
}

// Warm light from the fire that breathes unevenly, plus embers drifting up the chimney
function FireGlow({ cx, cy, r, live }) {
  const a = useLoop(420, { enabled: live });
  const b = useLoop(1300, { delay: 200, enabled: live });
  const style = useAnimatedStyle(() => ({ opacity: 0.6 + a.value * 0.15 + b.value * 0.25 }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2 }, live ? style : { opacity: 0.8 }]}>
      <Svg width={r * 2} height={r * 2}>
        <Defs>
          <RadialGradient id="fireGlowLive" cx={r} cy={r} r={r} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFB46B" stopOpacity="0.5" />
            <Stop offset="1" stopColor="#FFB46B" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={r} cy={r} r={r} fill="url(#fireGlowLive)" />
      </Svg>
    </Animated.View>
  );
}

function Ember({ x, y, s, delay, live }) {
  const t = useCrossing(live, { delay, travel: 1600, pause: 900, easing: Easing.out(Easing.quad) });
  const style = useAnimatedStyle(() => ({
    opacity: t.value > 0.001 && t.value < 0.999 ? 1 - t.value : 0,
    transform: [{ translateY: -t.value * 30 * s }, { translateX: Math.sin(t.value * 8) * 3 * s }],
  }));
  if (!live) return null;
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x, top: y, width: 2.4 * s, height: 2.4 * s, borderRadius: 2 * s, backgroundColor: '#FFC66B' }, style]} />;
}

// ---------- garlands draped from the curtain rod ----------

function sag(x1, x2, y, depth, t) {
  const x = x1 + (x2 - x1) * t;
  return { x, y: y + 4 * depth * t * (1 - t) };
}

function Bulb({ x, y, r, color, delay, live }) {
  const t = useLoop(1100 + (delay % 700), { delay, enabled: live });
  const style = useAnimatedStyle(() => ({ opacity: 0.55 + t.value * 0.45 }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x - r * 2, top: y - r * 2, width: r * 4, height: r * 4, alignItems: 'center', justifyContent: 'center' }, live && style]}>
      <View style={{ position: 'absolute', width: r * 4, height: r * 4, borderRadius: r * 2, backgroundColor: color, opacity: 0.25 }} />
      <View style={{ width: r * 1.6, height: r * 2.2, borderRadius: r, backgroundColor: color }} />
    </Animated.View>
  );
}

function Garland({ room, ox, s, rodY, live }) {
  const x1 = WIN.x - WIN.padX + 4;
  const x2 = WIN.x + WIN.w + WIN.padX - 4;
  const mid = (x1 + x2) / 2;
  const spans = [
    [x1, mid, 16],
    [mid, x2, 16],
  ];
  const path = spans.map(([a, b, d]) => `M${a} ${rodY} Q${(a + b) / 2} ${rodY + d * 2} ${b} ${rodY}`).join(' ');
  const BULBS = ['#FFD97A', '#F7A8B8', '#9FE0C8', '#FFFFFF'];
  const FLAGS = ['#E07A5F', '#F2C6A0', '#81B29A', '#E9B44C', '#F4A9B8'];
  const points = [];
  spans.forEach(([a, b, d], si) => [0.12, 0.3, 0.5, 0.7, 0.88].forEach((t, i) => points.push({ ...sag(a, b, rodY, d, t), i: si * 5 + i })));
  const minX = x1 - 6;
  const VW = x2 - x1 + 12;
  const VH = 50;
  return (
    <>
      <Svg pointerEvents="none" width={VW * s} height={VH * s} viewBox={`${minX} ${rodY - 4} ${VW} ${VH}`} style={{ position: 'absolute', left: ox + minX * s, top: (rodY - 4) * s }}>
        <Path d={path} stroke={room.dark ? '#5A4E3A' : '#8A6A50'} strokeWidth="1" fill="none" />
        {room.bunting &&
          points.map((p) => {
            const c = FLAGS[p.i % FLAGS.length];
            return <Path key={p.i} d={`M${p.x - 5} ${p.y - 0.5} L${p.x + 5} ${p.y - 0.5} L${p.x} ${p.y + 11} Z`} fill={c} />;
          })}
      </Svg>
      {room.lights &&
        points.map((p) => <Bulb key={p.i} x={ox + p.x * s} y={(p.y + 3) * s} r={2.4 * s} color={BULBS[p.i % BULBS.length]} delay={p.i * 260} live={live} />)}
    </>
  );
}

// ---------- ambient props ----------

function Lamp({ x, cordLen, s, glow, live }) {
  const t = useLoop(5200, { enabled: live });
  const swing = useAnimatedStyle(() => ({ transform: [{ rotate: `${interpolate(t.value, [0, 1], [-1.1, 1.1])}deg` }] }));
  const w = 70 * s;
  const h = cordLen + 60 * s;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x - w / 2, top: 0, width: w, height: h, transformOrigin: '50% 0%' }, live && swing]}>
      <Svg width={w} height={h}>
        <Line x1={w / 2} y1={0} x2={w / 2} y2={cordLen} stroke="#5B4636" strokeWidth={2 * s} />
        <Path
          d={`M${w / 2 - 12 * s} ${cordLen} L${w / 2 + 12 * s} ${cordLen} L${w / 2 + 30 * s} ${cordLen + 30 * s} L${w / 2 - 30 * s} ${cordLen + 30 * s} Z`}
          fill="#E9B44C"
          stroke="#8A5E3E"
          strokeOpacity={0.5}
          strokeWidth={1.2 * s}
          strokeLinejoin="round"
        />
        <Path d={`M${w / 2 - 6 * s} ${cordLen + 4 * s} L${w / 2 - 16 * s} ${cordLen + 26 * s}`} stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={2 * s} strokeLinecap="round" />
        <Rect x={w / 2 - 30 * s} y={cordLen + 27 * s} width={60 * s} height={5 * s} rx={2 * s} fill="#C9962F" />
        <Circle cx={w / 2} cy={cordLen + 34 * s} r={7 * s} fill={glow > 0.05 ? '#FFF6C8' : '#FFF9E8'} />
      </Svg>
    </Animated.View>
  );
}

function Mote({ x0, y0, span, delay, s, live }) {
  const t = useLoop(7000 + delay, { delay, enabled: live });
  const style = useAnimatedStyle(() => ({
    opacity: 0.15 + Math.sin(t.value * Math.PI) * 0.55,
    transform: [{ translateX: t.value * span * 0.4 }, { translateY: -t.value * span }],
  }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x0, top: y0, width: 3 * s, height: 3 * s, borderRadius: 3 * s, backgroundColor: '#FFFFFF' }, style]} />;
}

function YarnBall({ x, y, s }) {
  const t = useLoop(1600);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(t.value, [0, 1], [-16 * s, 16 * s]) }, { rotate: `${interpolate(t.value, [0, 1], [-160, 160])}deg` }],
  }));
  const r = 11 * s;
  return (
    <Animated.View entering={FadeIn.delay(600)} exiting={FadeOut} style={[{ position: 'absolute', left: x - r, top: y - r * 2 }, style]}>
      <Svg width={r * 2} height={r * 2} viewBox="0 0 22 22">
        <Circle cx="11" cy="11" r="10" fill="#E07A9A" stroke="#A8456A" strokeWidth="1" />
        <Path d="M3 8 Q11 12 19 6 M2 13 Q11 17 20 11 M7 3 Q9 11 6 19 M14 2 Q16 11 13 20" stroke="#C45A7C" strokeWidth="1.4" fill="none" />
      </Svg>
    </Animated.View>
  );
}

function RainCloud({ width }) {
  const t = useLoop(500, { reverse: false, easing: Easing.linear });
  const bob = useLoop(1400);
  const cloud = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value * 4 }] }));
  const dropStyle = (o) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => ({ opacity: 1 - ((t.value + o) % 1), transform: [{ translateY: ((t.value + o) % 1) * width * 0.35 }] }));
  const d1 = dropStyle(0);
  const d2 = dropStyle(0.33);
  const d3 = dropStyle(0.66);
  const w = width * 0.6;
  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(600)} style={[{ position: 'absolute', left: (width - w) / 2, top: -width * 0.02, width: w }, cloud]}>
      <Svg width={w} height={w * 0.42} viewBox="0 0 100 42">
        <Ellipse cx="34" cy="26" rx="24" ry="14" fill="#A7B0BE" />
        <Ellipse cx="58" cy="18" rx="22" ry="16" fill="#B8C0CC" />
        <Ellipse cx="76" cy="27" rx="18" ry="12" fill="#A7B0BE" />
      </Svg>
      {[d1, d2, d3].map((st, i) => (
        <Animated.View key={i} style={[styles.sadDrop, { left: w * (0.3 + i * 0.2), top: w * 0.36 }, st]} />
      ))}
    </Animated.View>
  );
}

// ---------- chair art (seat top at y=300) ----------

function Chair({ chair }) {
  const { color, accent } = chair;
  const outline = { stroke: shade(accent, -0.4), strokeWidth: 2.2, strokeLinejoin: 'round', strokeOpacity: 0.7 };
  const plaidId = `plaid-${chair.key}`;
  switch (chair.kind) {
    case 'armchair':
      return (
        <G>
          {chair.plaid && (
            <Defs>
              <Pattern id={plaidId} patternUnits="userSpaceOnUse" width="26" height="26">
                <Rect x="0" y="9" width="26" height="6" fill={chair.plaid} opacity="0.45" />
                <Rect x="9" y="0" width="6" height="26" fill={chair.plaid} opacity="0.45" />
                <Rect x="0" y="21" width="26" height="1.5" fill="#2E2420" opacity="0.25" />
                <Rect x="21" y="0" width="1.5" height="26" fill="#2E2420" opacity="0.25" />
              </Pattern>
            </Defs>
          )}
          <Rect x="102" y="176" width="156" height="150" rx="44" fill={color} {...outline} />
          {chair.plaid && <Rect x="102" y="176" width="156" height="150" rx="44" fill={`url(#${plaidId})`} />}
          <Path d="M130 190 Q180 176 230 190" stroke={shade(accent, -0.1)} strokeWidth="4" fill="none" opacity="0.35" />
          {/* buttons on the backrest */}
          <G fill={shade(accent, -0.15)} opacity="0.6">
            <Circle cx="150" cy="226" r="2.6" />
            <Circle cx="180" cy="220" r="2.6" />
            <Circle cx="210" cy="226" r="2.6" />
          </G>
          <Rect x="84" y="250" width="40" height="92" rx="18" fill={accent} {...outline} />
          <Rect x="236" y="250" width="40" height="92" rx="18" fill={accent} {...outline} />
          <Rect x="112" y="296" width="136" height="44" rx="16" fill={accent} {...outline} />
          {chair.plaid && <Rect x="112" y="296" width="136" height="44" rx="16" fill={`url(#${plaidId})`} />}
          <Rect x="100" y="336" width="10" height="24" rx="4" fill="#7A5A44" />
          <Rect x="250" y="336" width="10" height="24" rx="4" fill="#7A5A44" />
        </G>
      );
    case 'beanbag':
      return (
        <G>
          <Ellipse cx="180" cy="262" rx="88" ry="68" fill={accent} {...outline} />
          <Ellipse cx="180" cy="330" rx="112" ry="40" fill={color} {...outline} />
          <Path d="M110 318 Q180 340 250 318" stroke={accent} strokeWidth="3" fill="none" opacity="0.6" />
          <Path d="M130 236 Q150 226 170 232" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="5" strokeLinecap="round" fill="none" />
        </G>
      );
    case 'stool':
      return (
        <G>
          <Rect x="132" y="310" width="8" height="54" rx="3" fill={accent} transform="rotate(8 136 310)" {...outline} />
          <Rect x="220" y="310" width="8" height="54" rx="3" fill={accent} transform="rotate(-8 224 310)" {...outline} />
          <Rect x="176" y="312" width="8" height="50" rx="3" fill={accent} {...outline} />
          <Rect x="118" y="304" width="124" height="16" rx="8" fill={accent} {...outline} />
          <Ellipse cx="180" cy="304" rx="64" ry="12" fill={color} {...outline} />
        </G>
      );
    case 'bench':
      return (
        <G>
          <G fill="none" stroke={accent} strokeWidth="6" strokeLinecap="round">
            <Path d="M80 210 L80 362" />
            <Path d="M280 210 L280 362" />
            <Path d="M80 270 C64 270 62 290 76 292" />
            <Path d="M280 270 C296 270 298 290 284 292" />
          </G>
          {[214, 236, 258].map((y) => (
            <Rect key={y} x="72" y={y} width="216" height="16" rx="4" fill={y === 236 ? shade(color, 0.08) : color} {...outline} />
          ))}
          <Rect x="68" y="298" width="224" height="12" rx="4" fill={color} {...outline} />
          <Rect x="72" y="310" width="216" height="10" rx="4" fill={shade(color, -0.12)} {...outline} />
          <G fill={accent}>
            <Circle cx="80" cy="210" r="5" />
            <Circle cx="280" cy="210" r="5" />
          </G>
        </G>
      );
    default:
      return (
        <G>
          <Rect x="116" y="196" width="10" height="170" rx="4" fill={accent} {...outline} />
          <Rect x="234" y="196" width="10" height="170" rx="4" fill={accent} {...outline} />
          <Rect x="116" y="206" width="128" height="14" rx="6" fill={color} {...outline} />
          <Rect x="116" y="236" width="128" height="10" rx="5" fill={color} {...outline} />
          <Rect x="120" y="314" width="9" height="52" rx="3" fill={accent} {...outline} />
          <Rect x="231" y="314" width="9" height="52" rx="3" fill={accent} {...outline} />
          <Rect x="108" y="300" width="144" height="16" rx="6" fill={color} {...outline} />
          {/* seat cushion */}
          <Rect x="124" y="290" width="112" height="13" rx="6.5" fill="#F2C6A0" stroke="#B8926B" strokeOpacity="0.7" strokeWidth="1.6" />
          <Path d="M146 296 L150 296 M178 296 L182 296 M210 296 L214 296" stroke="#B8926B" strokeWidth="1.6" strokeLinecap="round" />
        </G>
      );
  }
}

function Rug({ room }) {
  const base = room.rug || '#FFFFFF';
  const ring = shade(base, room.dark ? 0.2 : -0.12);
  return (
    <G>
      <Ellipse cx="180" cy="358" rx="142" ry="33" fill="#000" opacity="0.08" />
      <Ellipse cx="180" cy="356" rx="140" ry="32" fill={base} opacity={room.dark ? 0.85 : 0.9} />
      <Ellipse cx="180" cy="356" rx="120" ry="24" fill="none" stroke={ring} strokeWidth="4" />
      <Ellipse cx="180" cy="356" rx="104" ry="18" fill="none" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="4 6" />
      <Ellipse cx="180" cy="356" rx="140" ry="32" fill="none" stroke={ring} strokeOpacity="0.6" strokeWidth="1.4" />
    </G>
  );
}

// ---------- the scene ----------

/**
 * Full room with the companion. Sizes are in dp; `seatY` is where the chair seat sits.
 * live=false renders a still picture (used for shop previews).
 */
export default function Scene({
  width,
  height,
  seatY,
  room,
  chair,
  animal,
  mood = 'idle',
  spot = 'chair',
  dim = 0,
  raining = false,
  pokeKey = 0,
  onPet,
  onMove,
  wander = true,
  live = true,
  children,
}) {
  const L = sceneLayout(width, seatY, height);
  const { s, ox, floorU } = L;
  const H = height / s;
  const OU = ox / s; // horizontal overflow in design units on each side
  const FW = DW + OU * 2;
  const dark = !!room.dark;

  // ---------- where the critter is, and how it gets there ----------
  // Positions are anchors (bottom-centre of the critter box, plus scale relative to the chair size).
  // A move eases `k` from 0 to 1 between the `f*` and `t*` anchors, arcing up by `arcH` for jumps.
  const a = L.chairSpot;
  const anchorOf = (name) => {
    const r = L.spots[name] || a;
    return { x: r.left + r.width / 2, y: r.top + r.height, sc: r.width / a.width };
  };
  const home = spot === 'rug' ? 'rug' : 'chair';
  const start = anchorOf(home);
  const fx = useSharedValue(start.x);
  const fy = useSharedValue(start.y);
  const fs = useSharedValue(start.sc);
  const tx = useSharedValue(start.x);
  const ty = useSharedValue(start.y);
  const ts = useSharedValue(start.sc);
  const k = useSharedValue(0);
  const arcH = useSharedValue(0);
  const facing = useSharedValue(1); // -1 mirrors the critter so its tail trails behind when walking right
  const where = useRef(home);
  const [walking, setWalking] = useState(false);
  const [jump, setJump] = useState({ key: 0, ms: 850 });

  // Returns how long the move takes (ms)
  const travel = (name, how, ms = 850) => {
    const kk = k.value;
    const cx = fx.value + (tx.value - fx.value) * kk;
    const cy = fy.value + (ty.value - fy.value) * kk;
    const cs = fs.value + (ts.value - fs.value) * kk;
    const t = anchorOf(name);
    fx.value = cx;
    fy.value = cy;
    fs.value = cs;
    tx.value = t.x;
    ty.value = t.y;
    ts.value = t.sc;
    k.value = 0;
    where.current = name;
    onMove?.(name);
    if (how === 'walk') {
      const dur = Math.max(450, (Math.hypot(t.x - cx, t.y - cy) / (WALK_SPEED * s)) * 1000);
      arcH.value = 0;
      facing.value = withTiming(t.x > cx ? -1 : 1, { duration: 180 });
      k.value = withTiming(1, { duration: dur, easing: Easing.linear });
      return dur;
    }
    // jump: arc higher when leaping up onto something
    arcH.value = a.height * 0.3 + Math.max(0, cy - t.y) * 0.35;
    setJump((j) => ({ key: j.key + 1, ms }));
    // wait for the crouch before leaving the ground
    k.value = withDelay(140, withTiming(1, { duration: ms, easing: Easing.inOut(Easing.quad) }));
    return ms + 140;
  };
  const travelRef = useRef(travel);
  travelRef.current = travel;

  // Focus / break decide where the critter has to be
  useEffect(() => {
    if (where.current === home) return;
    setWalking(false);
    facing.value = withTiming(1, { duration: 180 });
    travelRef.current(home, 'jump');
  }, [home, facing]);

  // Snap into place if the layout changes (rotation, resize)
  useEffect(() => {
    const t = anchorOf(where.current);
    fx.value = t.x;
    fy.value = t.y;
    fs.value = t.sc;
    tx.value = t.x;
    ty.value = t.y;
    ts.value = t.sc;
    k.value = 0;
    arcH.value = 0;
  }, [a.left, a.top, a.width]); // eslint-disable-line react-hooks/exhaustive-deps

  // When nothing is going on, the critter gets down and potters around the room now and then
  const canWander = live && wander && mood === 'idle' && spot === 'chair' && !raining;
  useEffect(() => {
    if (!canWander) return undefined;
    const ids = [];
    const later = (fn, ms) => ids.push(setTimeout(fn, ms));
    const go = travelRef;
    const hopTo = (name, ms = 720) => () => {
      setWalking(false);
      return go.current(name, 'jump', ms) + 380;
    };
    const walkTo = (name) => () => {
      setWalking(true);
      return go.current(name, 'walk');
    };
    const sit = (min, max) => () => {
      setWalking(false);
      facing.value = withTiming(1, { duration: 220 });
      return rand(min, max);
    };
    const back = [walkTo('floorMid'), sit(250, 450), hopTo('chair'), sit(0, 0)];
    const trips = [
      // stroll to the rug and back
      [hopTo('floorMid'), walkTo('floorLeft'), sit(2500, 4500), ...back],
      // wander over to the plant side
      [hopTo('floorMid'), walkTo('floorRight'), sit(2500, 4500), ...back],
      // climb onto the windowsill to watch outside for a while
      [hopTo('floorMid'), walkTo('floorLeft'), sit(400, 700), hopTo('sill', 900), sit(5000, 8000), hopTo('floorLeft', 800), sit(300, 500), ...back],
    ];
    const run = (steps, done) => {
      let i = 0;
      const next = () => {
        if (i >= steps.length) done();
        else later(next, steps[i++]());
      };
      next();
    };
    const schedule = () => later(() => run(trips[Math.floor(Math.random() * trips.length)], schedule), rand(8000, 16000));
    schedule();
    return () => {
      ids.forEach(clearTimeout);
      setWalking(false);
      facing.value = withTiming(1, { duration: 200 });
      // something started (focus, a gift…): hurry back to the chair
      if (where.current !== 'chair') go.current('chair', 'jump');
    };
  }, [canWander, facing]);

  const moveStyle = useAnimatedStyle(() => {
    const kk = k.value;
    const x = fx.value + (tx.value - fx.value) * kk;
    const y = fy.value + (ty.value - fy.value) * kk - Math.sin(kk * Math.PI) * arcH.value;
    const sc = fs.value + (ts.value - fs.value) * kk;
    return {
      transform: [
        { translateX: x - (a.left + a.width / 2) },
        { translateY: y - (a.top + a.height) + (a.height * (1 - sc)) / 2 },
        { scaleX: sc * facing.value },
        { scaleY: sc },
      ],
    };
  });
  const critterMood = walking ? 'walk' : spot === 'rug' && mood === 'idle' ? 'play' : mood;

  const dimV = useSharedValue(dim);
  useEffect(() => {
    dimV.value = withTiming(dim, { duration: 1200 });
  }, [dim, dimV]);
  const dimStyle = useAnimatedStyle(() => ({ opacity: dimV.value * 0.42 }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: dimV.value }));

  const winX = ox + WIN.x * s;
  const winY = (floorU - 196) * s;
  const rodY = floorU - 196 - WIN.padTop + 10;
  const lampX = ox + 332 * s;
  const lampCord = Math.max(40 * s, (floorU - 214) * s);

  const motes = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        x0: winX + Math.random() * WIN.w * s,
        y0: winY + (WIN.h + 30 + Math.random() * 120) * s,
        span: (30 + Math.random() * 50) * s,
        delay: i * 700,
      })),
    [winX, winY, s]
  );

  const beam = room.time === 'day' || room.time === 'sunset';
  const wallId = `wall-${room.key}`;
  const right = room.right || 'plant';
  const decor = room.decor || 'shelf';
  const fireplace = right === 'fireplace';

  return (
    <View style={{ width, height, overflow: 'hidden', backgroundColor: room.wall }}>
      <Svg width={width} height={height} viewBox={`${-OU} 0 ${FW} ${H}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <WallPattern room={room} id={wallId} />
          <LinearGradient id={`wallShade-${room.key}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000" stopOpacity={dark ? 0.28 : 0.07} />
            <Stop offset="1" stopColor="#000" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id={`beam-${room.key}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={room.time === 'sunset' ? '#FFE0B8' : '#FFFFFF'} stopOpacity="0.32" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id={`floorShade-${room.key}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000" stopOpacity="0.14" />
            <Stop offset="1" stopColor="#000" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {/* wallpaper */}
        <Rect x={-OU} y={0} width={FW} height={floorU} fill={`url(#${wallId})`} />
        <Rect x={-OU} y={0} width={FW} height={floorU * 0.5} fill={`url(#wallShade-${room.key})`} />
        {/* wainscot */}
        {room.wallpaper !== 'planks' && (
          <G>
            <Rect x={-OU} y={floorU - 64} width={FW} height={64} fill={room.wall} />
            <Rect x={-OU} y={floorU - 64} width={FW} height={64} fill="#000" opacity={0.05} />
            <Rect x={-OU} y={floorU - 67} width={FW} height={6} fill="#FFFFFF" opacity={dark ? 0.12 : 0.6} />
            {Array.from({ length: Math.ceil(FW / 60) + 1 }, (_, i) => (
              <Rect key={i} x={-OU + 10 + i * 60} y={floorU - 52} width={44} height={40} rx={4} fill="none" stroke="#000" strokeOpacity={0.07} strokeWidth={2} />
            ))}
          </G>
        )}
        {decor === 'shelf' && <Shelf floorU={floorU} room={room} />}
        {decor === 'frames' && <Frames floorU={floorU} room={room} />}
        {/* floor */}
        <Floor room={room} OU={OU} FW={FW} floorU={floorU} H={H} />
        <Rect x={-OU} y={floorU} width={FW} height={30} fill={`url(#floorShade-${room.key})`} />
        <Rect x={-OU} y={floorU - 6} width={FW} height={8} fill={dark ? '#000' : '#FFFFFF'} opacity={dark ? 0.2 : 0.55} />
        {beam && <Path d={`M46 ${floorU - 88} L170 ${floorU - 88} L240 ${floorU + 90} L66 ${floorU + 90} Z`} fill={`url(#beam-${room.key})`} />}
        {right === 'table' && <SideTable floorU={floorU} room={room} />}
        {right === 'bookcase' && <Bookcase floorU={floorU} room={room} />}
        {fireplace && <Fireplace floorU={floorU} room={room} />}
        {/* rug + chair */}
        <G transform={`translate(0 ${L.seatU - SEAT})`}>
          <Rug room={room} />
          <Chair chair={chair} />
        </G>
      </Svg>

      {fireplace && <FireGlow cx={ox + 311 * s} cy={floorU * s} r={150 * s} live={live} />}
      {fireplace && <Fire x={ox + 286 * s} y={(floorU - 46) * s} w={50 * s} h={46 * s} live={live} />}
      {fireplace && [300, 312, 322].map((ex, i) => <Ember key={ex} x={ox + ex * s} y={(floorU - 40) * s} s={s} delay={i * 800} live={live} />)}
      {right === 'table' && <Steam x={ox + 295 * s} y={(floorU - 62) * s} s={s} live={live} />}
      <SkyWindow room={room} x={winX} y={winY} s={s} live={live} />
      {(room.lights || room.bunting) && <Garland room={room} ox={ox} s={s} rodY={rodY} live={live} />}
      {decor === 'clock' && <WallClock cx={ox + 268 * s} cy={(floorU - 192) * s} r={20 * s} live={live} dark={dark} />}
      {right === 'plant' && <Plant x={ox + 318 * s} bottom={(floorU + 8) * s} s={s} live={live} />}
      {beam && live && motes.map((m, i) => <Mote key={i} {...m} s={s} live={live} />)}

      {/* soft vignette keeps the eye on the chair */}
      <Svg pointerEvents="none" width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id={`vig-${room.key}`} cx="50%" cy="55%" r="75%">
            <Stop offset="0.55" stopColor="#3B2A1E" stopOpacity="0" />
            <Stop offset="1" stopColor={dark ? '#05040F' : '#3B2A1E'} stopOpacity={dark ? 0.4 : 0.18} />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill={`url(#vig-${room.key})`} />
      </Svg>

      {/* evening dim for focus mode, with the lamp lighting the chair */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#1E1638' }, dimStyle]} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, glowStyle]}>
        <Svg width={width} height={height}>
          <Defs>
            <RadialGradient id="lampGlow" cx={ox + 240 * s} cy={(floorU - 120) * s} r={230 * s} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#FFE9A8" stopOpacity="0.55" />
              <Stop offset="1" stopColor="#FFE9A8" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={ox + 240 * s} cy={(floorU - 120) * s} r={230 * s} fill="url(#lampGlow)" />
        </Svg>
      </Animated.View>
      <Lamp x={lampX} cordLen={lampCord} s={s} glow={dim} live={live} />

      {spot === 'rug' && live && <YarnBall x={ox + 170 * s} y={(L.seatU + 66) * s} s={s} />}

      <Animated.View style={[{ position: 'absolute', left: a.left, top: a.top, width: a.width, height: a.height }, moveStyle]}>
        <Pressable onPress={onPet} disabled={!onPet} style={StyleSheet.absoluteFill}>
          <Critter animal={animal} mood={critterMood} size={a.width} animated={live} pokeKey={pokeKey} jumpKey={jump.key} jumpMs={jump.ms} />
        </Pressable>
        {raining && <RainCloud width={a.width} />}
      </Animated.View>

      {children}
    </View>
  );
}

export function RoomPreview({ width, room, chair, animal, radius = 16 }) {
  const height = (width * 400) / 360;
  return (
    <View style={{ width, height, borderRadius: radius, overflow: 'hidden' }}>
      <Scene width={width} height={height} seatY={(width / DW) * SEAT} room={room} chair={chair} animal={animal} live={false} />
    </View>
  );
}

export function Bubble({ text, style }) {
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={[styles.bubble, style]}>
      <Text style={styles.bubbleText}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  drop: { position: 'absolute', top: 0, width: 1.6, height: 10, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.8)' },
  sadDrop: { position: 'absolute', width: 3, height: 8, borderRadius: 2, backgroundColor: '#7FB2E5' },
  bubble: { position: 'absolute', backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  bubbleText: { fontSize: 13, color: '#3B2F2A' },
});
