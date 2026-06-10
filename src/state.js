// Game state: items, seeds, equipment, save/load.

export const SEEDS = {
  radish: { name: 'Radish', price: 4, days: 2 },
  turnip: { name: 'Turnip', price: 5, days: 3 },
  carrot: { name: 'Carrot', price: 8, days: 4 },
};
export const SEED_ORDER = ['turnip', 'radish', 'carrot'];

export const ITEMS = {
  turnip: { name: 'Turnip', sell: 14, icon: 'turnip' },
  radish: { name: 'Radish', sell: 9, icon: 'radish' },
  carrot: { name: 'Carrot', sell: 24, icon: 'carrot' },
  egg: { name: 'Egg', sell: 7, icon: 'egg' },
  berry: { name: 'Bramble Berry', sell: 5, icon: 'berry' },
  fish: { name: 'Mirror Trout', sell: 10, icon: 'fish' },
  amber: { name: 'Ruin Amber', sell: 20, icon: 'amber', gift: 2 },
  feather: { name: 'Starlit Feather', sell: 16, icon: 'feather', gift: 4 },
};

export const GEAR = {
  sword: { name: 'Bramble Sword', price: 35, desc: 'Lets you fight. Sharp-ish.' },
  cap: { name: 'Leather Cap', price: 25, desc: '+1 heart' },
  vest: { name: 'Leather Vest', price: 45, desc: '+1 heart' },
  boots: { name: 'Sturdy Boots', price: 65, desc: '+1 heart' },
};

export const SET_PIECES = {
  blade: { name: 'Starless Edge', desc: '+1 sword damage', source: 'Guarded by the ruins...' },
  crown: { name: 'Starless Crown', desc: '+1 heart', source: 'A friend\'s gift?' },
  sboots: { name: 'Starless Striders', desc: 'Move faster', source: 'Hidden among berries?' },
  gloves: { name: 'Starless Grips', desc: '+1 harvest yield', source: 'Buried in a field?' },
  pendant: { name: 'Starless Pendant', desc: 'Longer sword reach', source: 'Deep below water?' },
};

export const DAY_LENGTH = 75; // seconds of real time per in-game day
export const GRACE_DAYS = 7;
export const THREAT_RAID = 3;
export const RELIC_GOLD = 200;

const SAVE_KEY = 'tott2-save-v1';
const HIGH_KEY = 'tott2-high';

export function newGame() {
  return {
    v: 1,
    gold: 0,
    goldEarned: 0,
    day: 1,
    dayT: 0,
    hearts: 1,
    inv: {},
    seeds: { turnip: 12, radish: 0, carrot: 0 },
    selSeed: 'turnip',
    equip: { sword: false, cap: false, vest: false, boots: false },
    set: { blade: false, crown: false, sboots: false, gloves: false, pendant: false },
    plots: Array.from({ length: 9 }, () => ({ kind: null, daysGrown: 0 })),
    chicken: { pettedDay: 0, egg: false },
    berriesDay: 0,
    berriesPicked: [],
    fishedToday: 0,
    threat: 0,
    bosses: { 1: false, 2: false, 3: false, final: false },
    cacheOpened: false,
    roomsClearedDay: {}, // normal rooms: id -> day cleared (respawn next day)
    jay: { aff: 0, talkedDay: 0, giftedDay: 0 },
    pipHint: 0,
    stats: { harvested: 0, petted: 0, monsters: 0, fish: 0, berries: 0, shipped: 0 },
    won: false,
    tut: {}, // one-time tips shown
  };
}

export function maxHearts(s) {
  return 1 + (s.equip.cap ? 1 : 0) + (s.equip.vest ? 1 : 0) + (s.equip.boots ? 1 : 0) + (s.set.crown ? 1 : 0);
}

export function swordDamage(s) {
  return 1 + (s.set.blade ? 1 : 0);
}

export function moveSpeed(s) {
  return s.set.sboots ? 195 : 155;
}

export function swordReach(s) {
  return s.set.pendant ? 52 : 38;
}

export function setCount(s) {
  return Object.values(s.set).filter(Boolean).length;
}

export function addItem(s, id, n = 1) {
  s.inv[id] = (s.inv[id] || 0) + n;
}

export function save(s) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch { /* private mode */ }
}

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s && s.v === 1) return Object.assign(newGame(), s);
  } catch { /* corrupted */ }
  return null;
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
}

export function highScore() {
  try { return Number(localStorage.getItem(HIGH_KEY)) || 0; } catch { return 0; }
}

export function bankHighScore(gold) {
  const best = Math.max(highScore(), gold);
  try { localStorage.setItem(HIGH_KEY, String(best)); } catch { /* ignore */ }
  return best;
}
