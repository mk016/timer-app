import { View, Text, StyleSheet, FlatList } from 'react-native';
import { BlurView } from 'expo-blur';
import { useStopwatch } from '../hooks/useStopwatch';
import RoundButton from '../components/RoundButton';
import { formatLap } from '../utils/format';
import { COLORS, FONT_BOLD, FONT_MEDIUM } from '../theme';
import { useSettings } from '../context/SettingsContext';
import { buzzImpact } from '../lib/notifications';

export default function StopwatchScreen() {
  const { accent } = useSettings();
  const { elapsed, isRunning, laps, start, pause, reset, lap } = useStopwatch();

  const handleStartPause = () => {
    buzzImpact();
    if (isRunning) pause();
    else start();
  };

  const handleReset = () => {
    buzzImpact('light');
    reset();
  };

  return (
    <View style={styles.container}>
      <View style={styles.display}>
        <Text style={[styles.time, { color: accent.from }]}>{formatLap(elapsed)}</Text>
        <Text style={styles.tag}>{isRunning ? '● Running' : elapsed > 0 ? '❚❚ Paused' : 'Ready'}</Text>
      </View>

      <View style={styles.controls}>
        <RoundButton
          label={isRunning ? 'Pause' : 'Start'}
          variant="primary"
          onPress={handleStartPause}
        />
        <View style={styles.row}>
          <RoundButton label="Lap" variant="glass" onPress={lap} compact />
          <View style={{ width: 12 }} />
          <RoundButton label="Reset" variant="glass" onPress={handleReset} compact />
        </View>
      </View>

      {laps.length > 0 ? (
        <FlatList
          data={[...laps].reverse()}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.lapRow}>
              <Text style={styles.lapIndex}>Lap {item.id}</Text>
              <Text style={[styles.lapTime, { color: accent.from }]}>{formatLap(item.split)}</Text>
              <Text style={styles.lapTotal}>{formatLap(item.total)}</Text>
            </View>
          )}
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Tap Lap to record splits</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
  },
  display: {
    alignItems: 'center',
    marginBottom: 36,
  },
  time: {
    fontFamily: FONT_BOLD,
    fontSize: 52,
    color: COLORS.text,
    letterSpacing: 2,
  },
  tag: {
    fontFamily: FONT_MEDIUM,
    fontSize: 13,
    color: COLORS.textDim,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  controls: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    marginTop: 14,
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  lapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.glassBorder,
  },
  lapIndex: {
    fontFamily: FONT_MEDIUM,
    fontSize: 14,
    color: COLORS.textDim,
    width: 70,
  },
  lapTime: {
    fontFamily: FONT_BOLD,
    fontSize: 17,
    color: COLORS.text,
    flex: 1,
  },
  lapTotal: {
    fontFamily: FONT_MEDIUM,
    fontSize: 15,
    color: COLORS.textDim,
  },
  empty: {
    marginTop: 30,
  },
  emptyText: {
    fontFamily: FONT_MEDIUM,
    fontSize: 14,
    color: COLORS.textFaint,
  },
});
