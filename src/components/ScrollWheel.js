import { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT_BOLD } from '../theme';
import { useSettings } from '../context/SettingsContext';

const ITEM_H = 52;
const VISIBLE = 5;

export default function ScrollWheel({ value, min, max, onChange }) {
  const count = max - min + 1;
  const items = Array.from({ length: count }, (_, i) => min + i);
  const selectedIndex = Math.min(count - 1, Math.max(0, value - min));
  const scrollRef = useRef(null);
  const { accent } = useSettings();

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const settleAtOffset = (offset) => {
    let idx = Math.round(offset / ITEM_H);
    idx = Math.min(count - 1, Math.max(0, idx));
    const newVal = min + idx;
    if (newVal !== value) onChange(newVal);
    scrollRef.current?.scrollTo({ y: idx * ITEM_H, animated: true });
  };

  const handleEnd = (e) => {
    settleAtOffset(e.nativeEvent.contentOffset.y);
  };

  // Slow drags (no fling) never trigger onMomentumScrollEnd — settle them here
  const handleDragEnd = (e) => {
    const vy = e.nativeEvent.velocity?.y ?? 0;
    if (Math.abs(vy) < 0.05) {
      settleAtOffset(e.nativeEvent.contentOffset.y);
    }
  };

  return (
    <View style={[styles.wheel, { height: ITEM_H * VISIBLE }]}>
      <ScrollView
        ref={scrollRef}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleEnd}
        onScrollEndDrag={handleDragEnd}
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
      >
        {items.map((v) => (
          <View key={v} style={[styles.item, { height: ITEM_H }]}>
            <Text style={styles.itemText}>{String(v).padStart(2, '0')}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={[styles.band, { borderColor: COLORS.glassBorder, backgroundColor: COLORS.glass }]} pointerEvents="none" />
      <LinearGradient
        colors={[COLORS.bg, 'rgba(0,0,0,0)']}
        style={styles.fadeTop}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', COLORS.bg]}
        style={styles.fadeBottom}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wheel: {
    width: 72,
    position: 'relative',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontFamily: FONT_BOLD,
    fontSize: 28,
    color: COLORS.textDim,
  },
  band: {
    position: 'absolute',
    top: ITEM_H * 2,
    left: 4,
    right: 4,
    height: ITEM_H,
    borderRadius: 16,
    borderWidth: 1,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_H * 2,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_H * 2,
  },
});
