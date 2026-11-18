// Everything the player can collect. `price` is in treats; 0 means owned from the start.

export const ANIMALS = [
  { key: 'cat', name: 'Mochi', species: 'Cat', sound: 'Meow!', price: 0, ears: 'pointy', tail: 'long', fur: '#F2A65A', belly: '#FCE7D2', inner: '#F7B7A3', stripes: true, stripe: '#D9843F' },
  { key: 'tuxedo', name: 'Oreo', species: 'Cat', sound: 'Mrrp?', price: 70, ears: 'pointy', tail: 'long', fur: '#36302F', belly: '#FFFFFF', inner: '#F2A7B0', muzzle: '#FFFFFF', blaze: '#FFFFFF', paws: '#FFFFFF', nose: '#F2A7B0', eyeColor: '#E8C547', darkFace: true },
  { key: 'calico', name: 'Patches', species: 'Cat', sound: 'Mew mew!', price: 90, ears: 'pointy', tail: 'long', fur: '#FFF6EC', belly: '#FFFFFF', inner: '#F7B7A3', patches: ['#EE9A4D', '#3E3532'], tailColor: '#EE9A4D', nose: '#E58E8E', line: '#C9A58A' },
  { key: 'greytabby', name: 'Earl Grey', species: 'Cat', sound: '*slow blink*', price: 100, ears: 'pointy', tail: 'long', fur: '#A3A7AE', belly: '#ECECEE', inner: '#F2B8B5', stripes: true, stripe: '#6E737C', eyeColor: '#A8CF7E', nose: '#D98C8C' },
  { key: 'blackcat', name: 'Luna', species: 'Cat', sound: 'Mrow~', price: 130, ears: 'pointy', tail: 'long', fur: '#2E2A33', belly: '#3C3742', inner: '#B5838D', nose: '#B5838D', eyeColor: '#F2C94C', darkFace: true, line: '#17141A' },
  { key: 'siamese', name: 'Miso', species: 'Cat', sound: 'Mraow!', price: 150, ears: 'pointy', tail: 'long', fur: '#F3E6D2', belly: '#FBF4EA', inner: '#C99B8A', earColor: '#6B5143', paws: '#6B5143', tailColor: '#6B5143', point: '#6B5143', eyeColor: '#7FB6E8', nose: '#4A3830', earTuft: '#E8D8C4', line: '#B89F86' },
  { key: 'fluffy', name: 'Cloud', species: 'Cat', sound: '*purrrr*', price: 170, ears: 'pointy', tail: 'bushy', fur: '#FFFFFF', belly: '#FFFFFF', inner: '#F7C6CF', fluffy: true, eyeColor: '#8EC5F0', nose: '#F2A7B0', line: '#C9BFB8', tailTip: '#F6F1EC' },
  { key: 'dog', name: 'Biscuit', species: 'Dog', sound: 'Woof woof!', price: 60, ears: 'floppy', tail: 'short', fur: '#C68B59', belly: '#F3DEC9', inner: '#8C5A3C', spot: true },
  { key: 'bunny', name: 'Clover', species: 'Bunny', sound: '*nose wiggle*', price: 80, ears: 'long', tail: 'puff', fur: '#E8E0D6', belly: '#FFFFFF', inner: '#F7C6CF' },
  { key: 'panda', name: 'Bao', species: 'Panda', sound: '*munch munch*', price: 120, ears: 'round', tail: 'puff', fur: '#FAFAF7', belly: '#FFFFFF', inner: '#2E2B2A', earColor: '#2E2B2A', eyePatch: '#2E2B2A', limbColor: '#2E2B2A', line: '#C9C4BC' },
  { key: 'fox', name: 'Ember', species: 'Fox', sound: 'Yip yip!', price: 150, ears: 'pointy', tail: 'bushy', fur: '#E8743B', belly: '#FFF4EA', inner: '#3B2A22', muzzle: '#FFF4EA', tailTip: '#FFF4EA' },
  { key: 'bear', name: 'Honey', species: 'Bear', sound: 'Grr~ (friendly)', price: 180, ears: 'round', tail: 'puff', fur: '#9C6B4E', belly: '#D9B38C', inner: '#D9B38C', muzzle: '#D9B38C' },
  { key: 'hamster', name: 'Peanut', species: 'Hamster', sound: 'Squeak!', price: 100, ears: 'small', tail: 'none', fur: '#E9B872', belly: '#FFF3DF', inner: '#F2A7A0', cheeks: true },
  { key: 'koala', name: 'Gumnut', species: 'Koala', sound: '*sleepy hug*', price: 220, ears: 'fluffy', tail: 'none', fur: '#A7A9AC', belly: '#E6E6E6', inner: '#F1F1F1', nose: '#3A3A3A', bigNose: true },
];

export const CHAIRS = [
  { key: 'wooden', name: 'Wooden Chair', price: 0, kind: 'wooden', color: '#B07D57', accent: '#8A5E3E' },
  { key: 'armchair', name: 'Cozy Armchair', price: 70, kind: 'armchair', color: '#81B29A', accent: '#5E8F77' },
  { key: 'plaid', name: 'Plaid Armchair', price: 110, kind: 'armchair', color: '#C9584A', accent: '#A8443A', plaid: '#F2D7A6' },
  { key: 'beanbag', name: 'Bean Bag', price: 90, kind: 'beanbag', color: '#E07A5F', accent: '#C4644B' },
  { key: 'stool', name: 'Round Stool', price: 40, kind: 'stool', color: '#E9B44C', accent: '#C9962F' },
  { key: 'bench', name: 'Garden Bench', price: 130, kind: 'bench', color: '#9C6B4E', accent: '#3F4A44' },
  { key: 'velvet', name: 'Velvet Throne', price: 200, kind: 'armchair', color: '#7B6FB0', accent: '#5E5391' },
];

/*
 * Rooms. wallpaper: stripes | florals | gingham | dots | planks | plain
 * view (out of the window): hills | sea | city | meadow | blossom | snow | rain
 * right: what stands on the right of the chair; decor: what hangs on the right wall
 * dark: the wall is dark, so UI text on top of it turns light
 */
export const ROOMS = [
  { key: 'cozy', name: 'Cozy Corner', price: 0, wall: '#F3E3D3', pattern: '#FFFFFF', wallpaper: 'stripes', floor: '#D9B99B', rug: '#E8A598', sky: '#BFE3F2', skyLow: '#E8F6FF', view: 'hills', time: 'day', curtain: '#E8A598', right: 'plant', decor: 'shelf' },
  { key: 'breakfast', name: 'Breakfast Nook', price: 60, wall: '#FBEFC9', pattern: '#F4CF6E', wallpaper: 'gingham', floor: '#E6CFAE', floorStyle: 'tiles', rug: '#9CC5A1', sky: '#CDEBFA', skyLow: '#FFF6DA', view: 'meadow', time: 'day', curtain: '#FFFFFF', curtainTrim: '#E07A5F', right: 'table', decor: 'clock', bunting: true },
  { key: 'hillside', name: 'Hillside Morning', price: 80, wall: '#E3EDD9', pattern: '#FFFFFF', wallpaper: 'dots', floor: '#CDB291', rug: '#F2C6A0', sky: '#A9DBF2', skyLow: '#F1FAFF', view: 'meadow', time: 'day', curtain: '#F2C6A0', right: 'plant', decor: 'frames' },
  { key: 'sunset', name: 'Golden Hour', price: 80, wall: '#F7D9C4', pattern: '#FFFFFF', wallpaper: 'stripes', floor: '#C99A7A', rug: '#E9B44C', sky: '#F59E7A', skyLow: '#FFD9A0', view: 'sea', time: 'sunset', curtain: '#E07A5F', right: 'plant', decor: 'frames' },
  { key: 'mint', name: 'Mint Studio', price: 100, wall: '#D8EDE3', pattern: '#FFFFFF', wallpaper: 'dots', floor: '#B5CFC0', rug: '#FFFFFF', sky: '#CFEFFF', skyLow: '#EFFAFF', view: 'hills', time: 'day', curtain: '#F2C6A0', right: 'bookcase', decor: 'clock' },
  { key: 'vintage', name: 'Vintage Florals', price: 120, wall: '#F2DCD6', pattern: '#D98C8F', wallpaper: 'florals', floor: '#B98B6E', rug: '#7FA38B', sky: '#F7C8B8', skyLow: '#FFF0E0', view: 'blossom', time: 'day', curtain: '#9CB79F', right: 'table', decor: 'frames' },
  { key: 'night', name: 'Starry Night', price: 120, wall: '#34385A', pattern: '#FFFFFF', wallpaper: 'stripes', floor: '#262840', rug: '#4A4E78', sky: '#1B1E3A', skyLow: '#3A3F75', view: 'city', time: 'night', curtain: '#7B6FB0', right: 'plant', decor: 'shelf', lights: true, dark: true },
  { key: 'rain', name: 'Rainy Day', price: 150, wall: '#D6D9DE', pattern: '#FFFFFF', wallpaper: 'stripes', floor: '#A9A39B', rug: '#8FA3B8', sky: '#8C9AAB', skyLow: '#B7C2CF', view: 'rain', time: 'rain', curtain: '#8FA3B8', right: 'bookcase', decor: 'shelf' },
  { key: 'blossom', name: 'Cherry Blossom', price: 160, wall: '#FBE6EA', pattern: '#FFFFFF', wallpaper: 'florals', floor: '#E2C3B0', rug: '#F4A9B8', sky: '#BFE6F7', skyLow: '#FFF1F4', view: 'blossom', time: 'day', curtain: '#F4A9B8', right: 'plant', decor: 'frames', bunting: true },
  { key: 'cabin', name: 'Winter Cabin', price: 200, wall: '#7A4E36', pattern: '#000000', wallpaper: 'planks', floor: '#4E3226', rug: '#B8453A', sky: '#2B3566', skyLow: '#7F8CC0', view: 'snow', time: 'night', curtain: '#B8453A', right: 'fireplace', decor: 'none', lights: true, dark: true },
];

// Gifts the companion brings after a completed focus session
export const GIFTS = [
  { key: 'flower', name: 'Little Flower', value: 6 },
  { key: 'leaf', name: 'Autumn Leaf', value: 5 },
  { key: 'shell', name: 'Sea Shell', value: 8 },
  { key: 'yarn', name: 'Yarn Ball', value: 7 },
  { key: 'mushroom', name: 'Tiny Mushroom', value: 9 },
  { key: 'star', name: 'Lucky Star', value: 15 },
  { key: 'gem', name: 'Shiny Gem', value: 25 },
  { key: 'clover', name: 'Four-leaf Clover', value: 20 },
];

// What's left behind when a session is abandoned
export const TRASH = [
  { key: 'paper', name: 'Crumpled Paper', value: 1 },
  { key: 'peel', name: 'Banana Peel', value: 1 },
  { key: 'sock', name: 'Lost Sock', value: 1 },
];

export const findItem = (key) => [...GIFTS, ...TRASH].find((i) => i.key === key);

// Longer sessions roll rarer gifts
export function rollGift(minutes) {
  const pool = minutes >= 45 ? GIFTS : minutes >= 25 ? GIFTS.slice(0, 7) : GIFTS.slice(0, 5);
  const weights = pool.map((g) => 1 / g.value);
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[0];
}

export const rollTrash = () => TRASH[Math.floor(Math.random() * TRASH.length)];

// Treats paid out immediately on top of the gift
export const sessionReward = (minutes) => Math.max(1, Math.round(minutes / 5) * 2);

export const MIN_REWARD_MINUTES = 5;
