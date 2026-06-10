// Map definitions: ground painting, props, colliders, exits, interaction
// zones. Every map is one hand-composed 960x720 screen, like an old Flash
// game. Coordinates are logical pixels.

import { rng, pick, TAU } from './util.js';
import { P } from './palette.js';
import {
  ell, rr, vgrad, lingrad, radgrad, shadow, ink,
  blobTree, pine, bush, rock, tuft, flower, meadowTexture, path, paintAtmosphere, canopy,
} from './art.js';
import {
  cottage, signpost, soilPlot, shippingBox, ruinGate, shopHouse, anvil,
  chest, dock, coop, logBorder, ruinPillar, brazier, drawIcon,
} from './props.js';

export const VIEW_W = 960;
export const VIEW_H = 720;

// 3x3 plot grid on the farm
export const PLOT = { x0: 248, y0: 420, cell: 58, gap: 13, cols: 3, rows: 3 };
export function plotCenter(i) {
  const c = i % PLOT.cols, r = Math.floor(i / PLOT.cols);
  return {
    x: PLOT.x0 + c * (PLOT.cell + PLOT.gap),
    y: PLOT.y0 + r * (PLOT.cell + PLOT.gap) * 0.82,
  };
}

const p = (x, y, ext, draw) => ({ x, y, ext, draw });
const tree = (x, y, s, seed) => p(x, y, { l: s * 2.1, r: s * 2.1, t: s * 2.9, b: s * 0.7 }, (g) => blobTree(g, 0, 0, s, seed));
const pineP = (x, y, s, seed) => p(x, y, { l: s * 1.3, r: s * 1.3, t: s * 2.4, b: s * 0.6 }, (g) => pine(g, 0, 0, s, seed));
const bushP = (x, y, s, seed, tones) => p(x, y, { l: s * 1.8, r: s * 1.8, t: s * 1.8, b: s * 0.6 }, (g) => bush(g, 0, 0, s, seed, tones));
const rockP = (x, y, s, seed) => p(x, y, { l: s * 1.5, r: s * 1.5, t: s * 1.3, b: s * 0.7 }, (g) => rock(g, 0, 0, s, seed));

// Scatter a ring of border flora with gaps where exits live.
function borderFlora(seed, w, h, gaps, density = 30) {
  const rand = rng(seed);
  const out = [];
  const inGap = (x, y) => gaps.some((gp) => x > gp.x && x < gp.x + gp.w && y > gp.y && y < gp.y + gp.h);
  for (let i = 0; i < density; i++) {
    const edge = Math.floor(rand() * 4);
    let x, y;
    const d = 14 + rand() * 52;
    if (edge === 0) { x = rand() * w; y = d; }
    else if (edge === 1) { x = rand() * w; y = h - d + 16; }
    else if (edge === 2) { x = d - 6; y = rand() * h; }
    else { x = w - d + 6; y = rand() * h; }
    if (inGap(x, y)) continue;
    const roll = rand();
    if (roll < 0.42) out.push(pineP(x, y, 26 + rand() * 22, (seed + i) * 3));
    else if (roll < 0.78) out.push(tree(x, y, 22 + rand() * 16, (seed + i) * 5));
    else if (roll < 0.9) out.push(rockP(x, y, 10 + rand() * 9, (seed + i) * 7));
    else out.push(bushP(x, y, 13 + rand() * 8, (seed + i) * 11));
  }
  return out;
}

function meadowBase(g, w, h, seed, opts = {}) {
  const { topGlow = 0.5 } = opts;
  g.fillStyle = lingrad(g, 0, 0, w * 0.4, h, [
    [0, '#b3ad58'],
    [0.5, '#9c9a47'],
    [1, '#82843c'],
  ]);
  g.fillRect(0, 0, w, h);
  g.fillStyle = radgrad(g, w * 0.18, h * 0.1, w * 0.9, [
    [0, `rgba(255,231,150,${topGlow * 0.65})`],
    [1, 'rgba(255,231,150,0)'],
  ]);
  g.fillRect(0, 0, w, h);
  meadowTexture(g, w, h, seed, 1);
}

export const MAPS = {};

// ================================================================== FARM ==
MAPS.farm = {
  id: 'farm',
  name: 'Dappleroot Farm',
  music: 'farm',
  paintGround(g, w, h) {
    meadowBase(g, w, h, 41);
    // worn paths: door -> plots, door -> east exit (village), north gate, west, south
    path(g, [[190, 280], [240, 330], [300, 380]], 26, 5);
    path(g, [[260, 330], [430, 350], [640, 360], [905, 380]], 30, 6);
    path(g, [[620, 360], [610, 220], [605, 150]], 24, 7);
    path(g, [[330, 380], [180, 470], [60, 500]], 22, 8);
    path(g, [[430, 360], [520, 500], [560, 650]], 24, 9);
    // grass mound accents near plot
    const rand = rng(15);
    for (let i = 0; i < 7; i++) {
      tuft(g, 200 + rand() * 320, 400 + rand() * 180, 6, 'rgba(105,112,48,0.9)');
    }
  },
  buildProps() {
    const props = [
      p(190, 280, { l: 130, r: 130, t: 215, b: 40 }, (g) => cottage(g, 0, 0, 1)),
      p(805, 215, { l: 50, r: 50, t: 70, b: 18 }, (g) => shippingBox(g, 0, 0, 1)),
      p(605, 150, { l: 80, r: 80, t: 135, b: 24 }, (g) => ruinGate(g, 0, 0, 1)),
      p(470, 195, { l: 50, r: 50, t: 72, b: 18 }, (g) => coop(g, 0, 0, 1)),
      // signposts by the exits
      p(908, 352, { l: 30, r: 30, t: 78, b: 12 }, (g) => signpost(g, 0, 0, 'turnip', 1, 0.04)),
      p(60, 462, { l: 30, r: 30, t: 78, b: 12 }, (g) => signpost(g, 0, 0, 'fish', 1, -0.05)),
      p(610, 660, { l: 30, r: 30, t: 78, b: 12 }, (g) => signpost(g, 0, 0, 'berry', 1, 0.03)),
      p(700, 128, { l: 30, r: 30, t: 78, b: 12 }, (g) => signpost(g, 0, 0, 'sword', 0.92, 0.05)),
      // decorative mid-field flora
      tree(870, 560, 30, 21),
      bushP(360, 250, 14, 23),
      rockP(760, 470, 13, 27),
      bushP(150, 600, 15, 29, [P.leafDeep, P.leaf, P.leafLight]),
    ];
    // log borders along plot south edge
    props.push(p(225, 580, { l: 4, r: 230, t: 22, b: 8 }, (g) => logBorder(g, 0, 0, 220, 31)));
    return props.concat(borderFlora(101, VIEW_W, VIEW_H, [
      { x: 850, y: 330, w: 110, h: 110 }, // east exit
      { x: 0, y: 440, w: 90, h: 110 },    // west exit
      { x: 500, y: 620, w: 130, h: 100 }, // south exit
      { x: 530, y: 0, w: 170, h: 140 },   // ruins gate area
      { x: 60, y: 60, w: 300, h: 260 },   // cottage corner
    ], 56));
  },
  colliders: [
    { x: 80, y: 170, w: 215, h: 115 },   // cottage
    { x: 755, y: 175, w: 100, h: 45 },   // shipping box
    { x: 545, y: 60, w: 125, h: 85 },    // ruin gate columns
    { x: 425, y: 140, w: 95, h: 58 },    // coop
    { x: 838, y: 530, w: 70, h: 36 },    // mid tree
  ],
  walk: { x: 50, y: 90, w: VIEW_W - 100, h: VIEW_H - 150 },
  exits: [
    { x: VIEW_W - 26, y: 320, w: 26, h: 130, to: 'village', spawn: { x: 70, y: 400 } },
    { x: 0, y: 430, w: 26, h: 130, to: 'lake', spawn: { x: VIEW_W - 80, y: 400 } },
    { x: 520, y: VIEW_H - 24, w: 130, h: 24, to: 'forest', spawn: { x: 580, y: 90 } },
  ],
  doors: [
    { x: 165, y: 270, w: 55, h: 30, to: 'house', spawn: { x: 480, y: 560 }, label: 'Home' },
    { x: 568, y: 120, w: 80, h: 40, to: 'ruin1', spawn: { x: 480, y: 620 }, label: 'The Ruins' },
  ],
};

// ================================================================= HOUSE ==
MAPS.house = {
  id: 'house',
  name: 'Home Sweet Home',
  indoor: true,
  paintGround(g, w, h) {
    // warm plank floor
    g.fillStyle = lingrad(g, 0, 0, 0, h, [[0, '#8a623c'], [1, '#6b4a2c']]);
    g.fillRect(0, 0, w, h);
    const rand = rng(3);
    // per-plank tone variation
    for (let y = 80, row = 0; y < h; y += 46, row++) {
      let x = row % 2 ? -60 : 0;
      while (x < w) {
        const pw = 140 + rand() * 130;
        const tone = rand();
        g.fillStyle = tone < 0.33 ? 'rgba(255,215,160,0.07)' : tone < 0.66 ? 'rgba(60,35,15,0.08)' : 'rgba(0,0,0,0)';
        g.fillRect(x, y, pw, 46);
        x += pw;
      }
    }
    g.strokeStyle = 'rgba(60,40,22,0.5)';
    g.lineWidth = 3;
    for (let y = 80, row = 0; y < h; y += 46, row++) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
      let x = row % 2 ? -60 : 0;
      const r2 = rng(50 + row);
      while (x < w) {
        x += 140 + r2() * 130;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 46); g.stroke();
      }
    }
    // plank grain
    g.strokeStyle = 'rgba(120,85,50,0.35)';
    g.lineWidth = 1.4;
    for (let i = 0; i < 70; i++) {
      const x = rand() * w, y = 80 + rand() * (h - 80);
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 14, y + 2, x + 30, y); g.stroke();
    }
    // walls
    g.fillStyle = lingrad(g, 0, 0, 0, 86, [[0, '#dcc89c'], [1, '#cdb588']]);
    g.fillRect(0, 0, w, 86);
    g.fillStyle = '#7a522e';
    g.fillRect(0, 82, w, 10);
    // window with golden light
    for (const wx of [240, 700]) {
      rr(g, wx - 38, 14, 76, 56, 8);
      g.fillStyle = lingrad(g, wx - 38, 14, wx + 38, 70, [[0, '#ffe9b3'], [1, '#f0c878']]);
      g.fill();
      g.lineWidth = 6; g.strokeStyle = '#7a522e'; g.stroke();
      g.lineWidth = 2.6;
      g.beginPath();
      g.moveTo(wx, 14); g.lineTo(wx, 70);
      g.moveTo(wx - 38, 42); g.lineTo(wx + 38, 42);
      g.stroke();
      // light pooling on the floor
      g.fillStyle = radgrad(g, wx, 200, 190, [[0, 'rgba(255,226,150,0.18)'], [1, 'rgba(255,226,150,0)']]);
      g.fillRect(wx - 200, 86, 400, 320);
    }
    // round rug
    g.save();
    g.translate(w / 2, 420);
    g.scale(1, 0.62);
    for (const [r, col] of [[170, '#b08a72'], [142, '#e2d3b0'], [110, '#949970'], [76, '#e2d3b0'], [44, '#b08a72']]) {
      ell(g, 0, 0, r, r); g.fillStyle = col; g.fill();
    }
    g.restore();
  },
  buildProps() {
    return [
      p(480, 168, { l: 70, r: 70, t: 95, b: 10 }, (g) => { // bed
        shadow(g, 0, 4, 64, 18, 0.25);
        rr(g, -58, -88, 116, 92, 10);
        g.fillStyle = vgrad(g, -88, 4, '#b88a52', '#8a623c'); g.fill(); ink(g, 2, 0.3);
        rr(g, -52, -76, 104, 70, 8);
        g.fillStyle = vgrad(g, -76, -6, '#f3e6c8', '#dcc89c'); g.fill();
        rr(g, -52, -50, 104, 44, 8);
        g.fillStyle = vgrad(g, -50, -6, '#b86060', '#9a4a4a'); g.fill();
        g.strokeStyle = 'rgba(120,50,50,0.5)'; g.lineWidth = 2;
        rr(g, -52, -50, 104, 44, 8); g.stroke();
        rr(g, -40, -74, 36, 18, 7);
        g.fillStyle = '#fdf6e4'; g.fill(); ink(g, 1.4, 0.2);
      }),
      p(170, 150, { l: 35, r: 35, t: 60, b: 10 }, (g) => chest(g, 0, 0, 1.25)),
      p(770, 170, { l: 60, r: 60, t: 80, b: 10 }, (g) => { // hearth
        shadow(g, 0, 3, 56, 14, 0.25);
        rr(g, -52, -78, 104, 80, [8, 8, 4, 4]);
        g.fillStyle = vgrad(g, -78, 2, P.stone, P.stoneDark); g.fill(); ink(g, 2, 0.3);
        rr(g, -30, -52, 60, 54, [26, 26, 4, 4]);
        g.fillStyle = '#2c2018'; g.fill();
        // fire
        for (const [fx, fy, fr, col] of [[0, -18, 16, '#e8742c'], [0, -22, 10, '#f5b03c'], [0, -25, 5, '#fde08a']]) {
          g.fillStyle = col;
          g.beginPath();
          g.moveTo(fx - fr, fy + 14);
          g.quadraticCurveTo(fx - fr * 0.8, fy - fr * 0.4, fx, fy - fr);
          g.quadraticCurveTo(fx + fr * 0.8, fy - fr * 0.4, fx + fr, fy + 14);
          g.closePath(); g.fill();
        }
        g.fillStyle = '#5a4632';
        rr(g, -24, -8, 48, 8, 4); g.fill();
      }),
      p(300, 580, { l: 50, r: 50, t: 50, b: 12 }, (g) => { // table & stools
        shadow(g, 0, 3, 48, 14, 0.22);
        ell(g, 0, -26, 44, 20);
        g.fillStyle = vgrad(g, -46, -6, '#b88a52', '#96703f'); g.fill(); ink(g, 2, 0.3);
        g.fillStyle = '#7a5230';
        rr(g, -34, -22, 9, 22, 3); g.fill();
        rr(g, 25, -22, 9, 22, 3); g.fill();
        // vase
        g.fillStyle = '#8fa3b8';
        ell(g, 0, -34, 6, 7); g.fill();
        flower(g, -4, -46, 3.4, '#e87a90');
        flower(g, 4, -44, 3.2, '#f3e9b8');
      }),
    ];
  },
  colliders: [
    { x: 405, y: 92, w: 150, h: 80 },
    { x: 120, y: 100, w: 100, h: 52 },
    { x: 700, y: 100, w: 140, h: 72 },
    { x: 250, y: 540, w: 100, h: 44 },
  ],
  walk: { x: 60, y: 110, w: VIEW_W - 120, h: VIEW_H - 190 },
  exits: [],
  doors: [
    { x: 420, y: VIEW_H - 26, w: 120, h: 26, to: 'farm', spawn: { x: 192, y: 305 }, label: 'Outside' },
  ],
};

// =============================================================== VILLAGE ==
MAPS.village = {
  id: 'village',
  name: 'Thistledown Village',
  paintGround(g, w, h) {
    meadowBase(g, w, h, 77, { topGlow: 0.4 });
    // cobbled square
    g.save();
    g.translate(w * 0.5, h * 0.52);
    g.scale(1, 0.7);
    g.fillStyle = '#bfa982';
    ell(g, 0, 0, 310, 265); g.fill();
    g.restore();
    const rand = rng(13);
    for (let i = 0; i < 300; i++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * 295;
      const x = w * 0.5 + Math.cos(a) * d;
      const y = h * 0.52 + Math.sin(a) * d * 0.68;
      g.fillStyle = rand() < 0.5 ? 'rgba(172,150,112,0.75)' : 'rgba(208,189,150,0.8)';
      ell(g, x, y, 5.5 + rand() * 5.5, 4 + rand() * 4);
      g.fill();
      if (rand() < 0.12) {
        g.fillStyle = 'rgba(122,128,56,0.45)';
        ell(g, x + 3, y + 2, 3, 2); g.fill();
      }
    }
    path(g, [[20, 390], [110, 400], [220, 415]], 28, 21);
    // well at center is a prop; flowers around square
    for (let i = 0; i < 14; i++) {
      flower(g, w * 0.5 + (rand() - 0.5) * 640, h * 0.5 + (rand() - 0.5) * 420, 3, pick(rand, ['#e87a90', '#f3e9b8', '#9b6fb5', '#f0b35e']));
    }
  },
  buildProps() {
    return [
      p(265, 250, { l: 95, r: 95, t: 160, b: 28 }, (g) => shopHouse(g, 0, 0, { awning: '#c75e8a', sign: 'turnip' })),
      p(700, 250, { l: 95, r: 95, t: 160, b: 28 }, (g) => shopHouse(g, 0, 0, { awning: '#5d7fa0', sign: 'sword' })),
      p(770, 262, { l: 26, r: 26, t: 22, b: 8 }, (g) => anvil(g, 0, 0, 1.1)),
      p(480, 420, { l: 50, r: 50, t: 95, b: 20 }, (g) => { // village well
        shadow(g, 0, 4, 46, 14, 0.26);
        g.save(); g.translate(0, -14);
        g.fillStyle = vgrad(g, -10, 16, P.stone, P.stoneDark);
        ell(g, 0, 4, 40, 18); g.fill(); ink(g, 2, 0.3);
        g.fillStyle = '#3a4a44';
        ell(g, 0, 1, 30, 12); g.fill();
        g.fillStyle = P.woodDark;
        rr(g, -36, -50, 7, 58, 3); g.fill();
        rr(g, 29, -50, 7, 58, 3); g.fill();
        g.beginPath();
        g.moveTo(-44, -46); g.lineTo(0, -72); g.lineTo(44, -46);
        g.lineTo(36, -40); g.lineTo(0, -62); g.lineTo(-36, -40);
        g.closePath();
        g.fillStyle = P.roof; g.fill(); ink(g, 1.8, 0.3);
        g.strokeStyle = '#6b4526'; g.lineWidth = 2.4;
        g.beginPath(); g.moveTo(0, -46); g.lineTo(0, -26); g.stroke();
        g.fillStyle = P.wood;
        rr(g, -7, -28, 14, 12, 3); g.fill(); ink(g, 1.4, 0.3);
        g.restore();
      }),
      p(118, 560, { l: 40, r: 40, t: 70, b: 14 }, (g) => { // pip's bench
        shadow(g, 0, 2, 40, 11, 0.22);
        g.fillStyle = vgrad(g, -26, -16, P.woodLight, P.wood);
        rr(g, -36, -26, 72, 9, 4); g.fill(); ink(g, 1.6, 0.3);
        g.fillStyle = P.woodDark;
        rr(g, -32, -17, 7, 17, 2); g.fill();
        rr(g, 25, -17, 7, 17, 2); g.fill();
        rr(g, -36, -42, 72, 8, 4);
        g.fillStyle = P.wood; g.fill(); ink(g, 1.4, 0.25);
      }),
      // village gate (east where Jay stands)
      p(900, 430, { l: 40, r: 40, t: 120, b: 16 }, (g) => {
        shadow(g, 0, 3, 38, 12, 0.24);
        for (const dx of [-30, 30]) {
          rr(g, dx - 8, -104, 16, 106, [4, 4, 2, 2]);
          g.fillStyle = vgrad(g, -104, 2, P.woodLight, P.woodDark); g.fill(); ink(g, 1.8, 0.3);
        }
        g.beginPath();
        g.moveTo(-44, -98);
        g.quadraticCurveTo(0, -124, 44, -98);
        g.lineTo(44, -88);
        g.quadraticCurveTo(0, -112, -44, -88);
        g.closePath();
        g.fillStyle = P.wood; g.fill(); ink(g, 1.6, 0.3);
        // lantern
        g.strokeStyle = P.woodDeep; g.lineWidth = 2;
        g.beginPath(); g.moveTo(0, -106); g.lineTo(0, -96); g.stroke();
        rr(g, -6, -96, 12, 16, 4);
        g.fillStyle = '#ffe9b3'; g.fill();
        g.strokeStyle = '#6b4526'; g.lineWidth = 2.4; g.stroke();
      }),
      tree(80, 200, 30, 61),
      tree(560, 180, 24, 63),
      bushP(380, 600, 15, 65),
      bushP(620, 620, 16, 67, [P.leafDeep, P.leaf, P.leafLight]),
    ].concat(borderFlora(303, VIEW_W, VIEW_H, [
      { x: 0, y: 340, w: 80, h: 130 },   // west exit to farm
      { x: 840, y: 360, w: 120, h: 140 }, // east gate
    ], 30));
  },
  colliders: [
    { x: 170, y: 180, w: 190, h: 100 },
    { x: 605, y: 180, w: 190, h: 100 },
    { x: 432, y: 380, w: 96, h: 46 },
    { x: 80, y: 530, w: 80, h: 36 },
  ],
  walk: { x: 40, y: 120, w: VIEW_W - 80, h: VIEW_H - 180 },
  exits: [
    { x: 0, y: 330, w: 26, h: 140, to: 'farm', spawn: { x: VIEW_W - 80, y: 390 } },
  ],
  doors: [],
};

// ================================================================ FOREST ==
MAPS.forest = {
  id: 'forest',
  name: 'Whisperwood',
  paintGround(g, w, h) {
    g.fillStyle = lingrad(g, 0, 0, w * 0.3, h, [
      [0, '#7d8038'],
      [0.55, '#666c2e'],
      [1, '#525a28'],
    ]);
    g.fillRect(0, 0, w, h);
    g.fillStyle = radgrad(g, w * 0.4, h * 0.25, w * 0.7, [
      [0, 'rgba(255,231,160,0.22)'],
      [1, 'rgba(255,231,160,0)'],
    ]);
    g.fillRect(0, 0, w, h);
    meadowTexture(g, w, h, 55, 1.2);
    path(g, [[560, 60], [520, 240], [430, 420], [380, 600]], 22, 57);
    // fallen leaves
    const rand = rng(58);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = pick(rand, ['rgba(196,150,60,0.5)', 'rgba(160,120,50,0.45)', 'rgba(120,130,50,0.5)']);
      g.save();
      g.translate(rand() * w, rand() * h);
      g.rotate(rand() * TAU);
      ell(g, 0, 0, 4, 2.2); g.fill();
      g.restore();
    }
  },
  buildProps(state) {
    const props = [
      tree(180, 260, 36, 71), tree(740, 300, 40, 73), tree(330, 560, 34, 75),
      tree(820, 600, 30, 77), tree(150, 480, 28, 79),
      pineP(640, 180, 34, 81), pineP(260, 160, 30, 83), pineP(880, 420, 32, 85),
      pineP(80, 350, 28, 87), pineP(700, 480, 30, 89), pineP(480, 300, 26, 91),
      rockP(560, 520, 14, 93), rockP(240, 380, 11, 95),
      p(420, 230, { l: 40, r: 40, t: 60, b: 12 }, (g) => { // old stump
        shadow(g, 0, 2, 30, 10, 0.24);
        g.fillStyle = vgrad(g, -26, 0, '#a07848', '#7a5230');
        rr(g, -24, -26, 48, 28, [6, 6, 10, 10]); g.fill(); ink(g, 1.8, 0.3);
        ell(g, 0, -26, 24, 11);
        g.fillStyle = '#c8a36b'; g.fill(); ink(g, 1.6, 0.3);
        g.strokeStyle = 'rgba(130,90,50,0.6)'; g.lineWidth = 1.6;
        for (let r = 5; r < 20; r += 5) {
          g.beginPath(); g.ellipse(0, -26, r, r * 0.45, 0, 0, TAU); g.stroke();
        }
        // mushrooms
        for (const [mx, col] of [[-16, '#c75e5e'], [18, '#e0a050']]) {
          g.fillStyle = '#f0e6d0';
          rr(g, mx - 2, -8, 4, 8, 2); g.fill();
          g.fillStyle = col;
          ell(g, mx, -9, 7, 4.5); g.fill();
          g.fillStyle = 'rgba(255,255,255,0.6)';
          ell(g, mx - 2, -10.5, 1.6, 1.2); g.fill();
        }
      }),
    ];
    return props.concat(borderFlora(505, VIEW_W, VIEW_H, [
      { x: 500, y: 0, w: 140, h: 90 }, // north exit back to farm
    ], 46));
  },
  // berry bush positions (interactables drawn dynamically by render)
  berries: [
    { x: 200, y: 360 }, { x: 360, y: 300 }, { x: 620, y: 380 },
    { x: 760, y: 520 }, { x: 300, y: 640 }, { x: 540, y: 620 },
  ],
  colliders: [
    { x: 390, y: 195, w: 64, h: 40 },
  ],
  walk: { x: 40, y: 80, w: VIEW_W - 80, h: VIEW_H - 140 },
  exits: [
    { x: 500, y: 0, w: 140, h: 24, to: 'farm', spawn: { x: 580, y: VIEW_H - 90 } },
  ],
  doors: [],
};

// ================================================================== LAKE ==
MAPS.lake = {
  id: 'lake',
  name: 'Mirrormere',
  paintGround(g, w, h) {
    meadowBase(g, w, h, 99, { topGlow: 0.55 });
    // the lake itself fills the west half with a soft shoreline
    g.save();
    g.beginPath();
    g.moveTo(0, 80);
    g.quadraticCurveTo(330, 130, 380, 300);
    g.quadraticCurveTo(420, 470, 330, 590);
    g.quadraticCurveTo(250, 690, 0, 660);
    g.closePath();
    g.clip();
    g.fillStyle = lingrad(g, 0, 80, 380, 690, [
      [0, '#8fb392'],
      [0.5, '#5c8a72'],
      [1, '#41705e'],
    ]);
    g.fillRect(0, 0, w, h);
    // sun glitter
    const rand = rng(111);
    for (let i = 0; i < 70; i++) {
      const x = rand() * 380, y = 90 + rand() * 560;
      g.fillStyle = `rgba(255,245,200,${0.12 + rand() * 0.25})`;
      ell(g, x, y, 7 + rand() * 14, 1.4 + rand() * 1.2);
      g.fill();
    }
    // ripple arcs
    g.strokeStyle = 'rgba(230,245,225,0.3)';
    g.lineWidth = 1.6;
    for (let i = 0; i < 16; i++) {
      const x = rand() * 340, y = 110 + rand() * 520;
      g.beginPath(); g.arc(x, y, 10 + rand() * 18, 0.2, Math.PI - 0.4); g.stroke();
    }
    // lilypads
    for (let i = 0; i < 7; i++) {
      const x = 40 + rand() * 250, y = 140 + rand() * 460;
      g.fillStyle = '#6e8a3c';
      g.beginPath();
      g.ellipse(x, y, 13, 8, rand(), 0.25, TAU - 0.18);
      g.lineTo(x, y);
      g.closePath(); g.fill();
      if (rand() < 0.4) flower(g, x + 4, y - 4, 3.4, '#f0d8e8');
    }
    g.restore();
    // shoreline band
    g.strokeStyle = 'rgba(222,206,150,0.85)';
    g.lineWidth = 10;
    g.beginPath();
    g.moveTo(0, 80);
    g.quadraticCurveTo(330, 130, 380, 300);
    g.quadraticCurveTo(420, 470, 330, 590);
    g.quadraticCurveTo(250, 690, 0, 660);
    g.stroke();
    g.strokeStyle = 'rgba(150,160,90,0.5)';
    g.lineWidth = 4;
    g.stroke();
    path(g, [[905, 390], [700, 420], [480, 432]], 26, 113);
    // cattails hugging the shoreline
    const rand2 = rng(117);
    for (const [sx0, sy] of [[352, 180], [398, 270], [412, 345], [428, 430], [408, 505], [368, 565], [300, 628]]) {
      const sx = sx0 + rand2() * 14;
      g.strokeStyle = '#5d662b'; g.lineWidth = 2.2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx + 3, sy - 18, sx + 1, sy - 34); g.stroke();
      g.beginPath(); g.moveTo(sx + 7, sy + 2); g.quadraticCurveTo(sx + 11, sy - 12, sx + 9, sy - 24); g.stroke();
      g.fillStyle = '#7a5230';
      rr(g, sx - 2.4, sy - 36, 5.5, 14, 3); g.fill();
      tuft(g, sx + 6, sy + 2, 5, 'rgba(110,120,50,0.85)');
    }
  },
  buildProps() {
    return [
      p(450, 430, { l: 130, r: 30, t: 30, b: 30 }, (g) => {
        g.save();
        g.rotate(Math.PI / 2); // +y becomes -x: planks extend west over the water
        dock(g, 0, 0, 120, 1);
        g.restore();
      }),
      tree(820, 200, 34, 121), tree(620, 560, 30, 123),
      pineP(880, 560, 30, 125), pineP(560, 160, 28, 127),
      rockP(480, 620, 13, 129),
      bushP(700, 250, 15, 131),
    ].concat(borderFlora(707, VIEW_W, VIEW_H, [
      { x: 870, y: 330, w: 90, h: 140 }, // east exit to farm
      { x: 0, y: 0, w: 420, h: 720 },    // don't sprout trees in the lake
    ], 26));
  },
  colliders: [],
  // water polygon approximated by circles for collision
  waterBlocks: [
    { x: 0, y: 80, w: 360, h: 580 },
  ],
  walk: { x: 30, y: 70, w: VIEW_W - 60, h: VIEW_H - 130 },
  exits: [
    { x: VIEW_W - 26, y: 330, w: 26, h: 140, to: 'farm', spawn: { x: 75, y: 480 } },
  ],
  doors: [],
  fishSpot: { x: 360, y: 420 },
};

// ================================================================= RUINS ==
function ruinRoom(n, opts) {
  const { boss = 0, final = false } = opts || {};
  return {
    id: `ruin${n}`,
    name: final ? 'The Ruin Heart' : `Ruins · Depth ${n}`,
    indoor: true,
    ruin: true,
    depth: n,
    boss,
    final,
    paintGround(g, w, h) {
      // mauve stone floor
      g.fillStyle = lingrad(g, 0, 0, 0, h, [
        [0, '#4b4358'],
        [0.5, '#564d64'],
        [1, '#453d52'],
      ]);
      g.fillRect(0, 0, w, h);
      const rand = rng(900 + n * 13);
      // big floor slabs
      g.strokeStyle = 'rgba(30,24,40,0.5)';
      g.lineWidth = 3;
      for (let y = 90; y < h; y += 86) {
        g.beginPath(); g.moveTo(40, y); g.lineTo(w - 40, y); g.stroke();
        for (let i = 0; i < 6; i++) {
          const x = 80 + i * 150 + (y % 172 ? 70 : 0) + rand() * 30;
          if (x > w - 60) continue;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rand() - 0.5) * 8, y + 86); g.stroke();
        }
      }
      // slab tone variation
      for (let i = 0; i < 40; i++) {
        g.fillStyle = rand() < 0.5 ? 'rgba(120,108,135,0.10)' : 'rgba(28,22,40,0.10)';
        rr(g, 60 + rand() * (w - 200), 80 + rand() * (h - 200), 60 + rand() * 110, 50 + rand() * 60, 14);
        g.fill();
      }
      // cracks & rubble & moss
      g.strokeStyle = 'rgba(28,22,40,0.6)'; g.lineWidth = 1.8; g.lineCap = 'round';
      for (let i = 0; i < 16; i++) {
        let x = rand() * w, y = rand() * h;
        g.beginPath(); g.moveTo(x, y);
        for (let k = 0; k < 4; k++) {
          x += (rand() - 0.5) * 50; y += (rand() - 0.3) * 30;
          g.lineTo(x, y);
        }
        g.stroke();
      }
      for (let i = 0; i < 26; i++) {
        g.fillStyle = 'rgba(110,125,53,0.35)';
        ell(g, rand() * w, rand() * h, 6 + rand() * 12, 3 + rand() * 5);
        g.fill();
      }
      // glowing center sigil in boss rooms
      if (boss || final) {
        g.save();
        g.translate(w / 2, h / 2 + 20);
        g.scale(1, 0.62);
        g.strokeStyle = final ? 'rgba(226,86,106,0.4)' : 'rgba(185,240,224,0.32)';
        g.lineWidth = 5;
        for (const r of [180, 140]) { g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); }
        g.lineWidth = 2.4;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU;
          g.beginPath();
          g.moveTo(Math.cos(a) * 140, Math.sin(a) * 140);
          g.lineTo(Math.cos(a) * 180, Math.sin(a) * 180);
          g.stroke();
        }
        g.restore();
      }
      // walls: heavy stone rim with torch sconces
      g.fillStyle = lingrad(g, 0, 0, 0, 70, [[0, '#352e44'], [1, '#4b4358']]);
      g.fillRect(0, 0, w, 70);
      g.fillStyle = '#352e44';
      g.fillRect(0, h - 46, w, 46);
      g.fillRect(0, 0, 42, h);
      g.fillRect(w - 42, 0, 42, h);
      g.strokeStyle = 'rgba(20,16,30,0.6)'; g.lineWidth = 3;
      for (let x = 0; x < w; x += 74) {
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 6, 70); g.stroke();
      }
    },
    buildProps() {
      const rand = rng(950 + n * 7);
      const props = [];
      for (let i = 0; i < 6; i++) {
        const x = 90 + rand() * (VIEW_W - 180);
        const y = 120 + rand() * (VIEW_H - 220);
        if (Math.abs(x - VIEW_W / 2) < 160 && Math.abs(y - VIEW_H / 2) < 140) continue;
        props.push(p(x, y, { l: 20, r: 20, t: 110, b: 10 }, (g) => ruinPillar(g, 0, 0, 1, 950 + n * 7 + i)));
      }
      props.push(p(120, 110, { l: 16, r: 16, t: 46, b: 6 }, (g, t) => brazier(g, 0, 0, true, 1)));
      props.push(p(VIEW_W - 120, 110, { l: 16, r: 16, t: 46, b: 6 }, (g, t) => brazier(g, 0, 0, true, 1)));
      if (!final) {
        // north archway leading deeper (sealed barrier drawn dynamically)
        props.push(p(VIEW_W / 2, 74, { l: 80, r: 80, t: 74, b: 0 }, (g) => {
          g.beginPath();
          g.moveTo(-44, 0); g.lineTo(-44, -38);
          g.quadraticCurveTo(0, -62, 44, -38); g.lineTo(44, 0);
          g.closePath();
          g.fillStyle = lingrad(g, 0, -62, 0, 0, [[0, '#16121f'], [1, '#2a2438']]);
          g.fill();
          for (const dx of [-52, 52]) {
            rr(g, dx - 10, -64, 20, 66, [3, 3, 0, 0]);
            g.fillStyle = vgrad(g, -64, 0, P.ruinLight, P.ruinDark); g.fill();
            ink(g, 1.8, 0.35);
          }
          g.beginPath();
          g.moveTo(-66, -58); g.quadraticCurveTo(0, -82, 66, -58);
          g.lineTo(58, -48); g.quadraticCurveTo(0, -70, -58, -48);
          g.closePath();
          g.fillStyle = P.ruin; g.fill(); ink(g, 1.8, 0.3);
        }));
      }
      // south doorway: worn stairs glowing warmly (the way back)
      props.push(p(VIEW_W / 2, VIEW_H + 2, { l: 70, r: 70, t: 40, b: 0 }, (g) => {
        for (let i = 0; i < 3; i++) {
          rr(g, -58 + i * 10, -12 - i * 10, 116 - i * 20, 12, 3);
          g.fillStyle = ['#6f6580', '#7d7390', '#8b81a0'][i];
          g.fill();
          ink(g, 1.4, 0.3);
        }
        g.fillStyle = radgrad(g, 0, -16, 60, [[0, 'rgba(255,217,138,0.25)'], [1, 'rgba(255,217,138,0)']]);
        ell(g, 0, -16, 60, 30); g.fill();
      }));
      return props;
    },
    colliders: [],
    walk: { x: 70, y: 100, w: VIEW_W - 140, h: VIEW_H - 175 },
    exits: [],
    doors: [
      // back door (south) and deeper door (north, sealed until cleared)
      {
        x: VIEW_W / 2 - 60, y: VIEW_H - 30, w: 120, h: 30,
        to: n === 1 ? 'farm' : `ruin${n - 1}`,
        spawn: n === 1 ? { x: 605, y: 185 } : { x: VIEW_W / 2, y: 120 },
        label: n === 1 ? 'Leave the ruins' : 'Back',
      },
      ...(final ? [] : [{
        x: VIEW_W / 2 - 55, y: 0, w: 110, h: 38,
        to: `ruin${n + 1}`,
        spawn: { x: VIEW_W / 2, y: VIEW_H - 90 },
        label: 'Deeper...',
        sealed: true,
      }]),
    ],
  };
}

MAPS.ruin1 = ruinRoom(1, {});
MAPS.ruin2 = ruinRoom(2, { boss: 1 });
MAPS.ruin3 = ruinRoom(3, {});
MAPS.ruin4 = ruinRoom(4, { boss: 2 });
MAPS.ruin5 = ruinRoom(5, {});
MAPS.ruin6 = ruinRoom(6, { boss: 3 });
MAPS.ruin7 = ruinRoom(7, { final: true });
