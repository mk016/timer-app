import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoomPreview } from '../components/Scene';
import PressableScale from '../components/PressableScale';
import Critter from '../components/Critter';
import Segmented from '../components/Segmented';
import TreatPill from '../components/TreatPill';
import { ItemIcon, TreatIcon } from '../components/Icon';
import RoundButton from '../components/RoundButton';
import { COLORS, FONT_BOLD, FONT_MEDIUM, FONT_SEMIBOLD } from '../theme';
import { useStore } from '../context/StoreContext';
import { ANIMALS, CHAIRS, ROOMS, findItem } from '../data/catalog';
import { buzzComplete, buzzImpact } from '../lib/notifications';

const TABS = [
  { key: 'animals', label: 'Friends' },
  { key: 'chairs', label: 'Chairs' },
  { key: 'rooms', label: 'Rooms' },
  { key: 'gifts', label: 'Gifts' },
];
const LIST = { animals: ANIMALS, chairs: CHAIRS, rooms: ROOMS };
const SEL = { animals: 'animal', chairs: 'chair', rooms: 'room' };

function ShopCard({ width, inUse, owned, price, shortBy, onPress, children, title, sub }) {
  return (
    <View>
      <PressableScale onPress={onPress} style={[styles.card, { width }, inUse && styles.cardActive]}>
        {children}
        <Text style={styles.cardTitle} numberOfLines={1}>
          {title}
        </Text>
        {sub ? <Text style={styles.cardSub}>{sub}</Text> : null}
        <View style={[styles.tag, inUse ? styles.tagUse : owned ? styles.tagOwned : shortBy ? styles.tagShort : styles.tagBuy]}>
          {!inUse && !owned && !shortBy && <TreatIcon size={16} />}
          <Text style={[styles.tagText, { color: inUse || shortBy ? '#FFFFFF' : COLORS.text }]}>
            {inUse ? 'With you' : owned ? 'Choose' : shortBy ? `Need ${shortBy} more` : price}
          </Text>
        </View>
      </PressableScale>
    </View>
  );
}

export default function ShopScreen() {
  const store = useStore();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState('animals');
  const [celebrate, setCelebrate] = useState(null); // { kind, item }
  const [nope, setNope] = useState(null); // { key: itemKey, short, at } — card that couldn't be afforded
  const [traded, setTraded] = useState(null); // { amount, key }
  const nopeTimer = useRef(null);
  const tradeTimer = useRef(null);
  useEffect(
    () => () => {
      clearTimeout(nopeTimer.current);
      clearTimeout(tradeTimer.current);
    },
    []
  );
  const cardW = (Math.min(width, 520) - 16 * 2 - 12) / 2;

  const onItem = (kind, item) => {
    const owned = store.owned[kind].includes(item.key);
    if (owned) {
      buzzImpact('light');
      store.select(SEL[kind], item.key);
      return;
    }
    if (store.treats < item.price) {
      // shake the card and show how many treats are missing instead of a blocking dialog
      buzzImpact('heavy');
      clearTimeout(nopeTimer.current);
      setNope({ key: `${kind}-${item.key}`, short: item.price - store.treats, at: Date.now() });
      nopeTimer.current = setTimeout(() => setNope(null), 1800);
      return;
    }
    Alert.alert(`Unlock ${item.name}?`, `This costs ${item.price} treats.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unlock',
        onPress: () => {
          if (store.buy(kind, item)) {
            buzzComplete();
            setCelebrate({ kind, item, key: Date.now() });
          }
        },
      },
    ]);
  };

  const renderPreview = (kind, item) => {
    const w = cardW - 20;
    if (kind === 'animals') {
      return (
        <View style={[styles.animalBg, { width: w, height: w }]}>
          <Critter animal={item} size={w * 0.78} animated={false} shadow={false} />
        </View>
      );
    }
    return (
      <RoomPreview
        width={w}
        room={kind === 'rooms' ? item : store.room}
        chair={kind === 'chairs' ? item : store.chair}
        animal={store.animal}
      />
    );
  };

  const renderGrid = (kind) => (
    <View style={styles.grid}>
      {LIST[kind].map((item, index) => {
        const owned = store.owned[kind].includes(item.key);
        const inUse = store.selected[SEL[kind]] === item.key;
        const id = `${kind}-${item.key}`;
        const denied = nope?.key === id ? nope : null;
        return (
          <ShopCard
            key={id}
            width={cardW}
            inUse={inUse}
            owned={owned}
            price={item.price}
            shortBy={denied?.short}
            onPress={() => onItem(kind, item)}
            title={item.name}
            sub={kind === 'animals' ? item.species : null}
          >
            {renderPreview(kind, item)}
          </ShopCard>
        );
      })}
    </View>
  );

  const renderGifts = () => {
    const entries = Object.entries(store.inventory).filter(([, n]) => n > 0);
    const total = entries.reduce((sum, [k, n]) => sum + (findItem(k)?.value || 0) * n, 0);
    if (traded) {
      return (
        <View key={traded.key} style={styles.empty}>
          <View style={styles.tradeBurst}>
            <TreatIcon size={88} />
          </View>
          <Text style={styles.emptyTitle}>+{traded.amount} treats!</Text>
          <Text style={styles.emptySub}>{store.animal.name} is proud of you. Spend them on something cozy.</Text>
        </View>
      );
    }
    if (entries.length === 0) {
      return (
        <View style={styles.empty}>
          <ItemIcon name="gift" size={64} />
          <Text style={styles.emptyTitle}>No gifts yet</Text>
          <Text style={styles.emptySub}>
            Finish a focus session and {store.animal.name} will bring you something.
          </Text>
        </View>
      );
    }
    return (
      <View>
        <View style={styles.giftList}>
          {entries.map(([key, count], i) => {
            const it = findItem(key);
            if (!it) return null;
            return (
              <View
                key={key}
               
               
               
                style={styles.giftRow}
              >
                <ItemIcon name={it.key} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.giftName}>{it.name}</Text>
                  <Text style={styles.giftSub}>
                    {it.value} treats each
                  </Text>
                </View>
                <Text style={styles.giftCount}>×{count}</Text>
              </View>
            );
          })}
        </View>
        <RoundButton
          label={`Trade all for ${total} treats`}
          onPress={() => {
            const amount = store.tradeInventory();
            buzzComplete();
            setTraded({ amount, key: Date.now() });
            clearTimeout(tradeTimer.current);
            tradeTimer.current = setTimeout(() => setTraded(null), 2600);
          }}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  };

  return (
    <View style={styles.fill}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Shop</Text>
          <TreatPill amount={store.treats} />
        </View>
        <Segmented
          options={TABS}
          value={tab}
          onChange={(t) => {
            buzzImpact('light');
            setTab(t);
          }}
          style={{ marginBottom: 16 }}
        />
        {tab === 'gifts' ? renderGifts() : renderGrid(tab)}
        <Modal visible={!!celebrate} transparent animationType="fade" onRequestClose={() => setCelebrate(null)}>
          {celebrate && (
            <View style={styles.modalBg}>
              <View style={styles.modalCard}>
                {celebrate.kind === 'animals' ? (
                  <Critter animal={celebrate.item} size={170} mood="happy" />
                ) : (
                  <RoomPreview
                    width={200}
                    room={celebrate.kind === 'rooms' ? celebrate.item : store.room}
                    chair={celebrate.kind === 'chairs' ? celebrate.item : store.chair}
                    animal={store.animal}
                  />
                )}
                <Text style={styles.modalTitle}>
                  {celebrate.kind === 'animals' ? `${celebrate.item.name} joined you!` : `${celebrate.item.name} unlocked!`}
                </Text>
                <Text style={styles.modalSub}>
                  {celebrate.kind === 'animals' ? `${celebrate.item.sound} Ready to focus together.` : 'Your room just got cozier.'}
                </Text>
                <RoundButton label="Yay!" onPress={() => setCelebrate(null)} style={{ alignSelf: 'stretch', marginTop: 16 }} />
              </View>
            </View>
          )}
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 130, width: '100%', maxWidth: 520, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontFamily: FONT_BOLD, fontSize: 28, color: COLORS.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  cardActive: { borderColor: COLORS.accent },
  animalBg: {
    backgroundColor: COLORS.cardSoft,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontFamily: FONT_SEMIBOLD, fontSize: 14, color: COLORS.text, marginTop: 8 },
  cardSub: { fontFamily: FONT_MEDIUM, fontSize: 12, color: COLORS.textDim, marginTop: -2 },
  tag: { marginTop: 8, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 5 },
  tagUse: { backgroundColor: COLORS.accent },
  tagOwned: { backgroundColor: COLORS.border },
  tagBuy: { backgroundColor: COLORS.accentSoft },
  tagShort: { backgroundColor: COLORS.danger },
  tagText: { fontFamily: FONT_SEMIBOLD, fontSize: 13 },
  empty: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 24 },
  emptyTitle: { fontFamily: FONT_BOLD, fontSize: 18, color: COLORS.text, marginTop: 8 },
  emptySub: { fontFamily: FONT_MEDIUM, fontSize: 14, color: COLORS.textDim, textAlign: 'center', marginTop: 4 },
  giftList: { backgroundColor: COLORS.card, borderRadius: 22, paddingVertical: 4 },
  giftRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  giftName: { fontFamily: FONT_SEMIBOLD, fontSize: 15, color: COLORS.text },
  giftSub: { fontFamily: FONT_MEDIUM, fontSize: 12, color: COLORS.textDim },
  giftCount: { fontFamily: FONT_BOLD, fontSize: 16, color: COLORS.text },
  modalBg: { flex: 1, backgroundColor: 'rgba(40,28,22,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 340, backgroundColor: COLORS.card, borderRadius: 28, padding: 22, alignItems: 'center', overflow: 'hidden' },
  tradeBurst: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontFamily: FONT_BOLD, fontSize: 22, color: COLORS.text, marginTop: 12, textAlign: 'center' },
  modalSub: { fontFamily: FONT_MEDIUM, fontSize: 15, color: COLORS.textDim, marginTop: 4, textAlign: 'center' },
});
