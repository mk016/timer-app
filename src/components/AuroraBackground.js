import { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useSettings } from '../context/SettingsContext';
import { COLORS } from '../theme';

function GlowBlob({ anim, fromColor, width, height, size, gradientId, opacity }) {
  const style = useAnimatedStyle(() => {
    const x = interpolate(anim.value, [0, 1], [width * 0.05, width * 0.65]);
    const y = interpolate(anim.value, [0, 1], [height * 0.02, height * 0.4]);
    return { transform: [{ translateX: x }, { translateY: y }] };
  });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={fromColor} stopOpacity={0.55} />
            <Stop offset="55%" stopColor={fromColor} stopOpacity={0.18} />
            <Stop offset="100%" stopColor={fromColor} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${gradientId})`} opacity={opacity} />
      </Svg>
    </Animated.View>
  );
}

export default function AuroraBackground() {
  const { width, height } = useWindowDimensions();
  const { accent } = useSettings();
  const p1 = useSharedValue(0);
  const p2 = useSharedValue(0);

  useEffect(() => {
    p1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 9000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    p2.value = withRepeat(
      withTiming(1, { duration: 13000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [p1, p2]);

  const isOnyx = accent.key === 'onyx';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.bg }]} />
      {!isOnyx && (
        <>
          <GlowBlob anim={p1} fromColor={accent.from} width={width} height={height} size={width * 0.95} gradientId="auraG1" opacity={0.4} />
          <GlowBlob anim={p2} fromColor={accent.to} width={width} height={height} size={width * 0.85} gradientId="auraG2" opacity={0.3} />
        </>
      )}
    </View>
  );
}
