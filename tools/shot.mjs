// Headless screenshot tool: renders game scenes with node-canvas so art can
// be reviewed without a browser. Usage: node tools/shot.mjs [mapId ...]
import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { Renderer } from '../src/render.js';
import { VIEW_W, VIEW_H, MAPS, plotCenter, PLOT } from '../src/maps.js';
import { farmer, chicken, villager, LOOKS, nibbler, wisp, golem, ruinHeart, pickup, egg } from '../src/sprites.js';
import { crop, soilPlot } from '../src/props.js';
import { bush } from '../src/art.js';

const ids = process.argv.slice(2);
const maps = ids.length ? ids : ['farm'];
mkdirSync('shots', { recursive: true });

const R = new Renderer((w, h) => createCanvas(w, h), 2);
const t = 1.2;

for (const id of maps) {
  const map = MAPS[id];
  if (!map) { console.error('no map', id); continue; }
  const c = createCanvas(VIEW_W * 2, VIEW_H * 2);
  const g = c.getContext('2d');
  g.scale(2, 2);

  const underlays = [];
  const entities = [];

  if (id === 'farm') {
    underlays.push((gg) => {
      for (let i = 0; i < 9; i++) {
        const { x, y } = plotCenter(i);
        soilPlot(gg, x, y, PLOT.cell);
      }
    });
    entities.push({ y: 999, draw: (gg) => {
      for (let i = 0; i < 9; i++) {
        const { x, y } = plotCenter(i);
        const stage = [1, 1, 1, 0.6, 0.6, 0.3, 0.12, 0, 0][i];
        if (stage > 0) crop(gg, x, y, ['turnip', 'turnip', 'radish'][i % 3], stage);
      }
    } });
    entities.push({ y: 430, draw: (gg) => farmer(gg, 560, 430, 'down', 0, false) });
    entities.push({ y: 250, draw: (gg) => chicken(gg, 530, 250, t) });
    entities.push({ y: 252, draw: (gg) => egg(gg, 505, 252) });
  } else if (id === 'village') {
    entities.push({ y: 300, draw: (gg) => villager(gg, 265, 300, t, LOOKS.marigold) });
    entities.push({ y: 300, draw: (gg) => villager(gg, 660, 300, t, LOOKS.bramble) });
    entities.push({ y: 560, draw: (gg) => villager(gg, 118, 548, t, LOOKS.pip) });
    entities.push({ y: 470, draw: (gg) => villager(gg, 860, 470, t, LOOKS.jay) });
    entities.push({ y: 480, draw: (gg) => farmer(gg, 480, 510, 'right', 0.3, true) });
  } else if (id === 'forest') {
    entities.push(...MAPS.forest.berries.map((b) => ({ y: b.y, draw: (gg) => {
      bush(gg, b.x, b.y, 16, b.x | 0);
      gg.fillStyle = '#b54a6e';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * 6.28;
        gg.beginPath();
        gg.ellipse(b.x + Math.cos(a) * 10, b.y - 9 + Math.sin(a) * 6, 3, 3, 0, 0, 7);
        gg.fill();
      }
    } })));
    entities.push({ y: 420, draw: (gg) => farmer(gg, 460, 420, 'left', 0.6, true) });
  } else if (id === 'lake') {
    entities.push({ y: 432, draw: (gg) => farmer(gg, 410, 430, 'left', 0, false) });
  } else if (id.startsWith('ruin')) {
    const map2 = MAPS[id];
    if (map2.final) entities.push({ y: 300, draw: (gg) => ruinHeart(gg, 480, 300, t, 0.8) });
    else if (map2.boss) entities.push({ y: 320, draw: (gg) => golem(gg, 480, 320, t, map2.boss) });
    else {
      entities.push({ y: 280, draw: (gg) => nibbler(gg, 380, 280, t) });
      entities.push({ y: 330, draw: (gg) => nibbler(gg, 600, 330, t + 2, { s: 1.2 }) });
      entities.push({ y: 250, draw: (gg) => wisp(gg, 500, 250, t) });
      entities.push({ y: 240, draw: (gg) => pickup(gg, 320, 240, t, 'amber') });
    }
    entities.push({ y: 560, draw: (gg) => farmer(gg, 480, 560, 'up', 0, false, -1) });
  } else if (id === 'house') {
    entities.push({ y: 400, draw: (gg) => farmer(gg, 480, 400, 'down', 0, false) });
  }

  R.drawScene(g, id, {}, t, entities, underlays);
  R.daylight(g, 0.4, map.indoor);
  writeFileSync(`shots/${id}.png`, c.toBuffer('image/png'));
  console.log('wrote shots/' + id + '.png');
}
