import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon from './Icon';
import { FONT_BOLD } from '../theme';
import { shade } from '../utils/color';

// All artwork lives in a 200x220 box; the critter sits with its feet near y=204.
export const CRITTER_VB = { w: 200, h: 220 };
const VB = `0 0 ${CRITTER_VB.w} ${CRITTER_VB.h}`;
const INK = '#2E2420';
const LIGHT_INK = '#F3E9DD';
const BLUSH = '#F4978E';
const MIRROR = 'translate(200,0) scale(-1,1)';
const LINE_W = 2.4;
const NO_LOOK = { x: 0, y: 0 };

// Cats get a rounder head with little cheek tufts instead of a plain circle
const CAT_HEAD =
  'M100 38 C130 38 150 58 150 84 C150 92 153 98 156 104 C152 105 150 107 150 110 C152 112 151 114 148 115 ' +
  'C140 131 122 140 100 140 C78 140 60 131 52 115 C49 114 48 112 50 110 C50 107 48 105 44 104 C47 98 50 92 50 84 C50 58 70 38 100 38 Z';

const isCat = (a) => a.species === 'Cat';
// Hand-drawn outline: a darker shade of the fur unless the animal sets its own
const lineOf = (a) => a.line || shade(a.fur, -0.34);
// Features drawn on very dark fur need light ink to stay visible
const inkOf = (a) => (a.eyePatch || a.darkFace ? LIGHT_INK : INK);

// Where each ear type hinges on the head, as transform-origin percentages of the box
const EAR_PIVOT = {
  pointy: [38, 28],
  long: [41, 26],
  round: [34, 27],
  small: [36, 26],
  fluffy: [31, 31],
  floppy: [33, 32],
};

function EarShape({ a }) {
  const c = a.earColor || a.fur;
  const line = { stroke: lineOf(a), strokeWidth: LINE_W, strokeLinejoin: 'round' };
  switch (a.ears) {
    case 'pointy':
      return (
        <G>
          <Path d="M54 78 Q56 34 62 22 Q68 20 98 50 Z" fill={c} {...line} />
          <Path d="M64 64 Q65 42 68 34 Q72 34 86 52 Z" fill={a.inner} />
          {isCat(a) && (
            <G stroke={a.earTuft || '#FFFFFF'} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" fill="none">
              <Path d="M66 58 Q68 50 74 46" />
              <Path d="M70 62 Q74 54 80 52" />
            </G>
          )}
        </G>
      );
    case 'long':
      return (
        <G>
          <Ellipse cx="80" cy="30" rx="13" ry="38" fill={c} transform="rotate(-12 80 30)" {...line} />
          <Ellipse cx="80" cy="32" rx="6" ry="28" fill={a.inner} transform="rotate(-12 80 32)" />
        </G>
      );
    case 'round':
      return (
        <G>
          <Circle cx="62" cy="50" r="17" fill={c} {...line} />
          <Circle cx="62" cy="50" r="8" fill={a.inner} />
        </G>
      );
    case 'small':
      return (
        <G>
          <Circle cx="68" cy="52" r="11" fill={c} {...line} />
          <Circle cx="68" cy="52" r="6" fill={a.inner} />
        </G>
      );
    case 'fluffy':
      return (
        <G>
          <Circle cx="54" cy="62" r="26" fill={c} {...line} />
          <Circle cx="56" cy="64" r="15" fill={a.inner} />
        </G>
      );
    case 'floppy':
      return <Ellipse cx="56" cy="92" rx="15" ry="32" fill={a.inner} transform="rotate(18 56 92)" {...line} />;
    default:
      return null;
  }
}

function Ear({ a, side, rot }) {
  const [px, py] = EAR_PIVOT[a.ears] || [40, 30];
  const originX = side === 'L' ? px : 100 - px;
  const dir = side === 'L' ? -1 : 1;
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${dir * rot.value}deg` }],
  }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: `${originX}% ${py}%` }, style]}>
      <Svg width="100%" height="100%" viewBox={VB}>
        <G transform={side === 'R' ? MIRROR : undefined}>
          <EarShape a={a} />
        </G>
      </Svg>
    </Animated.View>
  );
}

function Eyes({ face, a, look }) {
  const L = 82;
  const R = 118;
  const y = 88;
  const ink = inkOf(a);
  if (face === 'sleep' || face === 'blink' || face === 'yawn') {
    return (
      <G stroke={ink} strokeWidth="3.2" strokeLinecap="round" fill="none">
        <Path d={`M${L - 7} ${y} Q${L} ${y + 6} ${L + 7} ${y}`} />
        <Path d={`M${R - 7} ${y} Q${R} ${y + 6} ${R + 7} ${y}`} />
      </G>
    );
  }
  if (face === 'happy' || face === 'love' || face === 'groom') {
    return (
      <G stroke={ink} strokeWidth="3.2" strokeLinecap="round" fill="none">
        <Path d={`M${L - 7} ${y + 3} Q${L} ${y - 7} ${L + 7} ${y + 3}`} />
        <Path d={`M${R - 7} ${y + 3} Q${R} ${y - 7} ${R + 7} ${y + 3}`} />
      </G>
    );
  }
  if (face === 'sad') {
    const shine = a.eyePatch ? INK : '#FFFFFF';
    return (
      <G>
        {a.eyeColor && <Circle cx={L} cy={y + 3} r="7" fill={a.eyeColor} />}
        {a.eyeColor && <Circle cx={R} cy={y + 3} r="7" fill={a.eyeColor} />}
        <Circle cx={L} cy={y + 3} r={a.eyeColor ? 4 : 5.5} fill={a.eyeColor ? INK : ink} />
        <Circle cx={R} cy={y + 3} r={a.eyeColor ? 4 : 5.5} fill={a.eyeColor ? INK : ink} />
        <Circle cx={L + 1.5} cy={y + 1.5} r="1.8" fill={shine} />
        <Circle cx={R + 1.5} cy={y + 1.5} r="1.8" fill={shine} />
        <Path d={`M${L - 9} ${y - 6} L${L + 5} ${y - 10}`} stroke={ink} strokeWidth="2.6" strokeLinecap="round" />
        <Path d={`M${R + 9} ${y - 6} L${R - 5} ${y - 10}`} stroke={ink} strokeWidth="2.6" strokeLinecap="round" />
        <Ellipse cx={L - 3} cy={y + 13} rx="2.2" ry="3.4" fill="#8FC7EA" />
      </G>
    );
  }
  const shine = a.eyePatch ? INK : '#FFFFFF';
  const dx = look.x * 2.6;
  const dy = look.y * 2;
  if (a.eyeColor) {
    // coloured iris with a soft vertical pupil
    return (
      <G>
        {[L, R].map((cx) => (
          <G key={cx}>
            <Ellipse cx={cx + dx * 0.4} cy={y + dy * 0.4} rx="8" ry="8.5" fill={a.eyeColor} stroke={INK} strokeWidth="1.6" />
            <Ellipse cx={cx + dx * 0.6} cy={y + 0.5 + dy * 0.6} rx="4.2" ry="6.4" fill={INK} />
            <Circle cx={cx + 2.6 + dx} cy={y - 2.8 + dy} r="2.6" fill="#FFFFFF" />
            <Circle cx={cx - 2.6 + dx} cy={y + 3.2 + dy} r="1.2" fill="#FFFFFF" />
          </G>
        ))}
      </G>
    );
  }
  return (
    <G>
      <Ellipse cx={L + dx * 0.4} cy={y + dy * 0.4} rx="7.5" ry="8" fill={ink} />
      <Ellipse cx={R + dx * 0.4} cy={y + dy * 0.4} rx="7.5" ry="8" fill={ink} />
      <Circle cx={L + 2.5 + dx} cy={y - 2.5 + dy} r="2.8" fill={shine} />
      <Circle cx={R + 2.5 + dx} cy={y - 2.5 + dy} r="2.8" fill={shine} />
      <Circle cx={L - 2.5 + dx} cy={y + 3 + dy} r="1.3" fill={shine} />
      <Circle cx={R - 2.5 + dx} cy={y + 3 + dy} r="1.3" fill={shine} />
    </G>
  );
}

function Mouth({ face, a }) {
  // white muzzles keep dark ink even on a dark cat
  const ink = a.muzzle ? INK : inkOf(a);
  if (face === 'yawn') return <Ellipse cx="100" cy="113" rx="6" ry="8" fill="#B5503E" />;
  if (face === 'groom') {
    return (
      <G>
        <Path d="M96 108 Q100 118 104 108 Z" fill="#F08A7E" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
        <Path d="M100 105 Q96 110 91 107 M100 105 Q104 110 109 107" stroke={ink} strokeWidth="2.3" fill="none" strokeLinecap="round" />
      </G>
    );
  }
  if (face === 'sad') {
    return <Path d="M92 117 Q100 110 108 117" stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />;
  }
  if (face === 'happy' || face === 'love') {
    return (
      <G>
        <Path d="M91 108 Q100 122 109 108 Z" fill="#B5503E" />
        <Path d="M95 114 Q100 119 105 114" fill="#F08A7E" />
      </G>
    );
  }
  const y = a.bigNose ? 113 : 106;
  return (
    <G stroke={ink} strokeWidth="2.3" fill="none" strokeLinecap="round">
      <Path d={`M100 ${y} Q96 ${y + 5} 91 ${y + 2}`} />
      <Path d={`M100 ${y} Q104 ${y + 5} 109 ${y + 2}`} />
    </G>
  );
}

function Whiskers({ a }) {
  const c = a.whisker || (a.darkFace ? LIGHT_INK : INK);
  return (
    <G stroke={c} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity={a.darkFace ? 0.7 : 0.45}>
      <Path d="M70 102 Q56 98 40 99" />
      <Path d="M70 107 Q56 107 41 110" />
      <Path d="M72 112 Q60 116 47 121" />
      <Path d="M130 102 Q144 98 160 99" />
      <Path d="M130 107 Q144 107 159 110" />
      <Path d="M128 112 Q140 116 153 121" />
    </G>
  );
}

// Coat markings, drawn inside the head clip
function HeadCoat({ a }) {
  const id = `head-${a.key}`;
  const shape = isCat(a) ? <Path d={CAT_HEAD} /> : <Circle cx="100" cy="88" r="50" />;
  return (
    <G>
      <Defs>
        <ClipPath id={id}>{shape}</ClipPath>
        {a.point && (
          <RadialGradient id={`mask-${a.key}`} cx="100" cy="106" r="24" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={a.point} stopOpacity="0.7" />
            <Stop offset="0.55" stopColor={a.point} stopOpacity="0.4" />
            <Stop offset="1" stopColor={a.point} stopOpacity="0" />
          </RadialGradient>
        )}
      </Defs>
      <G clipPath={`url(#${id})`}>
        {a.patches && (
          <G>
            <Ellipse cx="66" cy="56" rx="34" ry="28" fill={a.patches[0]} transform="rotate(-20 66 56)" />
            <Ellipse cx="140" cy="66" rx="24" ry="22" fill={a.patches[1]} />
          </G>
        )}
        {a.point && <Ellipse cx="100" cy="106" rx="26" ry="22" fill={`url(#mask-${a.key})`} />}
        {a.blaze && <Path d="M100 140 C76 140 70 112 84 98 Q94 90 92 60 L100 50 L108 60 Q106 90 116 98 C130 112 124 140 100 140 Z" fill={a.blaze} />}
        {a.stripes && (
          <G stroke={a.stripe || '#D9843F'} strokeWidth="3.5" strokeLinecap="round" fill="none">
            <Path d="M100 40 L100 54" />
            <Path d="M89 42 L91 54" />
            <Path d="M111 42 L109 54" />
            <Path d="M48 82 L60 86" />
            <Path d="M48 92 L58 94" />
            <Path d="M152 82 L140 86" />
            <Path d="M152 92 L142 94" />
          </G>
        )}
      </G>
    </G>
  );
}

function Head({ a, face }) {
  const line = lineOf(a);
  return (
    <Svg width="100%" height="100%" viewBox={VB}>
      {isCat(a) ? (
        <Path d={CAT_HEAD} fill={a.fur} stroke={line} strokeWidth={LINE_W} strokeLinejoin="round" />
      ) : (
        <Circle cx="100" cy="88" r="50" fill={a.fur} stroke={line} strokeWidth={LINE_W} />
      )}
      <HeadCoat a={a} />
      {a.eyePatch && (
        <G>
          <Ellipse cx="81" cy="90" rx="13" ry="15" fill={a.eyePatch} transform="rotate(-25 81 90)" />
          <Ellipse cx="119" cy="90" rx="13" ry="15" fill={a.eyePatch} transform="rotate(25 119 90)" />
        </G>
      )}
      {a.spot && <Ellipse cx="119" cy="85" rx="16" ry="14" fill={a.inner} opacity="0.5" />}
      {a.muzzle && <Ellipse cx="100" cy="106" rx="21" ry="15" fill={a.muzzle} />}
      {a.cheeks && (
        <G>
          <Circle cx="63" cy="104" r="17" fill={a.belly} />
          <Circle cx="137" cy="104" r="17" fill={a.belly} />
        </G>
      )}
      {face !== 'open' && <Eyes face={face} a={a} look={NO_LOOK} />}
      {face !== 'sad' && (
        <G opacity={(face === 'happy' || face === 'love' || face === 'groom' ? 0.85 : 0.5) * (a.darkFace ? 0.7 : 1)}>
          <Ellipse cx="67" cy="105" rx="9" ry="5.5" fill={BLUSH} />
          <Ellipse cx="133" cy="105" rx="9" ry="5.5" fill={BLUSH} />
        </G>
      )}
      {isCat(a) && <Whiskers a={a} />}
      {a.bigNose ? (
        <Ellipse cx="100" cy="101" rx="9" ry="11" fill={a.nose} />
      ) : (
        <Path d="M94 99 Q100 95.5 106 99 Q100 106 94 99 Z" fill={a.nose || INK} />
      )}
      <Mouth face={face} a={a} />
    </Svg>
  );
}

// ---------- tail ----------

const AnimatedPath = Animated.createAnimatedComponent(Path);

// The long tail is two curves whose control points sway with a lag, so a wave travels to the tip.
// `down` blends from the upright pose to lying along the seat (sleepy or sad).
const TAIL_UP = [172, 184, 180, 160, 170, 138, 164, 124, 176, 112, 184, 120];
const TAIL_DOWN = [158, 196, 172, 204, 184, 203, 191, 202, 195, 198, 194, 191];

function tailPath(phase, amp, down) {
  'worklet';
  const p = [];
  for (let i = 0; i < 12; i++) p.push(TAIL_UP[i] + (TAIL_DOWN[i] - TAIL_UP[i]) * down);
  const body = 1 - down * 0.8; // a lying tail only twitches its tip
  const w1 = Math.sin(phase) * amp * body;
  const w2 = Math.sin(phase - 1.1) * amp * (1.5 - down);
  return (
    `M140 186 C${p[0]} ${p[1]} ${p[2] + w1 * 0.4} ${p[3]} ${p[4] + w1} ${p[5]} ` +
    `C${p[6] + w1 * 1.3} ${p[7]} ${p[8] + w2} ${p[9] - Math.abs(w2) * down * 0.3} ${p[10] + w2 * 1.15} ${p[11] - Math.abs(w2) * 0.25}`
  );
}

function LongTail({ a, phase, amp, down }) {
  const outline = useAnimatedProps(() => ({ d: tailPath(phase.value, amp.value, down.value) }));
  const fill = useAnimatedProps(() => ({ d: tailPath(phase.value, amp.value, down.value) }));
  const bands = useAnimatedProps(() => ({ d: tailPath(phase.value, amp.value, down.value) }));
  return (
    <Svg width="100%" height="100%" viewBox={VB}>
      <AnimatedPath animatedProps={outline} stroke={lineOf(a)} strokeWidth="17.5" strokeLinecap="round" fill="none" />
      <AnimatedPath animatedProps={fill} stroke={a.tailColor || a.fur} strokeWidth="13" strokeLinecap="round" fill="none" />
      {a.stripes && <AnimatedPath animatedProps={bands} stroke={a.stripe || '#D9843F'} strokeWidth="13" strokeDasharray="3.5 9" strokeDashoffset="-16" fill="none" />}
    </Svg>
  );
}

function TailShape({ a }) {
  const c = a.tailColor || a.fur;
  const line = lineOf(a);
  switch (a.tail) {
    case 'bushy':
      return (
        <G>
          <Path d="M136 188 C170 196 188 162 178 124 C170 152 156 164 136 170 Z" fill={c} stroke={line} strokeWidth={LINE_W} strokeLinejoin="round" />
          <Path d="M178 124 C186 140 184 152 178 162 C172 148 172 136 178 124 Z" fill={a.tailTip || c} />
        </G>
      );
    case 'short':
      return <Ellipse cx="152" cy="178" rx="14" ry="8" fill={c} transform="rotate(-35 152 178)" stroke={line} strokeWidth={LINE_W} />;
    case 'puff':
      return <Circle cx="150" cy="186" r="12" fill={a.limbColor || a.belly} stroke={line} strokeWidth={LINE_W} />;
    default:
      return null;
  }
}

// Other tails swing as one piece, driven by the same phase
function SwingTail({ a, phase, amp }) {
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${Math.sin(phase.value) * amp.value * 1.5}deg` }] }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '72% 85%' }, style]}>
      <Svg width="100%" height="100%" viewBox={VB}>
        <TailShape a={a} />
      </Svg>
    </Animated.View>
  );
}

// ---------- body + arms ----------

function BodyShape({ a, shadow }) {
  const line = lineOf(a);
  const stroke = { stroke: line, strokeWidth: LINE_W };
  const id = `body-${a.key}`;
  return (
    <Svg width="100%" height="100%" viewBox={VB}>
      <Defs>
        <ClipPath id={id}>
          <Ellipse cx="100" cy="156" rx="54" ry="48" />
        </ClipPath>
      </Defs>
      {shadow && <Ellipse cx="100" cy="206" rx="62" ry="8" fill="#000" opacity="0.12" />}
      <Ellipse cx="100" cy="156" rx="54" ry="48" fill={a.fur} {...stroke} />
      <G clipPath={`url(#${id})`}>
        {a.patches && (
          <G>
            <Ellipse cx="62" cy="134" rx="26" ry="30" fill={a.patches[0]} />
            <Ellipse cx="144" cy="176" rx="22" ry="26" fill={a.patches[1]} />
          </G>
        )}
        {a.stripes && (
          <G stroke={a.stripe || '#D9843F'} strokeWidth="4" strokeLinecap="round" fill="none">
            <Path d="M48 140 Q58 142 62 150" />
            <Path d="M47 158 Q57 158 60 166" />
            <Path d="M152 140 Q142 142 138 150" />
            <Path d="M153 158 Q143 158 140 166" />
          </G>
        )}
      </G>
      <Ellipse cx="100" cy="164" rx="33" ry="33" fill={a.belly} />
      {a.fluffy && (
        // soft chest ruff
        <Path d="M72 140 L78 148 L84 140 L90 149 L96 140 L102 150 L108 140 L114 149 L120 140 L126 148 L130 140 Q100 126 72 140 Z" fill={a.belly} />
      )}
    </Svg>
  );
}

// Left back foot; the right one is mirrored. Lifted in turn while walking.
function Foot({ a, side, waddle, unit }) {
  const line = lineOf(a);
  const style = useAnimatedStyle(() => {
    const w = side === 'L' ? waddle.value : -waddle.value;
    return { transform: [{ translateY: -Math.max(0, w) * 6 * unit }] };
  });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%" viewBox={VB}>
        <G transform={side === 'R' ? MIRROR : undefined}>
          <Ellipse cx="76" cy="198" rx="17" ry="10" fill={a.paws || a.limbColor || a.fur} stroke={line} strokeWidth={LINE_W} />
          <Path d="M70 196 L70 202 M78 196 L78 203" stroke={line} strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
        </G>
      </Svg>
    </Animated.View>
  );
}

// Left front leg; the right one is the same art mirrored. It hinges at the shoulder.
function ArmShape({ a }) {
  const line = lineOf(a);
  return (
    <G>
      <Ellipse cx="80" cy="160" rx="12" ry="18" fill={a.limbColor || a.fur} transform="rotate(14 80 160)" stroke={line} strokeWidth={LINE_W} />
      {a.paws && <Ellipse cx="76" cy="173" rx="8.5" ry="6" fill={a.paws} transform="rotate(14 76 173)" />}
      <Path d="M72 175 L73 178.5 M77 176.5 L77.5 179.5" stroke={line} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
    </G>
  );
}

const SHOULDER = { L: '42% 65%', R: '58% 65%' };

function Arm({ a, side, rot, push, unit }) {
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: push.value * unit }, { rotate: `${rot.value}deg` }] }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: SHOULDER[side] }, style]}>
      <Svg width="100%" height="100%" viewBox={VB}>
        <G transform={side === 'R' ? MIRROR : undefined}>
          <ArmShape a={a} />
        </G>
      </Svg>
    </Animated.View>
  );
}

// ---------- face layers ----------

// Open eyes on their own layer so they can blink (squash) and glance (slide) smoothly
function OpenEyes({ a, blink, lookX, lookY, unit }) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: lookX.value * 2.6 * unit }, { translateY: lookY.value * 2 * unit }, { scaleY: blink.value }],
  }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '50% 40%' }, style]}>
      <Svg width="100%" height="100%" viewBox={VB}>
        <Eyes face="open" a={a} look={NO_LOOK} />
      </Svg>
    </Animated.View>
  );
}

// Sleepy nose bubble that swells with each breath and eventually pops
function NoseBubble({ unit }) {
  const t = useSharedValue(0);
  useEffect(() => {
    const breath = (to) => withTiming(to, { duration: 2300, easing: Easing.inOut(Easing.sin) });
    t.value = withRepeat(
      withSequence(withDelay(1200, breath(0.7)), breath(0.35), breath(1), breath(0.55), breath(1.15), withTiming(0, { duration: 70 })),
      -1,
      false
    );
    return () => cancelAnimation(t);
  }, [t]);
  const style = useAnimatedStyle(() => ({ opacity: t.value > 0.05 ? 0.9 : 0, transform: [{ scale: t.value }] }));
  const r = 8 * unit;
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.bubble, { left: 106 * unit, top: 98 * unit, width: r * 2, height: r * 2, borderRadius: r, transformOrigin: '10% 30%' }, style]}
    >
      <View style={[styles.bubbleShine, { width: r * 0.5, height: r * 0.5, borderRadius: r, left: r * 0.4, top: r * 0.35 }]} />
    </Animated.View>
  );
}

function Zzz({ size, delay }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 3000, easing: Easing.out(Easing.quad) }), -1, false));
    return () => cancelAnimation(t);
  }, [t, delay]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.15 ? t.value / 0.15 : 1 - (t.value - 0.15) / 0.85,
    transform: [
      { translateY: -t.value * size * 0.35 },
      { translateX: t.value * size * 0.18 + Math.sin(t.value * 6) * size * 0.03 },
      { scale: 0.6 + t.value * 0.9 },
      { rotate: `${-10 + t.value * 20}deg` },
    ],
  }));
  return (
    <Animated.Text style={[styles.z, { fontSize: size * 0.11, top: size * 0.12, right: size * 0.16 }, style]}>z</Animated.Text>
  );
}

function Heart({ size, seed, sparkle }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) });
  }, [t]);
  const dx = (seed - 0.5) * size * 0.8;
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.1 ? t.value * 10 : 1 - Math.max(0, (t.value - 0.5) / 0.5),
    transform: [
      { translateX: dx * t.value + Math.sin(t.value * 9 + seed * 6) * size * 0.02 },
      { translateY: -t.value * size * 0.55 },
      { scale: 0.4 + Math.min(1, t.value * 3) * 0.8 },
      { rotate: `${(seed - 0.5) * 40 * t.value}deg` },
    ],
  }));
  const s = size * 0.12;
  return (
    <Animated.View pointerEvents="none" style={[styles.heart, { left: size * 0.44, top: size * 0.12 }, style]}>
      <Icon name={sparkle ? 'sparkle' : 'heart'} size={s} color={sparkle ? '#FFC94D' : '#F0627A'} />
    </Animated.View>
  );
}

// ---------- the critter ----------

// Tail rhythm per mood: sway amplitude (design units), one full swish (ms), and how far it lies down
const TAIL = {
  idle: { amp: 7, ms: 2600, down: 0 },
  play: { amp: 12, ms: 1000, down: 0 },
  happy: { amp: 14, ms: 640, down: 0 },
  sleep: { amp: 3, ms: 4200, down: 1 },
  sad: { amp: 2, ms: 5200, down: 1 },
  walk: { amp: 9, ms: 900, down: 0 },
};

const STEP_MS = 260; // one footfall while walking

// Timeouts owned by one effect, cleared together when it ends
function timerBag() {
  const ids = [];
  return {
    later: (fn, ms) => ids.push(setTimeout(fn, ms)),
    clear: () => ids.forEach(clearTimeout),
  };
}

const rand = (a, b) => a + Math.random() * (b - a);

/**
 * mood: 'idle' | 'play' | 'sleep' | 'happy' | 'sad' | 'walk'
 * pokeKey: change it to play a "petted" reaction (purr + knead, paw wave, or a happy hop)
 * jumpKey: change it when the critter leaps somewhere (crouch, stretch, squashy landing); jumpMs is the flight time
 * size: rendered width in px (height follows the 200x220 artwork ratio)
 */
export default function Critter({ animal, mood = 'idle', size = 180, animated = true, pokeKey = 0, jumpKey = 0, jumpMs = 850, shadow = true }) {
  const [face, setFace] = useState(null); // temporary expression override
  const [armsFront, setArmsFront] = useState(false); // paws drawn over the face (grooming, waving)
  const [hearts, setHearts] = useState([]);
  const unit = size / CRITTER_VB.w;

  const breathe = useSharedValue(0);
  const phase = useSharedValue(0);
  const amp = useSharedValue(TAIL[mood]?.amp ?? 7);
  const down = useSharedValue(TAIL[mood]?.down ?? 0);
  const hop = useSharedValue(0);
  const tilt = useSharedValue(0);
  const droop = useSharedValue(0);
  const earL = useSharedValue(0);
  const earR = useSharedValue(0);
  const squash = useSharedValue(0); // >0 squashes down, <0 stretches up
  const vib = useSharedValue(0); // purring shiver
  const blink = useSharedValue(1);
  const lookX = useSharedValue(0);
  const lookY = useSharedValue(0);
  const armL = useSharedValue(0);
  const armR = useSharedValue(0);
  const pushL = useSharedValue(0);
  const pushR = useSharedValue(0);
  const waddle = useSharedValue(0); // -1..1 side-to-side while walking

  const twitch = (sv, base) => {
    sv.value = withSequence(withTiming(base + 18, { duration: 70 }), withTiming(base - 6, { duration: 90 }), withSpring(base));
  };

  // Resting pose, breathing and tail rhythm for each mood
  useEffect(() => {
    if (!animated) return undefined;
    const t = TAIL[mood] || TAIL.idle;
    const slow = mood === 'sleep';
    breathe.value = withRepeat(withTiming(1, { duration: slow ? 2300 : 1700, easing: Easing.inOut(Easing.sin) }), -1, true);
    phase.value = 0;
    phase.value = withRepeat(withTiming(Math.PI * 2, { duration: t.ms, easing: Easing.linear }), -1, false);
    amp.value = withTiming(t.amp, { duration: 600 });
    down.value = withTiming(t.down, { duration: 900, easing: Easing.inOut(Easing.quad) });
    droop.value = withSpring(slow ? 1 : mood === 'sad' ? 0.7 : 0, { damping: 14 });
    tilt.value = withSpring(slow ? 7 : mood === 'sad' ? -4 : 0, { damping: 12 });
    const earRest = mood === 'sad' ? 22 : slow ? 8 : mood === 'play' ? -6 : 0;
    earL.value = withSpring(earRest);
    earR.value = withSpring(earRest);
    armL.value = withSpring(0);
    armR.value = withSpring(0);
    lookX.value = withTiming(0, { duration: 300 });
    lookY.value = withTiming(mood === 'sad' ? 0.6 : 0, { duration: 300 });
    if (mood === 'happy') {
      // two excited hops, a breather, repeat — each landing squashes the body
      const up = (ms) => withTiming(1, { duration: ms, easing: Easing.out(Easing.quad) });
      const dn = (ms) => withTiming(0, { duration: ms, easing: Easing.in(Easing.quad) });
      hop.value = withRepeat(withSequence(up(230), dn(250), up(230), dn(250), withDelay(900, withTiming(0, { duration: 1 }))), -1, false);
      const land = (wait) => withSequence(withDelay(wait, withTiming(0.6, { duration: 80 })), withTiming(0, { duration: 200 }));
      squash.value = withRepeat(withSequence(land(480), land(200), withDelay(620, withTiming(0, { duration: 1 }))), -1, false);
    } else if (mood === 'walk') {
      // rock from foot to foot with a little bounce on every step, front legs swinging in turn
      const swing = (to) => withTiming(to, { duration: STEP_MS, easing: Easing.inOut(Easing.sin) });
      waddle.value = withRepeat(withSequence(swing(1), swing(-1)), -1, false);
      hop.value = withRepeat(
        withSequence(withTiming(0.2, { duration: STEP_MS / 2, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: STEP_MS / 2, easing: Easing.in(Easing.quad) })),
        -1,
        false
      );
      armL.value = withRepeat(withSequence(swing(8), swing(-6)), -1, false);
      armR.value = withRepeat(withSequence(swing(6), swing(-8)), -1, false);
      squash.value = withTiming(0, { duration: 150 });
      earL.value = withSpring(-4);
      earR.value = withSpring(-4);
    } else {
      hop.value = withTiming(0, { duration: 150 });
      squash.value = withTiming(0, { duration: 150 });
    }
    if (mood !== 'walk') waddle.value = withTiming(0, { duration: 160 });
    if (mood === 'play') {
      // eyes follow the rolling yarn
      lookX.value = 0.3;
      lookX.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true);
    }
    return () => {
      cancelAnimation(breathe);
      cancelAnimation(phase);
      cancelAnimation(hop);
      cancelAnimation(squash);
      cancelAnimation(lookX);
      cancelAnimation(waddle);
    };
  }, [animated, mood]); // eslint-disable-line react-hooks/exhaustive-deps

  // Blinking, on its own clock: now and then a double blink
  useEffect(() => {
    if (!animated || mood === 'sleep' || mood === 'sad') return undefined;
    const bag = timerBag();
    const shut = () => withSequence(withTiming(0.08, { duration: 70 }), withTiming(1, { duration: 120 }));
    const loop = () => {
      blink.value = Math.random() < 0.25 ? withSequence(shut(), withDelay(90, shut())) : shut();
      bag.later(loop, rand(2200, 5200));
    };
    bag.later(loop, rand(800, 2000));
    return () => {
      bag.clear();
      blink.value = 1;
    };
  }, [animated, mood, blink]);

  // Little things a cat does when nobody's looking
  useEffect(() => {
    if (!animated || mood === 'happy' || mood === 'walk') return undefined;
    const bag = timerBag();
    const reset = () => {
      setFace(null);
      setArmsFront(false);
    };

    const idleActs = [
      // glance somewhere, head following a touch
      [16, () => {
        const x = Math.round(rand(-1, 1) * 10) / 10;
        lookX.value = withSequence(withTiming(x, { duration: 220 }), withDelay(1400, withTiming(0, { duration: 320 })));
        lookY.value = withSequence(withTiming(rand(-0.6, 0.4), { duration: 220 }), withDelay(1400, withTiming(0, { duration: 320 })));
        return 2000;
      }],
      [12, () => {
        twitch(Math.random() < 0.5 ? earL : earR, 0);
        return 900;
      }],
      [12, () => {
        tilt.value = withSequence(withSpring(Math.random() < 0.5 ? -10 : 10, { damping: 10 }), withDelay(1300, withSpring(0)));
        return 1900;
      }],
      [10, () => {
        amp.value = withSequence(withTiming(17, { duration: 220 }), withDelay(700, withTiming(TAIL.idle.amp, { duration: 600 })));
        return 1500;
      }],
      [14, () => {
        // lick a paw, then wipe it over the face
        setArmsFront(true);
        setFace('groom');
        armL.value = withSequence(
          withTiming(-168, { duration: 450, easing: Easing.out(Easing.quad) }),
          withRepeat(withSequence(withTiming(-158, { duration: 170 }), withTiming(-170, { duration: 170 })), 4, false),
          withTiming(0, { duration: 420, easing: Easing.inOut(Easing.quad) })
        );
        tilt.value = withSequence(withTiming(-7, { duration: 400 }), withDelay(1400, withSpring(0)));
        bag.later(() => setFace(null), 1850);
        bag.later(() => setArmsFront(false), 2350);
        return 2600;
      }],
      [9, () => {
        // big stretch: reach up tall with eyes closed, then settle
        setFace('happy');
        squash.value = withSequence(withTiming(0.3, { duration: 250 }), withTiming(-1, { duration: 500, easing: Easing.out(Easing.quad) }), withDelay(450, withSpring(0, { damping: 8 })));
        earL.value = withSequence(withDelay(250, withTiming(-10, { duration: 400 })), withDelay(450, withSpring(0)));
        earR.value = withSequence(withDelay(250, withTiming(-10, { duration: 400 })), withDelay(450, withSpring(0)));
        bag.later(() => setFace(null), 1500);
        return 2000;
      }],
      [9, () => {
        setFace('yawn');
        tilt.value = withSequence(withTiming(-5, { duration: 400 }), withDelay(700, withSpring(0)));
        squash.value = withSequence(withTiming(0.3, { duration: 500 }), withDelay(500, withSpring(0)));
        bag.later(() => setFace(null), 1300);
        return 1700;
      }],
      [10, () => {
        // slow, contented blink: a cat's "I love you"
        setFace('happy');
        bag.later(() => setFace(null), 1100);
        return 1500;
      }],
      [8, () => {
        const up = withTiming(0.45, { duration: 150, easing: Easing.out(Easing.quad) });
        const dn = withTiming(0, { duration: 170, easing: Easing.in(Easing.quad) });
        hop.value = withSequence(up, dn, up, dn);
        squash.value = withSequence(withDelay(320, withTiming(0.4, { duration: 60 })), withTiming(0, { duration: 140 }), withDelay(120, withTiming(0.4, { duration: 60 })), withSpring(0));
        return 1000;
      }],
    ];
    const sleepActs = [
      [5, () => {
        twitch(Math.random() < 0.5 ? earL : earR, 8);
        return 1200;
      }],
      [3, () => {
        // deep sigh
        squash.value = withSequence(withTiming(-0.35, { duration: 900, easing: Easing.inOut(Easing.sin) }), withTiming(0.15, { duration: 1100 }), withSpring(0));
        return 2600;
      }],
      [2, () => {
        amp.value = withSequence(withTiming(9, { duration: 200 }), withDelay(400, withTiming(TAIL.sleep.amp, { duration: 500 })));
        return 1400;
      }],
    ];
    const sadActs = [
      [1, () => {
        twitch(Math.random() < 0.5 ? earL : earR, 22);
        return 1400;
      }],
    ];
    const playActs = [
      [6, () => {
        // swat at the yarn
        armR.value = withSequence(withTiming(-86, { duration: 110, easing: Easing.out(Easing.quad) }), withTiming(-70, { duration: 90 }), withSpring(0, { damping: 11 }));
        hop.value = withSequence(withTiming(0.3, { duration: 120 }), withTiming(0, { duration: 160 }));
        squash.value = withSequence(withTiming(0.4, { duration: 90 }), withSpring(0, { damping: 8 }));
        return 900;
      }],
      [2, () => {
        // wiggle the bum before pouncing
        tilt.value = withSequence(withTiming(-5, { duration: 90 }), withTiming(5, { duration: 90 }), withTiming(-5, { duration: 90 }), withTiming(5, { duration: 90 }), withSpring(0));
        squash.value = withSequence(withTiming(0.35, { duration: 360 }), withTiming(-0.5, { duration: 140 }), withSpring(0, { damping: 7 }));
        hop.value = withSequence(withDelay(360, withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) })), withTiming(0, { duration: 220, easing: Easing.in(Easing.quad) }));
        return 1300;
      }],
    ];

    const acts = mood === 'sleep' ? sleepActs : mood === 'play' ? playActs : mood === 'sad' ? sadActs : idleActs;
    const total = acts.reduce((n, [w]) => n + w, 0);
    const pick = () => {
      let r = Math.random() * total;
      for (const [w, fn] of acts) {
        r -= w;
        if (r <= 0) return fn;
      }
      return acts[0][1];
    };
    const act = () => {
      const busy = pick()();
      bag.later(act, busy + (mood === 'play' ? rand(900, 2200) : rand(1400, 3400)));
    };
    bag.later(act, rand(900, 1800));
    return () => {
      bag.clear();
      reset();
      lookY.value = withTiming(mood === 'sad' ? 0.6 : 0, { duration: 200 });
      armL.value = withSpring(0);
      armR.value = withSpring(0);
    };
  }, [animated, mood]); // eslint-disable-line react-hooks/exhaustive-deps

  // Petting reactions take turns so repeated taps stay fun
  useEffect(() => {
    if (!pokeKey || !animated) return undefined;
    const bag = timerBag();
    const kind = pokeKey % 3;
    if (kind === 1) {
      // purr and knead: eyes closed, little shiver, paws pressing in turn
      setFace('love');
      vib.value = withSequence(withRepeat(withSequence(withTiming(1, { duration: 45 }), withTiming(-1, { duration: 45 })), 14, true), withTiming(0, { duration: 40 }));
      const press = withRepeat(withSequence(withTiming(4, { duration: 170 }), withTiming(0, { duration: 170 })), 3, false);
      pushL.value = press;
      pushR.value = withDelay(170, withRepeat(withSequence(withTiming(4, { duration: 170 }), withTiming(0, { duration: 170 })), 3, false));
      earL.value = withSequence(withTiming(10, { duration: 200 }), withDelay(900, withSpring(0)));
      earR.value = withSequence(withTiming(10, { duration: 200 }), withDelay(900, withSpring(0)));
      bag.later(() => setFace(null), 1400);
    } else if (kind === 2) {
      // "hi!" — paw wave with a head tilt
      setArmsFront(true);
      setFace('happy');
      armR.value = withSequence(
        withTiming(-148, { duration: 280, easing: Easing.out(Easing.back(1.5)) }),
        withRepeat(withSequence(withTiming(-134, { duration: 150 }), withTiming(-160, { duration: 150 })), 3, false),
        withSpring(0, { damping: 12 })
      );
      tilt.value = withSequence(withSpring(-9, { damping: 10 }), withDelay(900, withSpring(0)));
      bag.later(() => setFace(null), 1300);
      bag.later(() => setArmsFront(false), 1900);
    } else {
      // anticipation squash, hop, squashy landing
      setFace('love');
      const land = withSequence(withTiming(0.9, { duration: 70 }), withSpring(0, { damping: 6, stiffness: 200 }));
      squash.value = withSequence(withTiming(0.7, { duration: 100 }), withTiming(-0.5, { duration: 120 }), withDelay(300, land));
      hop.value = withSequence(withDelay(100, withTiming(1.3, { duration: 200, easing: Easing.out(Easing.quad) })), withTiming(0, { duration: 260, easing: Easing.in(Easing.quad) }));
      earL.value = withSequence(withTiming(-14, { duration: 120 }), withSpring(0));
      earR.value = withSequence(withTiming(-14, { duration: 120 }), withSpring(0));
      amp.value = withSequence(withTiming(16, { duration: 150 }), withDelay(700, withTiming(TAIL[mood]?.amp ?? 7, { duration: 500 })));
      bag.later(() => setFace(null), 1100);
    }
    const batch = [0, 1, 2, 3, 4].map((i) => ({ id: `${pokeKey}-${i}`, seed: Math.random(), sparkle: i % 2 === 1 }));
    batch.forEach((ht, i) => bag.later(() => setHearts((cur) => [...cur.slice(-8), ht]), i * 90));
    bag.later(() => setHearts((cur) => cur.filter((ht) => !batch.includes(ht))), 1900);
    return () => bag.clear();
  }, [pokeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Leaping between the chair and the rug: crouch, stretch out mid-air, squash on landing
  const firstJump = useRef(true);
  useEffect(() => {
    if (firstJump.current) {
      firstJump.current = false;
      return;
    }
    if (!animated) return;
    squash.value = withSequence(
      withTiming(0.7, { duration: 140 }),
      withTiming(-0.8, { duration: 200, easing: Easing.out(Easing.quad) }),
      withDelay(Math.max(0, jumpMs - 260), withTiming(0.75, { duration: 90 })),
      withSpring(0, { damping: 7 })
    );
    earL.value = withSequence(withDelay(140, withTiming(20, { duration: 200 })), withDelay(Math.max(0, jumpMs - 300), withSpring(0)));
    earR.value = withSequence(withDelay(140, withTiming(20, { duration: 200 })), withDelay(Math.max(0, jumpMs - 300), withSpring(0)));
  }, [jumpKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const lift = size * 0.07;
  const rootStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -hop.value * lift }, { translateX: vib.value * size * 0.005 }, { rotate: `${waddle.value * 4}deg` }],
  }));
  const bodyTransform = () => {
    'worklet';
    return [
      { scaleY: 1 + breathe.value * 0.03 - squash.value * 0.1 + hop.value * 0.03 },
      { scaleX: 1 - breathe.value * 0.01 + squash.value * 0.08 },
    ];
  };
  const bodyStyle = useAnimatedStyle(() => ({ transform: bodyTransform() }));
  const armsStyle = useAnimatedStyle(() => ({ transform: bodyTransform() }));
  const headStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: lookX.value * size * 0.012 },
      { translateY: droop.value * size * 0.035 + breathe.value * size * 0.006 + squash.value * size * 0.05 },
      { rotate: `${tilt.value}deg` },
    ],
  }));

  const h = (size * CRITTER_VB.h) / CRITTER_VB.w;
  const shown = face || (mood === 'idle' || mood === 'play' || mood === 'walk' ? 'open' : mood);
  const frontEars = animal.ears === 'floppy';

  const arms = (
    <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '50% 95%' }, armsStyle]}>
      <Arm a={animal} side="L" rot={armL} push={pushL} unit={unit} />
      <Arm a={animal} side="R" rot={armR} push={pushR} unit={unit} />
    </Animated.View>
  );

  return (
    <View style={{ width: size, height: h }}>
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '50% 92%' }, rootStyle]}>
        {animal.tail === 'long' ? (
          <View style={StyleSheet.absoluteFill}>
            <LongTail a={animal} phase={phase} amp={amp} down={down} />
          </View>
        ) : (
          <SwingTail a={animal} phase={phase} amp={amp} />
        )}
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '50% 95%' }, bodyStyle]}>
          <BodyShape a={animal} shadow={shadow} />
        </Animated.View>
        <Foot a={animal} side="L" waddle={waddle} unit={unit} />
        <Foot a={animal} side="R" waddle={waddle} unit={unit} />
        {!armsFront && arms}
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '50% 60%' }, headStyle]}>
          {!frontEars && <Ear a={animal} side="L" rot={earL} />}
          {!frontEars && <Ear a={animal} side="R" rot={earR} />}
          <View style={StyleSheet.absoluteFill}>
            <Head a={animal} face={shown} />
          </View>
          {shown === 'open' && <OpenEyes a={animal} blink={blink} lookX={lookX} lookY={lookY} unit={unit} />}
          {frontEars && <Ear a={animal} side="L" rot={earL} />}
          {frontEars && <Ear a={animal} side="R" rot={earR} />}
          {animated && mood === 'sleep' && !face && <NoseBubble unit={unit} />}
        </Animated.View>
        {armsFront && arms}
      </Animated.View>
      {animated && mood === 'sleep' && (
        <>
          <Zzz size={size} delay={0} />
          <Zzz size={size} delay={1000} />
          <Zzz size={size} delay={2000} />
        </>
      )}
      {hearts.map((ht) => (
        <Heart key={ht.id} size={size} seed={ht.seed} sparkle={ht.sparkle} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  z: { position: 'absolute', color: '#8A7A70', fontFamily: FONT_BOLD },
  heart: { position: 'absolute' },
  bubble: { position: 'absolute', backgroundColor: 'rgba(196,228,255,0.45)', borderWidth: 1, borderColor: 'rgba(130,180,230,0.75)' },
  bubbleShine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.9)' },
});
