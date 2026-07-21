import { useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SettingsProvider } from './src/context/SettingsContext';
import AuroraBackground from './src/components/AuroraBackground';
import TimerScreen from './src/screens/TimerScreen';
import StopwatchScreen from './src/screens/StopwatchScreen';
import PresetsScreen from './src/screens/PresetsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TabBar from './src/components/TabBar';
import { COLORS } from './src/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const [tab, setTab] = useState('timer');
  const [immersive, setImmersive] = useState(false);
  const pendingRef = useRef(null);

  if (!fontsLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.text} size="large" />
      </View>
    );
  }

  const startPreset = (seconds) => {
    pendingRef.current = seconds;
    setTab('timer');
  };

  return (
    <SettingsProvider>
      <View style={styles.container}>
        <AuroraBackground />
        <StatusBar style="light" />
        <View style={styles.screen}>
          {tab === 'timer' && <TimerScreen pendingRef={pendingRef} onImmersive={setImmersive} />}
          {tab === 'stopwatch' && <StopwatchScreen />}
          {tab === 'presets' && <PresetsScreen onStartPreset={startPreset} />}
          {tab === 'settings' && <SettingsScreen />}
        </View>
        {!immersive && <TabBar active={tab} onChange={setTab} />}
      </View>
    </SettingsProvider>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
});
