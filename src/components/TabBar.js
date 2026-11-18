import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT_SEMIBOLD, SHADOW } from '../theme';

function FocusIcon({ color }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="13" r="8" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="13" x2="12" y2="9" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="3" x2="15" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ShopIcon({ color }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="7" cy="6" r="2.2" stroke={color} strokeWidth="2" />
      <Circle cx="17" cy="6" r="2.2" stroke={color} strokeWidth="2" />
      <Circle cx="3.8" cy="11.5" r="2" stroke={color} strokeWidth="2" />
      <Circle cx="20.2" cy="11.5" r="2" stroke={color} strokeWidth="2" />
      <Path d="M12 11c-3.5 0-6 4.5-6 7 0 2 2 2.5 3.5 2 1-.3 1.7-.6 2.5-.6s1.5.3 2.5.6c1.5.5 3.5 0 3.5-2 0-2.5-2.5-7-6-7Z" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function StatsIcon({ color }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="12" width="4" height="8" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="10" y="6" width="4" height="14" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="16" y="9" width="4" height="11" rx="1.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function SettingsIcon({ color }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path
        d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export const TABS = [
  { key: 'focus', label: 'Focus', Icon: FocusIcon },
  { key: 'shop', label: 'Shop', Icon: ShopIcon },
  { key: 'stats', label: 'Stats', Icon: StatsIcon },
  { key: 'settings', label: 'Settings', Icon: SettingsIcon },
];

function Tab({ tab, on, onPress }) {
  const color = on ? COLORS.accent : COLORS.textFaint;
  const { Icon } = tab;
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.tab}>
      <Icon color={color} />
      <Text style={[styles.label, { color }]}>{tab.label}</Text>
    </TouchableOpacity>
  );
}

export default function TabBar({ active, onChange }) {
  const insets = useSafeAreaInsets();
  const [barW, setBarW] = useState(0);
  const index = TABS.findIndex((t) => t.key === active);
  const tabW = barW / TABS.length;

  return (
    <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.bar, SHADOW]} onLayout={(e) => setBarW(e.nativeEvent.layout.width)}>
        {barW > 0 && <View style={[styles.pill, { width: tabW - 12, transform: [{ translateX: index * tabW }] }]} />}
        {TABS.map((t) => (
          <Tab key={t.key} tab={t} on={active === t.key} onPress={() => onChange(t.key)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 28,
    paddingVertical: 10,
  },
  pill: {
    position: 'absolute',
    left: 6,
    top: 6,
    bottom: 6,
    borderRadius: 22,
    backgroundColor: COLORS.accentSoft,
    opacity: 0.6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: FONT_SEMIBOLD,
    fontSize: 11,
    marginTop: 2,
  },
});
