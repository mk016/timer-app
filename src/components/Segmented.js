import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, FONT_SEMIBOLD } from '../theme';

const PAD = 4;

export default function Segmented({ options, value, onChange, style }) {
  const [w, setW] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.key === value));
  const itemW = w > 0 ? (w - PAD * 2) / options.length : 0;

  return (
    <View style={[styles.wrap, style]} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {itemW > 0 && <View style={[styles.pill, { width: itemW, transform: [{ translateX: index * itemW }] }]} />}
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} style={styles.item}>
            <Text style={[styles.label, { color: active ? COLORS.text : COLORS.textDim }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: COLORS.border,
    borderRadius: 100,
    padding: PAD,
  },
  pill: {
    position: 'absolute',
    left: PAD,
    top: PAD,
    bottom: PAD,
    borderRadius: 100,
    backgroundColor: COLORS.card,
    shadowColor: '#6B4F3F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  item: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 100,
    alignItems: 'center',
  },
  label: {
    fontFamily: FONT_SEMIBOLD,
    fontSize: 13,
  },
});
