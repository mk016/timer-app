import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT_BOLD, FONT_MEDIUM, FONT_SEMIBOLD } from '../theme';
import { useStore } from '../context/StoreContext';
import { ANIMALS, findItem } from '../data/catalog';
import Icon, { ItemIcon } from '../components/Icon';

// Steps by calendar days rather than a fixed 24h so DST changes never skip or repeat a day
const addDays = (t, n) => {
  const d = new Date(t);
  d.setDate(d.getDate() + n);
  return d.getTime();
};
const dayKey = (t) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
const startOfDay = (t) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const fmtMinutes = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);

function computeStats(history) {
  const done = history.filter((h) => h.completed);
  const byDay = {};
  for (const h of done) byDay[dayKey(h.start)] = (byDay[dayKey(h.start)] || 0) + h.minutes;

  const today = startOfDay(Date.now());
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const t = addDays(today, -i);
    week.push({
      label: new Date(t).toLocaleDateString(undefined, { weekday: 'narrow' }),
      minutes: byDay[dayKey(t)] || 0,
      isToday: i === 0,
    });
  }

  // Streak counts back from today, or from yesterday if nothing has been done yet today
  let streak = 0;
  let cursor = byDay[dayKey(today)] ? today : addDays(today, -1);
  while (byDay[dayKey(cursor)]) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return {
    todayMin: byDay[dayKey(today)] || 0,
    totalMin: done.reduce((s, h) => s + h.minutes, 0),
    sessions: done.length,
    givenUp: history.length - done.length,
    streak,
    week,
  };
}

function GrowBar({ pct, color }) {
  return <View style={[styles.bar, { height: `${Math.round(pct * 100)}%`, backgroundColor: color }]} />;
}

function StatTile({ label, value, format, icon, tint }) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: `${tint}22` }]}>
        <Icon name={icon} size={20} color={tint} />
      </View>
      <Text style={styles.tileValue}>{format ? format(value) : value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const { history } = useStore();
  const insets = useSafeAreaInsets();
  const stats = useMemo(() => computeStats(history), [history]);
  const maxWeek = Math.max(30, ...stats.week.map((d) => d.minutes));

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Your progress</Text>

      <View style={styles.tiles}>
        <StatTile icon="sun" tint={COLORS.gold} label="Today" value={stats.todayMin} format={fmtMinutes} />
        <StatTile icon="flame" tint={COLORS.accent} label="Day streak" value={stats.streak} />
        <StatTile icon="timer" tint={COLORS.sage} label="All time" value={stats.totalMin} format={fmtMinutes} />
        <StatTile icon="gift" tint="#7B6FB0" label="Sessions" value={stats.sessions} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Last 7 days</Text>
        <View style={styles.chart}>
          {stats.week.map((d, i) => (
            <View key={i} style={styles.barCol}>
              <Text style={styles.barValue}>{d.minutes > 0 ? d.minutes : ''}</Text>
              <View style={styles.barTrack}>
                <GrowBar
                  pct={d.minutes > 0 ? Math.max(0.04, d.minutes / maxWeek) : 0}
                  color={d.isToday ? COLORS.accent : COLORS.sage}
                />
              </View>
              <Text style={[styles.barLabel, d.isToday && { color: COLORS.text }]}>{d.label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.chartNote}>Minutes of completed focus per day</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent sessions</Text>
        {history.length === 0 ? (
          <Text style={styles.emptyText}>Your focus timeline will show up here.</Text>
        ) : (
          history.slice(0, 30).map((h, i) => {
            const it = findItem(h.item);
            const who = ANIMALS.find((a) => a.key === h.animal);
            return (
              <View key={h.id} style={styles.row}>
                <View style={styles.rowIcon}>
                  {it ? <ItemIcon name={it.key} size={28} /> : <Icon name={h.completed ? 'check' : 'trash'} size={22} color={h.completed ? COLORS.sage : COLORS.textFaint} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>
                    {h.completed ? `${h.minutes} min focus` : `Gave up after ${h.minutes} min`}
                  </Text>
                  <Text style={styles.rowSub}>
                    {new Date(h.start).toLocaleString(undefined, {
                      weekday: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                    {who ? ` · with ${who.name}` : ''}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 130, width: '100%', maxWidth: 560, alignSelf: 'center' },
  title: { fontFamily: FONT_BOLD, fontSize: 28, color: COLORS.text, marginBottom: 14 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  tile: { flexGrow: 1, flexBasis: '45%', backgroundColor: COLORS.card, borderRadius: 20, padding: 14 },
  tileIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileValue: { fontFamily: FONT_BOLD, fontSize: 24, color: COLORS.text, marginTop: 4 },
  tileLabel: { fontFamily: FONT_MEDIUM, fontSize: 12, color: COLORS.textDim },
  card: { backgroundColor: COLORS.card, borderRadius: 22, padding: 16, marginBottom: 14 },
  cardTitle: { fontFamily: FONT_SEMIBOLD, fontSize: 16, color: COLORS.text, marginBottom: 12 },
  chart: { flexDirection: 'row', height: 160, gap: 8 },
  barCol: { flex: 1, alignItems: 'center' },
  barValue: { fontFamily: FONT_MEDIUM, fontSize: 10, color: COLORS.textDim, height: 16 },
  barTrack: { flex: 1, width: '70%', backgroundColor: COLORS.cardSoft, borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 8 },
  barLabel: { fontFamily: FONT_SEMIBOLD, fontSize: 12, color: COLORS.textFaint, marginTop: 6 },
  chartNote: { fontFamily: FONT_MEDIUM, fontSize: 11, color: COLORS.textFaint, marginTop: 10 },
  emptyText: { fontFamily: FONT_MEDIUM, fontSize: 14, color: COLORS.textDim },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  rowIcon: { width: 32, alignItems: 'center' },
  rowTitle: { fontFamily: FONT_SEMIBOLD, fontSize: 14, color: COLORS.text },
  rowSub: { fontFamily: FONT_MEDIUM, fontSize: 12, color: COLORS.textDim },
});
