// Player settings shared by the menus and the game (stored in the browser).
const KEY = 'wtld-settings';
const DEFAULTS = { rain: true, shake: true };

export function readSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...DEFAULTS }; }
}
