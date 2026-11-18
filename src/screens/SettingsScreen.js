import { useEffect, useRef } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import PressableScale from '../components/PressableScale';
import Icon from '../components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT_BOLD, FONT_MEDIUM, FONT_SEMIBOLD } from '../theme';
import { useStore } from '../context/StoreContext';
import { AMBIENTS, setAmbientVolume, startAmbient, stopAmbient } from '../lib/audio';
import { buzzImpact } from '../lib/notifications';

function Stepper({ value, min, max, step = 1, suffix, onChange }) {
  const set = (v) => {
    buzzImpact('light');
    onChange(Math.min(max, Math.max(min, v)));
  };
  return (
    <View style={styles.stepper}>
      <PressableScale style={styles.stepBtn} onPress={() => set(value - step)} disabled={value <= min}>
        <Text style={[styles.stepText, value <= min && { color: COLORS.textFaint }]}>−</Text>
      </PressableScale>
      <View style={styles.stepValueWrap}>
        <Text key={value} style={styles.stepValue}>
          {value}
          {suffix}
        </Text>
      </View>
      <PressableScale style={styles.stepBtn} onPress={() => set(value + step)} disabled={value >= max}>
        <Text style={[styles.stepText, value >= max && { color: COLORS.textFaint }]}>+</Text>
      </PressableScale>
    </View>
  );
}

function VolumeBar({ level, on, onPress }) {
  return (
    <PressableScale onPress={onPress} hitSlop={{ top: 12, bottom: 12, left: 3, right: 3 }}>
      <View style={[styles.volBar, on && { backgroundColor: COLORS.accent }, { height: on ? 10 + level * 20 : 8 + level * 18 }]} />
    </PressableScale>
  );
}

function Row({ label, sub, children, last }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const { settings, setSetting, resetProgress } = useStore();
  const insets = useSafeAreaInsets();
  const previewTimer = useRef(null);

  // Short preview so people can hear what they picked; a newer preview cancels the old stop timer
  const preview = (key, volume) => {
    clearTimeout(previewTimer.current);
    if (key === 'off') {
      stopAmbient();
      return;
    }
    startAmbient(key, volume);
    previewTimer.current = setTimeout(stopAmbient, 2500);
  };

  useEffect(
    () => () => {
      clearTimeout(previewTimer.current);
      stopAmbient();
    },
    []
  );

  const pickAmbient = (key) => {
    buzzImpact('light');
    setSetting('ambient', key);
    preview(key, settings.ambientVolume);
  };

  const pickVolume = (v) => {
    buzzImpact('light');
    setSetting('ambientVolume', v);
    setAmbientVolume(v);
    preview(settings.ambient, v);
  };

  const volumes = [0.2, 0.4, 0.6, 0.8, 1];

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.section}>Timer</Text>
      <View style={styles.card}>
        <Row label="Focus length">
          <Stepper value={settings.focusMin} min={5} max={180} step={5} suffix="m" onChange={(v) => setSetting('focusMin', v)} />
        </Row>
        <Row label="Short break">
          <Stepper value={settings.breakMin} min={1} max={30} suffix="m" onChange={(v) => setSetting('breakMin', v)} />
        </Row>
        <Row label="Long break">
          <Stepper value={settings.longBreakMin} min={5} max={60} step={5} suffix="m" onChange={(v) => setSetting('longBreakMin', v)} />
        </Row>
        <Row label="Long break every" sub="Completed sessions">
          <Stepper value={settings.longBreakEvery} min={2} max={8} onChange={(v) => setSetting('longBreakEvery', v)} />
        </Row>
        <Row label="Start breaks automatically" last>
          <Switch
            value={settings.autoBreak}
            onValueChange={(v) => setSetting('autoBreak', v)}
            trackColor={{ true: COLORS.sage, false: COLORS.border }}
            thumbColor="#FFFFFF"
          />
        </Row>
      </View>

      <Text style={styles.section}>Sound</Text>
      <View style={styles.card}>
        <Row label="Chime when time's up">
          <Switch
            value={settings.soundOn}
            onValueChange={(v) => setSetting('soundOn', v)}
            trackColor={{ true: COLORS.sage, false: COLORS.border }}
            thumbColor="#FFFFFF"
          />
        </Row>
        <View style={[styles.row, styles.rowBorder, { flexDirection: 'column', alignItems: 'stretch' }]}>
          <Text style={styles.rowLabel}>Ambient sound while focusing</Text>
          <View style={styles.chips}>
            {AMBIENTS.map((a) => {
              const on = settings.ambient === a.key;
              return (
                <PressableScale key={a.key} onPress={() => pickAmbient(a.key)} style={[styles.chip, on && styles.chipOn]}>
                  <Icon name={a.icon} size={16} color={on ? '#FFFFFF' : COLORS.textDim} />
                  <Text style={[styles.chipText, on && { color: '#FFFFFF' }]}>{a.label}</Text>
                </PressableScale>
              );
            })}
          </View>
        </View>
        <Row label="Ambient volume" last>
          <View style={styles.volume}>
            {volumes.map((v) => (
              <VolumeBar key={v} level={v} on={settings.ambientVolume >= v} onPress={() => pickVolume(v)} />
            ))}
          </View>
        </Row>
      </View>

      <Text style={styles.section}>Data</Text>
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() =>
            Alert.alert('Reset all progress?', 'Treats, unlocked friends, gifts and history will be erased. This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: resetProgress },
            ])
          }
          style={styles.row}
        >
          <Text style={[styles.rowLabel, { color: COLORS.danger }]}>Reset progress</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footer}>Focus Friends · made with</Text>
        <Icon name="paw" size={13} color={COLORS.textFaint} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 130, width: '100%', maxWidth: 560, alignSelf: 'center' },
  title: { fontFamily: FONT_BOLD, fontSize: 28, color: COLORS.text, marginBottom: 6 },
  section: { fontFamily: FONT_SEMIBOLD, fontSize: 13, color: COLORS.textDim, marginTop: 16, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: COLORS.card, borderRadius: 20, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.cardSoft },
  rowLabel: { fontFamily: FONT_SEMIBOLD, fontSize: 15, color: COLORS.text },
  rowSub: { fontFamily: FONT_MEDIUM, fontSize: 12, color: COLORS.textDim },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardSoft, borderRadius: 100 },
  stepBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontFamily: FONT_BOLD, fontSize: 20, color: COLORS.text },
  stepValueWrap: { minWidth: 48, alignItems: 'center' },
  stepValue: { fontFamily: FONT_BOLD, fontSize: 15, color: COLORS.text, minWidth: 44, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100, backgroundColor: COLORS.cardSoft, borderWidth: 1.5, borderColor: COLORS.border },
  chipOn: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  chipText: { fontFamily: FONT_SEMIBOLD, fontSize: 13, color: COLORS.text },
  volume: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  volBar: { width: 12, borderRadius: 4, backgroundColor: COLORS.border },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 24 },
  footer: { fontFamily: FONT_MEDIUM, fontSize: 12, color: COLORS.textFaint, textAlign: 'center' },
});
