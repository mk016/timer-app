import { useEffect, useId } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, withTiming, useAnimatedProps } from 'react-native-reanimated';
import { COLORS } from '../theme';
import { useSettings } from '../context/SettingsContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ProgressRing({
  progress = 0,
  size = 300,
  strokeWidth = 16,
}) {
  const { accent } = useSettings();
  const gradientId = useId();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progressSv = useSharedValue(progress);

  useEffect(() => {
    progressSv.value = withTiming(progress, { duration: 400 });
  }, [progress, progressSv]);

  const animatedProps = useAnimatedProps(() => {
    const p = Math.min(1, Math.max(0, progressSv.value));
    return { strokeDashoffset: circumference * (1 - p) };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={accent.from} />
            <Stop offset="100%" stopColor={accent.to} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={COLORS.ringTrack} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={accent.glow}
          strokeWidth={strokeWidth + 14}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          opacity={0.5}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
}
