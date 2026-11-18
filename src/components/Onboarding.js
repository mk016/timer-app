import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Critter from './Critter';
import RoundButton from './RoundButton';
import Icon, { ItemIcon } from './Icon';
import { COLORS, FONT_BOLD, FONT_MEDIUM, FONT_SEMIBOLD, SHADOW } from '../theme';
import { buzzImpact } from '../lib/notifications';

function Dot({ on }) {
  return <View style={[styles.dot, { width: on ? 22 : 8, opacity: on ? 1 : 0.35 }]} />;
}

// Small badge floating around the critter: a line icon ({ icon, color }) or a collectible ({ item })
function Orbit({ badge, angle, r }) {
  const x = Math.cos(angle) * r;
  const y = Math.sin(angle) * r;
  return (
    <View style={[styles.orbitSpot, SHADOW, { transform: [{ translateX: x }, { translateY: y }] }]}>
      {badge.item ? <ItemIcon name={badge.item} size={28} /> : <Icon name={badge.icon} size={24} color={badge.color} />}
    </View>
  );
}

/** First-launch walkthrough. Calls onDone once the player has seen it (or skipped). */
export default function Onboarding({ animal, onDone }) {
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const [pokeKey, setPokeKey] = useState(0);

  const PAGES = [
    {
      mood: 'happy',
      title: `Meet ${animal.name}!`,
      body: `Your little focus buddy. Tap ${animal.name} any time to say hi.`,
      extras: [{ icon: 'heart', color: '#F0627A' }, { icon: 'sparkle', color: '#F2B53A' }, { icon: 'paw', color: '#B07D57' }],
    },
    {
      mood: 'sleep',
      title: 'Focus together',
      body: `Start a session and ${animal.name} naps while you work. Give up early and they’ll be sad…`,
      extras: [{ icon: 'timer', color: COLORS.accent }, { icon: 'book', color: COLORS.sage }, { icon: 'moon', color: '#7B6FB0' }],
    },
    {
      mood: 'idle',
      title: 'Earn gifts & treats',
      body: `Finish a session and ${animal.name} brings you a gift plus treats to unlock new friends, chairs and rooms.`,
      extras: [{ item: 'gift' }, { item: 'treat' }, { item: 'flower' }, { item: 'gem' }],
    },
  ];
  const p = PAGES[page];
  const last = page === PAGES.length - 1;

  const next = () => {
    buzzImpact('light');
    if (last) onDone();
    else setPage((n) => n + 1);
  };

  return (
    <View style={[styles.overlay, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.top}>
        {!last && (
          <Pressable onPress={onDone} hitSlop={12}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        )}
      </View>

      <View key={page} style={styles.page}>
        <Pressable
          onPress={() => {
            buzzImpact('light');
            setPokeKey((k) => k + 1);
          }}
          style={styles.stage}
        >
          <View style={styles.halo} />
          {p.extras.map((e, i) => (
            <Orbit key={i} badge={e} angle={-Math.PI * 0.85 + (i / Math.max(1, p.extras.length - 1)) * Math.PI * 0.7} r={128} />
          ))}
          <Critter animal={animal} mood={p.mood} size={190} pokeKey={pokeKey} />
        </Pressable>
        <Text style={styles.title}>{p.title}</Text>
        <Text style={styles.body}>{p.body}</Text>
      </View>

      <View style={styles.dots}>
        {PAGES.map((_, i) => (
          <Dot key={i} on={i === page} />
        ))}
      </View>
      <RoundButton label={last ? 'Let’s focus!' : 'Next'} onPress={next} style={styles.cta} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.bg, paddingHorizontal: 24, zIndex: 50 },
  top: { height: 28, alignItems: 'flex-end' },
  skip: { fontFamily: FONT_SEMIBOLD, fontSize: 15, color: COLORS.textDim },
  page: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stage: { width: 300, height: 280, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 230, height: 230, borderRadius: 115, backgroundColor: COLORS.accentSoft, opacity: 0.55 },
  orbitSpot: { position: 'absolute', width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FONT_BOLD, fontSize: 28, color: COLORS.text, marginTop: 18, textAlign: 'center' },
  body: { fontFamily: FONT_MEDIUM, fontSize: 16, lineHeight: 23, color: COLORS.textDim, marginTop: 8, textAlign: 'center', maxWidth: 340 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 18 },
  dot: { height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  cta: { alignSelf: 'center', width: '100%', maxWidth: 420, ...SHADOW },
});
