import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, FONT_BOLD, FONT_MEDIUM } from '../theme';
import { useSettings } from '../context/SettingsContext';
import { formatPresetDuration } from '../utils/format';

export default function PresetCard({ preset, onPress, onDelete }) {
  const { accent } = useSettings();
  return (
    <View style={styles.cardWrap}>
      <BlurView intensity={20} tint="dark" style={styles.card}>
        <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.tap}>
          <View style={[styles.dot, { backgroundColor: accent.from, shadowColor: accent.from }]} />
          <View style={styles.body}>
            <Text style={styles.name}>{preset.name}</Text>
            <Text style={styles.duration}>{formatPresetDuration(preset.seconds)}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} onPress={onDelete} hitSlop={12} style={styles.delete}>
          <Text style={styles.deleteText}>×</Text>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  tap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  body: {
    flex: 1,
  },
  name: {
    fontFamily: FONT_BOLD,
    fontSize: 17,
    color: COLORS.text,
  },
  duration: {
    fontFamily: FONT_MEDIUM,
    fontSize: 13,
    color: COLORS.textDim,
    marginTop: 3,
  },
  delete: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteText: {
    fontSize: 26,
    color: COLORS.textDim,
    lineHeight: 26,
  },
});
