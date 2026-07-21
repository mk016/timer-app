import { View, Text, StyleSheet } from 'react-native';
import ScrollWheel from './ScrollWheel';
import { COLORS, FONT_MEDIUM } from '../theme';

export default function TimePicker({ value, onChange }) {
  const set = (key, v) => onChange({ ...value, [key]: v });
  return (
    <View style={styles.row}>
      <ScrollWheel label="H" value={value.h} min={0} max={23} onChange={(v) => set('h', v)} />
      <Text style={styles.colon}>:</Text>
      <ScrollWheel label="M" value={value.m} min={0} max={59} onChange={(v) => set('m', v)} />
      <Text style={styles.colon}>:</Text>
      <ScrollWheel label="S" value={value.s} min={0} max={59} onChange={(v) => set('s', v)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colon: {
    fontSize: 34,
    color: COLORS.textDim,
    fontFamily: FONT_MEDIUM,
    marginBottom: 4,
  },
});
