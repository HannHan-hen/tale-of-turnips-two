// Bootstrap: canvas setup, game loop, touch wiring.

import { Renderer } from './render.js';
import { VIEW_W, VIEW_H } from './maps.js';
import { Input } from './input.js';
import { Sfx } from './audio.js';
import { UI, paintIcon } from './ui.js';
import { Game } from './game.js';
import { load, clearSave } from './state.js';

const canvas = document.getElementById('game');
const dpr = Math.min(2.5, window.devicePixelRatio || 1);
canvas.width = VIEW_W * dpr;
canvas.height = VIEW_H * dpr;
const ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);

const renderer = new Renderer((w, h) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}, dpr);

const input = new Input();
const sfx = new Sfx();
const ui = new UI(sfx);
const game = new Game(renderer, input, sfx, ui);

// little inline HUD icons declared in markup
for (const c of document.querySelectorAll('canvas.chip-ic')) {
  c.width = 36; c.height = 36;
  const g = c.getContext('2d');
  g.scale(2, 2);
  paintIcon(g, c.dataset.icon, 9, 9, 8);
}

// title screen: reset link if a save exists. Handled on pointerdown with
// stopPropagation — a plain click handler never fires because the title's
// own pointerdown starts the game and hides the overlay before mouseup.
const reset = document.getElementById('title-reset');
if (load()) reset.classList.remove('hidden');
reset.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  e.preventDefault();
  clearSave();
  location.reload();
});
document.getElementById('title').addEventListener('pointerdown', () => {
  input.touch.interact = true; // any tap starts/resumes
});

// unlock audio on first gesture
window.addEventListener('pointerdown', () => sfx.ensure(), { once: true });
window.addEventListener('keydown', () => sfx.ensure(), { once: true });

// touch controls on coarse pointers
if (window.matchMedia('(pointer: coarse)').matches) {
  const touchBox = document.getElementById('touch');
  touchBox.classList.remove('hidden');
  const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const active = new Set();
  const apply = () => {
    let x = 0, y = 0;
    for (const d of active) { x += dirs[d][0]; y += dirs[d][1]; }
    input.touch.x = x; input.touch.y = y;
  };
  for (const btn of touchBox.querySelectorAll('#dpad button')) {
    const dir = btn.dataset.dir;
    const on = (e) => { e.preventDefault(); active.add(dir); apply(); };
    const off = (e) => { e.preventDefault(); active.delete(dir); apply(); };
    btn.addEventListener('pointerdown', on);
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointercancel', off);
    btn.addEventListener('pointerleave', off);
  }
  document.getElementById('t-interact').addEventListener('pointerdown', (e) => {
    e.preventDefault(); input.touch.interact = true;
  });
  document.getElementById('t-attack').addEventListener('pointerdown', (e) => {
    e.preventDefault(); input.touch.attack = true;
  });
}

// show HUD once playing
const hud = document.getElementById('hud');
const showHudWhenPlaying = () => {
  hud.classList.toggle('hidden', game.mode === 'title');
};

// fixed-step loop
let last = performance.now();
let acc = 0;
const STEP = 1 / 60;
let uiTickT = 0;

function frame(now) {
  const dtRaw = Math.min(0.1, (now - last) / 1000);
  last = now;
  acc += dtRaw;
  while (acc >= STEP) {
    game.update(STEP);
    acc -= STEP;
  }
  uiTickT += dtRaw;
  if (uiTickT > 0.25) {
    uiTickT = 0;
    ui.tick(game);
    showHudWhenPlaying();
  }
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  game.render(ctx);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
