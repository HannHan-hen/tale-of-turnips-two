// Headless screenshot tool driving the real Game class, so screenshots show
// exactly what players see. Usage: node tools/shot.mjs [mapId|all ...]
import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { Renderer } from '../src/render.js';
import { VIEW_W, VIEW_H, MAPS } from '../src/maps.js';

global.localStorage = {
  _d: {},
  getItem(k) { return this._d[k] ?? null; },
  setItem(k, v) { this._d[k] = String(v); },
  removeItem(k) { delete this._d[k]; },
};
global.window = { addEventListener() {} };

const { Game } = await import('../src/game.js');

const sfxStub = new Proxy({}, { get: () => () => {} });
const uiStub = {
  menuOpen: false,
  toast() {}, refreshHud() {}, tick() {}, dialogue() {},
  openShipping() {}, openSeedShop() {}, openSmith() {}, openCollection() {},
  showEnding() {}, hideTitle() {},
};
const inputStub = {
  axis: () => ({ x: 0, y: 0 }),
  hit: () => false, interact: () => false, attack: () => false,
  consumeAny: () => true, endFrame() {}, touch: {},
};

const R = new Renderer((w, h) => createCanvas(w, h), 2);
const game = new Game(R, inputStub, sfxStub, uiStub);
game.update(1 / 60); // leave title
game.fade = { a: 0, dir: 0, then: null };

const s = game.state;
// dress the state for pretty screenshots
s.day = 9;
s.gold = 142;
s.equip.sword = true;
s.plots.forEach((pl, i) => {
  const kinds = ['turnip', 'turnip', 'radish', 'carrot'];
  if (i < 7) { pl.kind = kinds[i % 4]; pl.daysGrown = [3, 3, 2, 1, 1, 0, 2][i]; }
});
s.chicken.egg = true;

const scenes = {
  farm: () => { game.enter('farm', { x: 560, y: 430 }); },
  farmDusk: () => { game.enter('farm', { x: 560, y: 430 }); s.dayT = 60; },
  house: () => { game.enter('house', { x: 480, y: 420 }); },
  village: () => { game.enter('village', { x: 480, y: 500 }); game.player.facing = 'right'; },
  forest: () => { game.enter('forest', { x: 470, y: 420 }); game.player.facing = 'left'; },
  lake: () => {
    game.enter('lake', { x: 415, y: 428 });
    game.castLine();
    game.fishing.phase = 'bite'; game.fishing.t = 0.5;
  },
  ruin1: () => { game.enter('ruin1', { x: 480, y: 560 }); game.player.facing = 'up'; },
  ruin2: () => { game.enter('ruin2', { x: 480, y: 560 }); game.player.facing = 'up'; },
  ruin4: () => { game.enter('ruin4', { x: 480, y: 560 }); game.player.facing = 'up'; },
  ruin7: () => { game.enter('ruin7', { x: 480, y: 600 }); game.player.facing = 'up'; },
};

const args = process.argv.slice(2);
const wanted = args.length === 0 || args[0] === 'all' ? Object.keys(scenes) : args;
mkdirSync('shots', { recursive: true });

for (const id of wanted) {
  if (!scenes[id]) { console.error('no scene', id); continue; }
  s.dayT = 28;
  scenes[id]();
  game.t = 1.3;
  // settle animations/interactions a few frames
  for (let i = 0; i < 8; i++) game.update(1 / 60);
  const c = createCanvas(VIEW_W * 2, VIEW_H * 2);
  const g = c.getContext('2d');
  g.scale(2, 2);
  game.render(g);
  writeFileSync(`shots/${id}.png`, c.toBuffer('image/png'));
  console.log('wrote shots/' + id + '.png');
}
