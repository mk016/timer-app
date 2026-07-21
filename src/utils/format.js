export function formatTime(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function formatStopwatch(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const cs = Math.floor((ms % 1000) / 10);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(cs)}`;
}

export function formatLap(ms) {
  return formatStopwatch(ms).replace(/\.(\d{2})$/, '.$1');
}

export function secondsToHMS(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return { h, m, s };
}

export function hmsToSeconds({ h, m, s }) {
  return h * 3600 + m * 60 + s;
}

export function formatPresetDuration(seconds) {
  const { h, m, s } = secondsToHMS(seconds);
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}h ${pad(m)}m` : m > 0 ? `${pad(m)}m ${pad(s)}s` : `${pad(s)}s`;
}
