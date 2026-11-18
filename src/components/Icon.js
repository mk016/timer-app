import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { COLORS } from '../theme';

// One icon set for the whole app, so nothing depends on platform emoji.
// Line icons share a 24x24 grid, 2px rounded strokes, and take a `color`.

const LINE = {
  sun: (
    <G>
      <Circle cx="12" cy="12" r="4" />
      <Path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
    </G>
  ),
  flame: <Path d="M12 3c1 3.5 5.5 5.5 5.5 10.5a5.5 5.5 0 0 1-11 0c0-2.7 1.6-4.4 2.7-5.4.3 1.7 1 2.7 2.1 3.1-.2-3.2-.3-5.8.7-8.2Z" />,
  timer: (
    <G>
      <Circle cx="12" cy="13" r="8" />
      <Path d="M12 13V9M9 3h6M18.5 6.5l1.2-1.2" />
    </G>
  ),
  gift: (
    <G>
      <Rect x="4" y="10.5" width="16" height="10" rx="2" />
      <Rect x="3" y="7" width="18" height="3.5" rx="1.5" />
      <Path d="M12 7v13.5M12 7C10.5 4 7 3.6 7.2 5.8 7.4 7.3 12 7 12 7ZM12 7c1.5-3 5-3.4 4.8-1.2C16.6 7.3 12 7 12 7Z" />
    </G>
  ),
  check: (
    <G>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M8 12.4l2.8 2.8L16.2 9.6" />
    </G>
  ),
  trash: <Path d="M4.5 7h15M10 4h4M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" />,
  mute: <Path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4ZM16 9.5l4.5 5M20.5 9.5l-4.5 5" />,
  rain: <Path d="M7.5 14.5h9.8a3.6 3.6 0 0 0 .3-7.2A5.2 5.2 0 0 0 7.6 8.4a3.1 3.1 0 0 0-.1 6.1ZM8.5 18l-1 2.5M12.5 18l-1 2.5M16.5 18l-1 2.5" />,
  waves: <Path d="M3 9.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 14.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 19.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />,
  noise: <Path d="M4 11v2M7.5 8.5v7M11 5v14M14.5 8v8M18 10v4M21 11.5v1" />,
  book: <Path d="M4 5.5c2.6-1 5.4-1 8 .6 2.6-1.6 5.4-1.6 8-.6V19c-2.6-1-5.4-1-8 .6-2.6-1.6-5.4-1.6-8-.6ZM12 6.1v13.5" />,
  moon: <Path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.4 6.4 0 0 0 10 10Z" />,
};

// Filled glyphs (no stroke)
const SOLID = {
  heart: <Path d="M12 20.5s-7.3-4.5-9-8.9C1.8 8.4 3.9 4.8 7.3 4.8c2 0 3.5 1.1 4.7 2.9 1.2-1.8 2.7-2.9 4.7-2.9 3.4 0 5.5 3.6 4.3 6.8-1.7 4.4-9 8.9-9 8.9Z" />,
  sparkle: <Path d="M12 2.5c.8 5.3 2.6 7.6 8 9.5-5.4 1.9-7.2 4.2-8 9.5-.8-5.3-2.6-7.6-8-9.5 5.4-1.9 7.2-4.2 8-9.5Z" />,
  paw: (
    <G>
      <Ellipse cx="6.2" cy="10" rx="2" ry="2.5" transform="rotate(-20 6.2 10)" />
      <Ellipse cx="9.8" cy="6.2" rx="2" ry="2.6" />
      <Ellipse cx="14.2" cy="6.2" rx="2" ry="2.6" />
      <Ellipse cx="17.8" cy="10" rx="2" ry="2.5" transform="rotate(20 17.8 10)" />
      <Path d="M12 11.5c-3 0-5.2 3.4-5.2 5.6 0 1.8 1.6 2.5 3.1 2 .8-.3 1.3-.5 2.1-.5s1.3.2 2.1.5c1.5.5 3.1-.2 3.1-2 0-2.2-2.2-5.6-5.2-5.6Z" />
    </G>
  ),
};

export default function Icon({ name, size = 20, color = COLORS.text, strokeWidth = 2 }) {
  if (SOLID[name]) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <G fill={color}>{SOLID[name]}</G>
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {LINE[name] || null}
      </G>
    </Svg>
  );
}

// ---------- coloured mini illustrations for collectibles ----------

const INK = '#5B4033';
const ink = { stroke: INK, strokeOpacity: 0.55, strokeWidth: 1, strokeLinejoin: 'round' };

const ITEMS = {
  treat: (
    // little fish-shaped cookie
    <G>
      <Path d="M3 12c3-5 10-6.5 14-2.5l4-3.5v12l-4-3.5C13 18.5 6 17 3 12Z" fill="#E9B872" {...ink} />
      <Circle cx="8" cy="11" r="1.2" fill={INK} />
      <Path d="M11.5 9.5c1 1.5 1 3.5 0 5M14 9.8c.8 1.4.8 3 0 4.4" stroke="#C98F4E" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </G>
  ),
  gift: (
    <G>
      <Rect x="4" y="10" width="16" height="11" rx="2" fill="#E07A5F" {...ink} />
      <Rect x="3" y="7" width="18" height="4" rx="1.5" fill="#C8553D" {...ink} />
      <Rect x="10.5" y="7" width="3" height="14" fill="#F6D5CB" />
      <Path d="M12 7C10.4 4 7 3.6 7.2 5.8 7.4 7.3 12 7 12 7ZM12 7c1.6-3 5-3.4 4.8-1.2C16.6 7.3 12 7 12 7Z" fill="#F6D5CB" {...ink} />
    </G>
  ),
  flower: (
    <G>
      <Path d="M12 14.5v7" stroke="#5E8F77" strokeWidth="1.6" strokeLinecap="round" />
      <Ellipse cx="9" cy="19" rx="2.6" ry="1.3" fill="#81B29A" transform="rotate(-30 9 19)" />
      {[0, 72, 144, 216, 288].map((d) => (
        <Circle key={d} cx={12 + Math.cos(((d - 90) * Math.PI) / 180) * 3.8} cy={10 + Math.sin(((d - 90) * Math.PI) / 180) * 3.8} r="3.3" fill="#F4A9B8" {...ink} />
      ))}
      <Circle cx="12" cy="10" r="2.4" fill="#FFD45C" {...ink} />
    </G>
  ),
  leaf: (
    <G>
      <Path d="M4.5 19.5C3.8 11 9 5 19.5 4.5 19.5 14.5 13.5 20 4.5 19.5Z" fill="#E9894A" {...ink} />
      <Path d="M4.5 19.5 15 9M9 15l-.5-4M12 12l3.5.5" stroke="#B8612F" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </G>
  ),
  shell: (
    <G>
      <Path d="M12 4c5 0 8.8 4 8.8 8.6 0 .9-.6 1.6-1.5 1.8L14.5 16 12 20l-2.5-4-4.8-1.6c-.9-.2-1.5-.9-1.5-1.8C3.2 8 7 4 12 4Z" fill="#F7C6B0" {...ink} />
      <Path d="M12 5.5V18M8.6 6.4l1.8 10.6M15.4 6.4l-1.8 10.6M5.5 9.5l4.6 6.5M18.5 9.5l-4.6 6.5" stroke="#D9937A" strokeWidth="1" strokeLinecap="round" fill="none" />
    </G>
  ),
  yarn: (
    <G>
      <Path d="M18 17c2 1 3 3 2.5 4.5" stroke="#C45A7C" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <Circle cx="12" cy="12" r="8" fill="#E07A9A" {...ink} />
      <Path d="M5 9.5Q12 13 19 8M4.5 14Q12 18 19.5 12.5M9 4.5Q11 12 7.5 19M15 4.5Q17 12 13.5 20" stroke="#C45A7C" strokeWidth="1.2" fill="none" />
    </G>
  ),
  mushroom: (
    <G>
      <Path d="M9 12.5h6l-.6 7a1.6 1.6 0 0 1-1.6 1.4h-1.6a1.6 1.6 0 0 1-1.6-1.4Z" fill="#FFF4E0" {...ink} />
      <Path d="M3.5 12.5a8.5 7.5 0 0 1 17 0Z" fill="#E05A4F" {...ink} />
      <Circle cx="8.5" cy="9" r="1.4" fill="#FFFFFF" />
      <Circle cx="13" cy="7" r="1.6" fill="#FFFFFF" />
      <Circle cx="16.5" cy="10.5" r="1.2" fill="#FFFFFF" />
    </G>
  ),
  star: (
    <G>
      <Path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6l-5.4 2.9 1.2-6-4.5-4.2 6.1-.7Z" fill="#FFD45C" {...ink} />
      <Path d="M9.5 9.5 11 9" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
    </G>
  ),
  gem: (
    <G>
      <Path d="M7 4.5h10l4 4.8L12 20.5 3 9.3Z" fill="#8FD3EE" {...ink} />
      <Path d="M3 9.3h18M9.5 4.5 7.8 9.3 12 20.5l4.2-11.2-1.7-4.8" stroke="#4FA3C7" strokeWidth="1" fill="none" strokeLinejoin="round" />
      <Path d="M6 8l1.5-2" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round" />
    </G>
  ),
  clover: (
    <G>
      <Path d="M12 13c1 3 3 5.5 5.5 7.5" stroke="#4F8A5B" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {[[12, 7.6], [16.4, 12], [12, 16.4], [7.6, 12]].map(([x, y]) => (
        <Circle key={`${x}-${y}`} cx={x} cy={y} r="3.9" fill="#6FBF73" {...ink} />
      ))}
      <Circle cx="12" cy="12" r="1.6" fill="#4F8A5B" />
    </G>
  ),
  paper: (
    <G>
      <Path d="M6 8.5 10 5l5 1 3.5 3.8-1 5 1 3-5 2.2-4-1.2-4.2-2 1.2-4Z" fill="#EFEAE2" {...ink} />
      <Path d="M8 10l4 2 3-3M10 15l2-3 4 2" stroke="#B9AFA2" strokeWidth="1" strokeLinecap="round" fill="none" />
    </G>
  ),
  peel: (
    <G>
      <Path d="M12 10.5c-.8 4-.6 7.5.3 10.5h1.4c.6-3 .5-6.5-.4-10.5Z" fill="#F5D04C" {...ink} />
      <Path d="M12 11C9 10 6 12 5 16c3-1 5.2-2.2 7-5ZM13.2 11c3-1 6 1 7 5-3-1-5.2-2.2-7-5Z" fill="#F5D04C" {...ink} />
      <Path d="M12.2 10.5 12.8 6" stroke="#7A5A44" strokeWidth="1.6" strokeLinecap="round" />
    </G>
  ),
  sock: (
    <G>
      <Path d="M8 3.5h7v8.8l3.4 3.3a3 3 0 0 1-4.2 4.3L9 14.8a3.2 3.2 0 0 1-1-2.3Z" fill="#8FA3B8" {...ink} />
      <Rect x="8" y="3.5" width="7" height="2.8" fill="#FFFFFF" {...ink} />
      <Path d="M8 9.5h7" stroke="#FFFFFF" strokeWidth="1.4" />
    </G>
  ),
};

/** Coloured illustration for a collectible (gift, trash, treat). Falls back to the gift box. */
export function ItemIcon({ name, size = 28 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {ITEMS[name] || ITEMS.gift}
    </Svg>
  );
}

export function TreatIcon({ size = 16 }) {
  return <ItemIcon name="treat" size={size} />;
}
