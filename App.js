import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from './src/context/StoreContext';
import FocusScreen from './src/screens/FocusScreen';
import ShopScreen from './src/screens/ShopScreen';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TabBar from './src/components/TabBar';
import Onboarding from './src/components/Onboarding';
import { COLORS } from './src/theme';

function Shell() {
  const { ready, animal, settings, setSetting } = useStore();
  const [tab, setTab] = useState('focus');
  const [focusing, setFocusing] = useState(false);

  const changeTab = (next) => {
    if (next === tab) return;
    setTab(next);
  };

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {/* Focus stays mounted so a running session survives tab switches */}
      <View style={tab === 'focus' ? styles.fill : styles.hidden}>
        <FocusScreen onBusy={setFocusing} />
      </View>
      {tab !== 'focus' && (
        <View key={tab} style={styles.fill}>
          {tab === 'shop' && <ShopScreen />}
          {tab === 'stats' && <StatsScreen />}
          {tab === 'settings' && <SettingsScreen />}
        </View>
      )}
      {!focusing && <TabBar active={tab} onChange={changeTab} />}
      {!settings.onboarded && <Onboarding animal={animal} onDone={() => setSetting('onboarded', true)} />}
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    // Only the weights we use, so the others aren't bundled
    Fredoka_400Regular: require('@expo-google-fonts/fredoka/400Regular/Fredoka_400Regular.ttf'),
    Fredoka_500Medium: require('@expo-google-fonts/fredoka/500Medium/Fredoka_500Medium.ttf'),
    Fredoka_600SemiBold: require('@expo-google-fonts/fredoka/600SemiBold/Fredoka_600SemiBold.ttf'),
    Fredoka_700Bold: require('@expo-google-fonts/fredoka/700Bold/Fredoka_700Bold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  fill: { flex: 1 },
  hidden: { display: 'none' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
});
