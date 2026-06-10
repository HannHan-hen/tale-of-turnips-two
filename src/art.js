// Low-level painter helpers. Everything in the game is drawn with these so
// the whole world shares one hand-illustrated language: soft gradients,
// rounded silhouettes, gentle ink lines, dappled light.

import { TAU, rng, pick } from './util.js';
import { P, INK } from './palette.js';

export function rr(g, x, y, w, h, r) {
  if (typeof r === 'number') r = [r, r, r, r];
  const [tl, tr, br, bl] = r;
  g.beginPath();
  g.moveTo(x + tl, y);
  g.lineTo(x + w - tr, y);
  g.arcTo(x + w, y, x + w, y + tr, tr);
  g.lineTo(x + w, y + h - br);
  g.arcTo(x + w, y + h, x + w - br, y + h, br);
  g.lineTo(x + bl, y + h);
  g.arcTo(x, y + h, x, y + h - bl, bl);
  g.lineTo(x, y + tl);
  g.arcTo(x, y, x + tl, y, tl);
  g.closePath();
}

export function ell(g, x, y, rx, ry) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, TAU);
  g.closePath();
}

// Soft contact shadow under an object.
export function shadow(g, x, y, rx, ry, alpha = 0.2) {
  const gr = g.createRadialGradient(x, y, 0, x, y, rx);
  gr.addColorStop(0, `rgba(48,52,24,${alpha})`);
  gr.addColorStop(1, 'rgba(48,52,24,0)');
  g.save();
  g.translate(x, y);
  g.scale(1, ry / rx);
  g.translate(-x, -y);
  g.fillStyle = gr;
  ell(g, x, y, rx, rx);
  g.fill();
  g.restore();
}

export function vgrad(g, y0, y1, c0, c1) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, c0);
  gr.addColorStop(1, c1);
  return gr;
}

export function lingrad(g, x0, y0, x1, y1, stops) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  for (const [t, c] of stops) gr.addColorStop(t, c);
  return gr;
}

export function radgrad(g, x, y, r, stops) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  for (const [t, c] of stops) gr.addColorStop(t, c);
  return gr;
}

export function ink(g, width = 1.4, alpha = 0.35) {
  g.lineWidth = width;
  g.strokeStyle = INK + alpha + ')';
  g.stroke();
}

// --- foliage -------------------------------------------------------------

// A leafy clump: overlapping discs in three tones with a sunlit crown.
export function canopy(g, x, y, r, seed, tones) {
  const [dark, mid, light] = tones || [P.leafDeep, P.leaf, P.leafLight];
  const rand = rng(seed);
  const lobes = [];
  const n = 6 + Math.floor(rand() * 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rand() * 0.5;
    const rr2 = r * (0.45 + rand() * 0.25);
    lobes.push([x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.42, rr2]);
  }
  lobes.push([x, y, r * 0.78]);

  g.fillStyle = dark;
  for (const [lx, ly, lr] of lobes) { ell(g, lx, ly + r * 0.10, lr * 1.04, lr * 0.98); g.fill(); }
  g.fillStyle = mid;
  for (const [lx, ly, lr] of lobes) { ell(g, lx - r * 0.05, ly - r * 0.06, lr * 0.92, lr * 0.88); g.fill(); }
  g.fillStyle = light;
  for (const [lx, ly, lr] of lobes) {
    if (ly > y + r * 0.1) continue;
    ell(g, lx - r * 0.12, ly - r * 0.16, lr * 0.55, lr * 0.5);
    g.fill();
  }
  // speckled leaf highlights
  g.fillStyle = 'rgba(255,240,190,0.30)';
  for (let i = 0; i < r * 0.5; i++) {
    const a = rand() * TAU, d = rand() * r * 0.8;
    const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * 0.75 - r * 0.15;
    ell(g, px, py, 1.6 + rand() * 1.4, 1.2 + rand());
    g.fill();
  }
}

// Round deciduous tree with trunk.
export function blobTree(g, x, y, s, seed) {
  const rand = rng(seed);
  shadow(g, x, y + 2, s * 1.15, s * 0.38, 0.22);
  // trunk
  g.fillStyle = P.woodDark;
  g.beginPath();
  g.moveTo(x - s * 0.14, y);
  g.quadraticCurveTo(x - s * 0.10, y - s * 0.7, x - s * 0.16, y - s * 1.0);
  g.lineTo(x + s * 0.16, y - s * 1.0);
  g.quadraticCurveTo(x + s * 0.10, y - s * 0.7, x + s * 0.14, y);
  g.closePath();
  g.fill();
  canopy(g, x, y - s * 1.45, s * 0.95, seed * 7 + 1);
  if (rand() < 0.5) {
    // little fruit/blossom dots
    g.fillStyle = rand() < 0.5 ? '#e8b4c8' : '#e8d57a';
    for (let i = 0; i < 5; i++) {
      ell(g, x + (rand() - 0.5) * s * 1.3, y - s * (1.1 + rand() * 0.8), s * 0.045, s * 0.045);
      g.fill();
    }
  }
}

// Conifer: layered drooping fronds.
export function pine(g, x, y, s, seed) {
  const rand = rng(seed);
  shadow(g, x, y + 2, s * 0.8, s * 0.3, 0.22);
  g.fillStyle = P.woodDark;
  g.fillRect(x - s * 0.07, y - s * 0.5, s * 0.14, s * 0.55);
  const layers = 4;
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1);
    const ly = y - s * (0.32 + t * 1.55);
    const lw = s * (0.95 - t * 0.62) * (0.95 + rand() * 0.1);
    const lh = s * 0.62;
    for (const [col, k] of [[P.pineDark, 1], [P.pine, 0.82], [P.pineLight, 0.5]]) {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(x, ly - lh * k);
      g.quadraticCurveTo(x + lw * k, ly - lh * 0.25 * k, x + lw * k * 0.92, ly + s * 0.06);
      g.quadraticCurveTo(x, ly + s * 0.16 * k, x - lw * k * 0.92, ly + s * 0.06);
      g.quadraticCurveTo(x - lw * k, ly - lh * 0.25 * k, x, ly - lh * k);
      g.closePath();
      g.fill();
      if (k === 0.5) break;
    }
  }
  g.fillStyle = P.pineLight;
  ell(g, x, y - s * 1.98, s * 0.08, s * 0.14);
  g.fill();
}

export function bush(g, x, y, s, seed, tones) {
  shadow(g, x, y + 1, s * 1.1, s * 0.34, 0.18);
  canopy(g, x, y - s * 0.55, s * 0.8, seed, tones);
}

export function rock(g, x, y, s, seed) {
  const rand = rng(seed);
  shadow(g, x, y + 1, s * 1.2, s * 0.4, 0.2);
  g.beginPath();
  const n = 7;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (i / n) * Math.PI;
    const r = s * (0.85 + rand() * 0.3);
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r * 0.72;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.closePath();
  g.fillStyle = vgrad(g, y - s, y + s * 0.2, '#c9bd9d', '#8d8268');
  g.fill();
  ink(g, 1.2, 0.22);
  g.fillStyle = 'rgba(255,250,225,0.4)';
  ell(g, x - s * 0.3, y - s * 0.45, s * 0.32, s * 0.18);
  g.fill();
  // mossy base
  g.fillStyle = 'rgba(110,125,53,0.55)';
  ell(g, x + s * 0.25, y + s * 0.05, s * 0.4, s * 0.16);
  g.fill();
}

export function tuft(g, x, y, s, col) {
  g.strokeStyle = col;
  g.lineWidth = 1.6;
  g.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    g.beginPath();
    g.moveTo(x + i * s * 0.30, y);
    g.quadraticCurveTo(x + i * s * 0.55, y - s * 0.6, x + i * s * 0.8, y - s * (0.9 + Math.abs(i) * -0.25));
    g.stroke();
  }
}

export function flower(g, x, y, s, col) {
  g.fillStyle = col;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    ell(g, x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.55, s * 0.42, s * 0.42);
    g.fill();
  }
  g.fillStyle = '#f5d76e';
  ell(g, x, y, s * 0.34, s * 0.34);
  g.fill();
}

// Scatter grass texture: dapples, tufts, tiny flowers. Call on base layers.
export function meadowTexture(g, w, h, seed, density = 1) {
  const rand = rng(seed);
  // big soft tonal patches
  for (let i = 0; i < 26 * density; i++) {
    const x = rand() * w, y = rand() * h;
    const r = 40 + rand() * 110;
    const light = rand() < 0.55;
    g.fillStyle = radgrad(g, x, y, r, [
      [0, light ? 'rgba(196,193,103,0.16)' : 'rgba(74,80,38,0.15)'],
      [1, 'rgba(0,0,0,0)'],
    ]);
    ell(g, x, y, r, r * 0.7);
    g.fill();
  }
  // tufts
  for (let i = 0; i < 130 * density; i++) {
    const x = rand() * w, y = rand() * h;
    tuft(g, x, y, 4 + rand() * 4, rand() < 0.5 ? 'rgba(120,126,56,0.7)' : 'rgba(160,160,80,0.65)');
  }
  // tiny flowers
  const cols = ['#f3e9b8', '#e9b9c9', '#f0f0e2', '#e8d57a'];
  for (let i = 0; i < 36 * density; i++) {
    flower(g, rand() * w, rand() * h, 2.2 + rand() * 1.6, pick(rand, cols));
  }
  // pebbles
  for (let i = 0; i < 18 * density; i++) {
    const x = rand() * w, y = rand() * h;
    g.fillStyle = 'rgba(190,182,148,0.5)';
    ell(g, x, y, 2 + rand() * 2.4, 1.4 + rand() * 1.6);
    g.fill();
  }
}

// Worn dirt path: blobby beige strokes along a polyline.
export function path(g, pts, width, seed) {
  const rand = rng(seed);
  g.save();
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const [w2, col, al] of [
    [width * 1.18, P.path, 0.55],
    [width * 0.82, P.pathLight, 0.8],
  ]) {
    g.strokeStyle = col;
    g.globalAlpha = al;
    g.lineWidth = w2;
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const [x, y] = pts[i];
      const [px, py] = pts[i - 1];
      g.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
    }
    g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
    g.stroke();
  }
  g.globalAlpha = 1;
  // speckles
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const segs = Math.ceil(Math.hypot(bx - ax, by - ay) / 14);
    for (let s = 0; s < segs; s++) {
      const t = s / segs;
      const x = ax + (bx - ax) * t + (rand() - 0.5) * width * 0.7;
      const y = ay + (by - ay) * t + (rand() - 0.5) * width * 0.55;
      g.fillStyle = rand() < 0.5 ? 'rgba(140,115,70,0.35)' : 'rgba(235,215,160,0.4)';
      ell(g, x, y, 1.6 + rand() * 2.2, 1.2 + rand() * 1.6);
      g.fill();
    }
  }
  g.restore();
}

// Dreamy fog vignette + golden top-left light, pre-rendered per map.
export function paintAtmosphere(g, w, h, seed, strength = 1) {
  const rand = rng(seed);
  // golden wash from upper-left
  g.fillStyle = radgrad(g, w * 0.12, h * 0.08, w * 0.95, [
    [0, `rgba(255,228,150,${0.30 * strength})`],
    [0.45, `rgba(255,228,150,${0.10 * strength})`],
    [1, 'rgba(255,228,150,0)'],
  ]);
  g.fillRect(0, 0, w, h);

  // light shafts (very soft)
  g.save();
  g.translate(w * 0.18, 0);
  g.rotate(0.5);
  for (let i = 0; i < 3; i++) {
    const x = i * 150 - 120;
    g.fillStyle = lingrad(g, 0, 0, 0, h * 0.9, [
      [0, `rgba(255,242,200,${0.07 * strength})`],
      [1, 'rgba(255,242,200,0)'],
    ]);
    g.fillRect(x, -80, 70 + i * 20, h * 1.1);
  }
  g.restore();

  // fog blobs hugging the edges
  for (let i = 0; i < 30; i++) {
    const edge = Math.floor(rand() * 4);
    let x, y;
    const inset = rand() * 42;
    if (edge === 0) { x = rand() * w; y = inset - 26; }
    else if (edge === 1) { x = rand() * w; y = h - inset + 26; }
    else if (edge === 2) { x = inset - 30; y = rand() * h; }
    else { x = w - inset + 30; y = rand() * h; }
    const r = 55 + rand() * 95;
    g.fillStyle = radgrad(g, x, y, r, [
      [0, `rgba(250,240,205,${(0.20 + rand() * 0.14) * strength})`],
      [1, 'rgba(250,240,205,0)'],
    ]);
    ell(g, x, y, r, r * 0.7);
    g.fill();
  }
  // corner emphasis
  for (const [cx, cy] of [[0, 0], [w, 0], [0, h], [w, h]]) {
    g.fillStyle = radgrad(g, cx, cy, 250, [
      [0, `rgba(246,236,208,${0.42 * strength})`],
      [1, 'rgba(246,236,208,0)'],
    ]);
    g.fillRect(cx - 250, cy - 250, 500, 500);
  }
}
