// Lighten (amt > 0) or darken (amt < 0) a #RRGGBB colour by mixing with white or black
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1, 7), 16);
  const target = amt < 0 ? 0 : 255;
  const k = Math.abs(amt);
  const mix = (c) => Math.round(c + (target - c) * k);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
