import { CHAPTER_STAGES } from './levels/chapterData.js';

const KEY = 'wtld-save-slots-v1';
const VALID_SLOTS = [0, 1, 2];

function readAll() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

export function getSlots() {
  return VALID_SLOTS.map(index => {
    const save = readAll()[index];
    return save && Number.isInteger(save.levelIndex) && save.levelIndex >= 0
      && save.levelIndex < CHAPTER_STAGES.length ? save : null;
  });
}

export function saveSlot(index, data) {
  if (!VALID_SLOTS.includes(index)) return false;
  try {
    const slots = readAll();
    slots[index] = { ...data, version: 1, savedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(slots));
    return true;
  } catch { return false; }
}
