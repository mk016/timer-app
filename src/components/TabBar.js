import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Line, Rect, Path } from 'react-native-svg';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT_SEMIBOLD } from '../theme';
import { useSettings } from '../context/SettingsContext';

function TimerIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="13" r="8" stroke={color} strokeWidth="1.8" />
      <Line x1="12" y1="13" x2="12" y2="8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="9" y1="3" x2="15" y2="3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function StopwatchIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="13" r="8" stroke={color} strokeWidth="1.8" />
      <Line x1="12" y1="13" x2="15" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M12 3V1" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function PresetsIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="2" stroke={color} strokeWidth="1.8" />
      <Rect x="14" y="3" width="7" height="7" rx="2" stroke={color} strokeWidth="1.8" />
      <Rect x="3" y="14" width="7" height="7" rx="2" stroke={color} strokeWidth="1.8" />
      <Rect x="14" y="14" width="7" height="7" rx="2" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function SettingsIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
      <Path
        d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

const TABS = [
  { key: 'timer', label: 'Timer', Icon: TimerIcon },
  { key: 'stopwatch', label: 'Stopwatch', Icon: StopwatchIcon },
  { key: 'presets', label: 'Presets', Icon: PresetsIcon },
  { key: 'settings', label: 'Settings', Icon: SettingsIcon },
];

export default function TabBar({ active, onChange }) {
  const { accent } = useSettings();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const index = TABS.findIndex((t) => t.key === active);
  const tabWidth = (width - 40) / TABS.length;
  const pillX = useSharedValue(index * tabWidth);

  // Keep the pill aligned when the screen rotates / resizes or the tab changes externally
  useEffect(() => {
    pillX.value = index * tabWidth;
  }, [index, tabWidth, pillX]);

  const animatedPill = useAnimatedStyle(() => {
    return { transform: [{ translateX: withSpring(pillX.value, { damping: 20, stiffness: 180 }) }] };
  });

  return (
    <View style={[styles.wrapper, { marginBottom: Math.max(insets.bottom, 8) }]}>
      <BlurView intensity={40} tint="dark" style={[styles.bar, { paddingBottom: 12 }]}>
        <Animated.View
          style={[
            styles.pill,
            { width: tabWidth - 10, backgroundColor: accent.glow },
            animatedPill,
          ]}
          pointerEvents="none"
        />
        {TABS.map(({ key, label, Icon }) => {
          const isActive = active === key;
          return (
            <TouchableOpacity
              key={key}
              activeOpacity={0.7}
              onPress={() => onChange(key)}
              style={styles.tab}
            >
              <Icon color={isActive ? accent.from : COLORS.textDim} />
              <Text style={[styles.label, { color: isActive ? accent.from : COLORS.textDim }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  bar: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: 24,
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    top: 8,
    left: 5,
    height: 52,
    borderRadius: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  label: {
    fontFamily: FONT_SEMIBOLD,
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 0.3,
  },
});
