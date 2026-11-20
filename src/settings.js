// Player settings shared by the menus and the game (stored in the browser).
const KEY = 'wtld-settings';
const DEFAULTS = { rain: true, shake: true, lighting: true, grain: true };

// Rows shown in both settings panels (main menu and pause menu).
export const SETTING_ROWS = [
  ['rain', 'Rain effects'],
  ['shake', 'Screen shake'],
  ['lighting', 'Dynamic lighting'],
  ['grain', 'Film grain'],
];

export function readSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...DEFAULTS }; }
}

export function writeSettings(settings) {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* private window: keep for this session only */ }
}
