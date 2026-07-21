import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_BOLD, FONT_MEDIUM } from '../theme';

export default function ClockDisplay({ value, sub, dim }) {
  return (
    <View style={styles.center}>
      <Text style={[styles.value, dim && styles.dim]}>{value}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: FONT_BOLD,
    fontSize: 56,
    color: COLORS.text,
    letterSpacing: 1,
  },
  dim: {
    color: COLORS.textDim,
  },
  sub: {
    fontFamily: FONT_MEDIUM,
    fontSize: 14,
    color: COLORS.textDim,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
