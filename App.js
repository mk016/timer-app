import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsProvider } from './src/context/SettingsContext';
import AuroraBackground from './src/components/AuroraBackground';
import TimerScreen from './src/screens/TimerScreen';
import StopwatchScreen from './src/screens/StopwatchScreen';
import PresetsScreen from './src/screens/PresetsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TabBar from './src/components/TabBar';
import { COLORS } from './src/theme';

const TABS = ['timer', 'stopwatch', 'presets', 'settings'];

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const [tab, setTab] = useState('timer');
  const [immersive, setImmersive] = useState(false);
  // Once a tab is opened it stays mounted so running timers/stopwatches/laps survive tab switches
  const [visited, setVisited] = useState({ timer: true });
  const [presetRequest, setPresetRequest] = useState(null);

  useEffect(() => {
    setVisited((v) => (v[tab] ? v : { ...v, [tab]: true }));
  }, [tab]);

  if (!fontsLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.text} size="large" />
      </View>
    );
  }

  const startPreset = (seconds) => {
    setPresetRequest({ seconds, key: Date.now() });
    setTab('timer');
  };

  const renderScreen = (key) => {
    switch (key) {
      case 'timer':
        return <TimerScreen presetRequest={presetRequest} onImmersive={setImmersive} />;
      case 'stopwatch':
        return <StopwatchScreen />;
      case 'presets':
        return <PresetsScreen onStartPreset={startPreset} />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <View style={styles.container}>
          <AuroraBackground />
          <StatusBar style="light" />
          <View style={styles.screen}>
            {TABS.map((key) =>
              visited[key] ? (
                <View key={key} style={tab === key ? styles.visible : styles.hidden}>
                  {renderScreen(key)}
                </View>
              ) : null
            )}
          </View>
          {!immersive && <TabBar active={tab} onChange={setTab} />}
        </View>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  screen: {
    flex: 1,
  },
  visible: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
});
