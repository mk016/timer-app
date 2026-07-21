import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, FONT_BOLD, FONT_MEDIUM, FONT_SEMIBOLD, ACCENTS } from '../theme';
import { useSettings } from '../context/SettingsContext';

function Toggle({ value, onToggle, accent }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onToggle}
      style={[styles.toggle, value && { backgroundColor: accent.from }]}
    >
      <View style={[styles.knob, value && styles.knobOn]} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { accent, accentKey, soundOn, fontStyle, setAccent, setSound, setFontStyle } = useSettings();

  const FONT_OPTIONS = [
    { key: 'modern', name: 'Modern' },
    { key: 'mono', name: 'Retro' },
    { key: 'classic', name: 'Classic' },
    { key: 'serif', name: 'Serif' },
    { key: 'heavy', name: 'Heavy' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>Settings</Text>

      <Text style={styles.heading}>Accent</Text>
      <View style={styles.swatches}>
        {Object.values(ACCENTS).map((a) => {
          const selected = a.key === accentKey;
          return (
            <TouchableOpacity
              key={a.key}
              activeOpacity={0.8}
              onPress={() => setAccent(a.key)}
            >
              <View style={[styles.swatchOuter, selected && { borderColor: a.from }]}>
                <BlurView intensity={20} tint="dark" style={styles.swatchInner}>
                  <View style={[styles.swatch, { backgroundColor: a.from, shadowColor: a.from }]} />
                  <Text style={[styles.swatchLabel, { color: selected ? a.from : COLORS.textDim }]}>
                    {a.name}
                  </Text>
                </BlurView>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.heading}>Typography</Text>
      <View style={styles.fontsRow}>
        {FONT_OPTIONS.map((f) => {
          const selected = f.key === fontStyle;
          return (
            <TouchableOpacity
              key={f.key}
              activeOpacity={0.8}
              onPress={() => setFontStyle(f.key)}
              style={styles.fontOptionWrapper}
            >
              <View style={[styles.fontOptionOuter, selected && { borderColor: accent.from }]}>
                <BlurView intensity={20} tint="dark" style={styles.fontOptionInner}>
                  <Text style={[styles.fontOptionLabel, { color: selected ? accent.from : COLORS.textDim }]}>
                    {f.name}
                  </Text>
                </BlurView>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={{ height: 4 }} />

      <View style={styles.cardWrap}>
        <BlurView intensity={20} tint="dark" style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Completion sound</Text>
            <Toggle value={soundOn} onToggle={() => setSound(!soundOn)} accent={accent} />
          </View>
          <Text style={styles.hint}>
            A chime plays when a timer finishes (along with haptic feedback).
          </Text>
        </BlurView>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Aura Timer · built with Expo SDK 54</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  pageTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 30,
    color: COLORS.text,
    marginBottom: 24,
  },
  heading: {
    fontFamily: FONT_BOLD,
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 14,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  swatchOuter: {
    width: 160,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    marginBottom: 12,
  },
  swatchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  swatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  swatchLabel: {
    fontFamily: FONT_SEMIBOLD,
    fontSize: 15,
  },
  cardWrap: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  card: {
    padding: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontFamily: FONT_BOLD,
    fontSize: 16,
    color: COLORS.text,
  },
  hint: {
    fontFamily: FONT_MEDIUM,
    fontSize: 13,
    color: COLORS.textDim,
    marginTop: 10,
    lineHeight: 19,
  },
  toggle: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 3,
    justifyContent: 'center',
  },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  knobOn: {
    alignSelf: 'flex-end',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: FONT_MEDIUM,
    fontSize: 12,
    color: COLORS.textFaint,
  },
  fontsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  fontOptionWrapper: {
    width: '48%',
    marginBottom: 10,
  },
  fontOptionOuter: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
  },
  fontOptionInner: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  fontOptionLabel: {
    fontFamily: FONT_SEMIBOLD,
    fontSize: 14,
  },
});
