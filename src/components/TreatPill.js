import { Text, StyleSheet, View } from 'react-native';
import { COLORS, FONT_BOLD } from '../theme';
import { TreatIcon } from './Icon';

export default function TreatPill({ amount, style }) {
  return (
    <View style={[styles.pill, style]}>
      <TreatIcon size={20} />
      <Text style={styles.text}>{amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: { fontFamily: FONT_BOLD, fontSize: 17, color: COLORS.text },
});
