import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS, FONT_BOLD, SHADOW } from '../theme';

// variant: 'primary' | 'secondary' | 'ghost'
export default function RoundButton({ label, onPress, onLongPress, variant = 'primary', style, compact, disabled }) {
  const variantStyle = styles[variant];
  const labelColor = variant === 'primary' ? '#FFFFFF' : variant === 'ghost' ? COLORS.textDim : COLORS.text;

  return (
    <View style={[style, disabled && { opacity: 0.4 }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        style={[styles.btn, { height: compact ? 48 : 58, minWidth: compact ? 96 : 140 }, variantStyle]}
      >
        <Text style={[styles.label, { color: labelColor, fontSize: compact ? 15 : 17 }]}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 26,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: COLORS.accent,
    ...SHADOW,
  },
  secondary: {
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  label: {
    fontFamily: FONT_BOLD,
    letterSpacing: 0.2,
  },
});
