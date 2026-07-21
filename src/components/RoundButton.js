import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { COLORS, FONT_BOLD } from '../theme';
import { useSettings } from '../context/SettingsContext';

export default function RoundButton({ label, onPress, variant = 'primary', style, compact, disabled }) {
  const { accent } = useSettings();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const pressIn = () => {
    scale.value = withSpring(0.92, { damping: 16, stiffness: 280 });
  };
  const pressOut = () => {
    scale.value = withSpring(1, { damping: 16, stiffness: 280 });
  };

  const isPrimary = variant === 'primary';
  const height = compact ? 52 : 62;
  const minW = compact ? 100 : 140;

  return (
    <Animated.View style={[animatedStyle, style, disabled && { opacity: 0.4 }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={disabled ? undefined : onPress}
        onPressIn={disabled ? undefined : pressIn}
        onPressOut={disabled ? undefined : pressOut}
        disabled={disabled}
      >
        {isPrimary ? (
          <View
            style={[
              styles.btn,
              { height, minWidth: minW, backgroundColor: accent.from },
            ]}
          >
            <Text style={[styles.label, { color: '#07070B' }]}>{label}</Text>
          </View>
        ) : (
          <View style={[styles.glassWrap, { height, minWidth: minW }]}>
            <BlurView intensity={25} tint="dark" style={styles.blurFill}>
              <Text style={[styles.label, { color: COLORS.text }]}>
                {label}
              </Text>
            </BlurView>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 28,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5EEAD4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  glassWrap: {
    borderRadius: 100,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  blurFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  label: {
    fontFamily: FONT_BOLD,
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
