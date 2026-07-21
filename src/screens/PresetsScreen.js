import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Platform, KeyboardAvoidingView } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePresets } from '../hooks/usePresets';
import PresetCard from '../components/PresetCard';
import TimePicker from '../components/TimePicker';
import RoundButton from '../components/RoundButton';
import { hmsToSeconds } from '../utils/format';
import { COLORS, FONT_BOLD, FONT_MEDIUM, FONT_SEMIBOLD } from '../theme';
import { useSettings } from '../context/SettingsContext';
import { buzzImpact } from '../lib/notifications';

export default function PresetsScreen({ onStartPreset }) {
  const { accent } = useSettings();
  const insets = useSafeAreaInsets();
  const { presets, addPreset, removePreset } = usePresets();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [draft, setDraft] = useState({ h: 0, m: 10, s: 0 });

  const openModal = () => {
    setName('');
    setDraft({ h: 0, m: 10, s: 0 });
    setModalVisible(true);
  };

  const savePreset = () => {
    const seconds = hmsToSeconds(draft);
    if (seconds <= 0) return;
    const finalName = name.trim() || 'Timer';
    addPreset({ id: `custom_${Date.now()}`, name: finalName, seconds });
    setModalVisible(false);
    buzzImpact();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Presets</Text>
        <TouchableOpacity activeOpacity={0.8} onPress={openModal} style={styles.addBtnWrap}>
          <BlurView intensity={25} tint="dark" style={styles.addBtn}>
            <Text style={[styles.addText, { color: accent.from }]}>+ New</Text>
          </BlurView>
        </TouchableOpacity>
      </View>

      {presets.length > 0 ? (
        <ScrollView contentContainerStyle={styles.list}>
          {presets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              onPress={() => onStartPreset(preset.seconds)}
              onDelete={() => removePreset(preset.id)}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No presets added</Text>
          <Text style={styles.emptySub}>Tap "+ New" above to save your custom timers.</Text>
        </View>
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.overlay}>
            <View style={styles.sheetWrap}>
              <BlurView intensity={40} tint="dark" style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}>
                <Text style={styles.sheetTitle}>New Preset</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    placeholder="Name (e.g. Meditation)"
                    placeholderTextColor={COLORS.textFaint}
                    value={name}
                    onChangeText={setName}
                    maxLength={40}
                    returnKeyType="done"
                  />
                </View>
                <TimePicker value={draft} onChange={setDraft} />
                <View style={styles.sheetActions}>
                  <RoundButton label="Cancel" variant="glass" onPress={() => setModalVisible(false)} compact />
                  <RoundButton label="Save" variant="primary" onPress={savePreset} compact />
                </View>
              </BlurView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontFamily: FONT_BOLD,
    fontSize: 30,
    color: COLORS.text,
  },
  addBtnWrap: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  addBtn: {
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  addText: {
    fontFamily: FONT_SEMIBOLD,
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: 60,
  },
  emptyTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: FONT_MEDIUM,
    fontSize: 14,
    color: COLORS.textDim,
    textAlign: 'center',
    lineHeight: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  sheet: {
    padding: 24,
    paddingBottom: 40,
  },
  sheetTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 22,
    color: COLORS.text,
    marginBottom: 18,
  },
  inputWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 18,
  },
  input: {
    backgroundColor: COLORS.glass,
    paddingHorizontal: 18,
    height: 54,
    color: COLORS.text,
    fontFamily: FONT_MEDIUM,
    fontSize: 16,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
});
