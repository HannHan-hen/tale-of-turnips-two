// Larger set pieces: the cottage, signposts, fences, soil plots, shipping
// box, ruin gate, shops... Each draws with its anchor at the object's
// "feet" (baseline), so depth-sorting works naturally.

import { TAU, rng, pick } from './util.js';
import { P, INK } from './palette.js';
import { rr, ell, shadow, vgrad, lingrad, radgrad, ink, canopy, flower, tuft } from './art.js';

// --- the farmhouse -------------------------------------------------------
// Mirrors the raw concept cottage: cream plaster, timber framing, scalloped
// terracotta roof, stone chimney, round attic window, flower boxes.
export function cottage(g, x, y, s = 1) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  const W = 190, H = 110; // wall block
  shadow(g, 0, 6, W * 0.78, 30, 0.26);

  // wall
  rr(g, -W / 2, -H, W, H, [6, 6, 10, 10]);
  g.fillStyle = vgrad(g, -H, 0, P.plaster, P.plasterShade);
  g.fill();
  ink(g, 2, 0.3);

  // timber framing
  g.strokeStyle = P.beam;
  g.lineWidth = 6.5;
  g.lineCap = 'round';
  for (const [ax, ay, bx, by] of [
    [-W / 2 + 8, -H + 6, -W / 2 + 8, -4],
    [W / 2 - 8, -H + 6, W / 2 - 8, -4],
    [-W / 2 + 8, -H * 0.52, -W * 0.16, -H * 0.52],
    [W * 0.16, -H * 0.52, W / 2 - 8, -H * 0.52],
    [-W * 0.30, -H + 4, -W * 0.42, -H * 0.52],
    [W * 0.30, -H + 4, W * 0.42, -H * 0.52],
  ]) {
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
  }

  // door (arched, planked)
  const dw = 40, dh = 62;
  g.save();
  rr(g, -dw / 2, -dh, dw, dh, [dw / 2, dw / 2, 3, 3]);
  g.fillStyle = vgrad(g, -dh, 0, P.woodLight, P.woodDark);
  g.fill();
  g.clip();
  g.strokeStyle = 'rgba(70,45,22,0.5)';
  g.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    g.beginPath(); g.moveTo(i * dw * 0.25, -dh); g.lineTo(i * dw * 0.25, 0); g.stroke();
  }
  g.restore();
  rr(g, -dw / 2, -dh, dw, dh, [dw / 2, dw / 2, 3, 3]);
  g.lineWidth = 3; g.strokeStyle = P.woodDeep; g.stroke();
  g.fillStyle = '#e9c46a';
  ell(g, dw * 0.28, -dh * 0.42, 3.4, 3.4); g.fill();

  // side windows with shutters + flower boxes
  for (const wx of [-W * 0.32, W * 0.32]) {
    rr(g, wx - 14, -H * 0.78, 28, 30, 6);
    g.fillStyle = vgrad(g, -H * 0.78, -H * 0.78 + 30, '#fdf3cf', '#e8c97e');
    g.fill();
    g.lineWidth = 3.5; g.strokeStyle = P.beam; g.stroke();
    g.beginPath(); g.moveTo(wx, -H * 0.78); g.lineTo(wx, -H * 0.78 + 30);
    g.moveTo(wx - 14, -H * 0.78 + 15); g.lineTo(wx + 14, -H * 0.78 + 15);
    g.lineWidth = 2; g.stroke();
    // flower box
    rr(g, wx - 17, -H * 0.78 + 31, 34, 9, 3);
    g.fillStyle = P.woodDark; g.fill();
    const rand = rng(Math.abs(wx) | 0);
    for (let i = 0; i < 6; i++) {
      flower(g, wx - 13 + i * 5.2, -H * 0.78 + 30 - rand() * 3, 2.6,
        pick(rand, ['#e87a90', '#f3e9b8', '#d9598a', '#f0b35e']));
    }
  }

  // roof: one sweeping gable. Sides bow gently outward, eave line bows
  // gently down; the whole shape is filled with a sunlit gradient and
  // textured with shingle arc rows, then finished with a scalloped eave.
  const rw = W * 0.66, peak = -H - 76;
  const eaveY = -H + 22; // eave height at the outer tips
  const roofShape = () => {
    g.beginPath();
    g.moveTo(-rw - 20, eaveY);
    g.quadraticCurveTo(-rw * 0.42, peak + 16, 0, peak);
    g.quadraticCurveTo(rw * 0.42, peak + 16, rw + 20, eaveY);
    g.quadraticCurveTo(0, eaveY + 22, -rw - 20, eaveY);
    g.closePath();
  };
  roofShape();
  g.fillStyle = lingrad(g, -rw * 0.8, peak, rw * 0.6, eaveY + 16, [
    [0, '#d09058'],
    [0.5, P.roof],
    [1, P.roofDark],
  ]);
  g.fill();
  // shingle texture inside the roof
  g.save();
  roofShape();
  g.clip();
  for (let row = 0; row < 7; row++) {
    const t = (row + 0.5) / 7;
    // row baseline interpolates between the peak and the bowed eave line
    const half = rw * 0.2 + t * (rw + 2);
    const n = Math.ceil((half * 2) / 16);
    for (let i = 0; i <= n; i++) {
      const sx = -half + i * 16 + (row % 2) * 8;
      const k = Math.min(1, Math.abs(sx) / (rw + 20));
      // follow the gable: higher at center, dipping at the sides
      const sy = peak + 6 + t * (eaveY + 16 - peak) + k * k * 14;
      g.strokeStyle = 'rgba(88,44,16,0.42)';
      g.lineWidth = 2.2;
      g.beginPath();
      g.arc(sx, sy - 5, 8.8, Math.PI * 0.1, Math.PI * 0.9);
      g.stroke();
      g.strokeStyle = 'rgba(255,212,150,0.22)';
      g.lineWidth = 1.4;
      g.beginPath();
      g.arc(sx, sy - 7.4, 8.8, Math.PI * 0.2, Math.PI * 0.8);
      g.stroke();
    }
  }
  // shade the lower right of the roof for depth
  g.fillStyle = lingrad(g, 0, peak, 0, eaveY + 20, [
    [0, 'rgba(0,0,0,0)'],
    [0.7, 'rgba(70,32,10,0)'],
    [1, 'rgba(70,32,10,0.28)'],
  ]);
  g.fillRect(-rw - 22, peak, rw * 2 + 44, eaveY + 24 - peak);
  g.restore();
  // soft ink rim around the whole roof
  roofShape();
  ink(g, 2.4, 0.35);
  // scalloped eave edge hanging below the roof line
  const eaveN = Math.ceil((rw * 2 + 36) / 16);
  for (let i = 0; i <= eaveN; i++) {
    const sx = -rw - 18 + i * 16;
    const k = Math.min(1, Math.abs(sx) / (rw + 20));
    const sy = eaveY + 16.5 * (1 - k * k);
    g.fillStyle = i % 2 ? P.roofDark : '#73401b';
    ell(g, sx, sy, 8.4, 6.8);
    g.fill();
  }
  // ridge cap
  g.strokeStyle = '#73401b'; g.lineWidth = 7; g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-rw - 16, eaveY + 2);
  g.quadraticCurveTo(-rw * 0.42, peak + 17, 0, peak + 1);
  g.stroke();
  g.strokeStyle = P.roofLight; g.lineWidth = 4;
  g.beginPath();
  g.moveTo(-rw - 14, eaveY + 1);
  g.quadraticCurveTo(-rw * 0.42, peak + 16, 0, peak);
  g.stroke();

  // round attic window
  ell(g, 0, peak + 52, 13, 13);
  g.fillStyle = '#fdf3cf'; g.fill();
  g.lineWidth = 4; g.strokeStyle = P.beam; g.stroke();
  g.beginPath();
  g.moveTo(-13, peak + 52); g.lineTo(13, peak + 52);
  g.moveTo(0, peak + 39); g.lineTo(0, peak + 65);
  g.lineWidth = 2; g.stroke();

  // chimney (stone, top-right of roof)
  g.save();
  g.translate(rw * 0.52, peak + 38);
  rr(g, -11, -34, 22, 40, 3);
  g.fillStyle = vgrad(g, -34, 6, P.stone, P.stoneDark); g.fill();
  ink(g, 1.6, 0.3);
  rr(g, -14, -40, 28, 9, 3);
  g.fillStyle = P.stoneDark; g.fill();
  g.fillStyle = 'rgba(255,255,255,0.25)';
  for (let i = 0; i < 4; i++) {
    ell(g, -4 + (i % 2) * 8, -28 + i * 7, 4.5, 3);
    g.fill();
  }
  g.restore();

  // climbing ivy on the left wall
  const rand = rng(77);
  g.fillStyle = 'rgba(95,108,46,0.9)';
  for (let i = 0; i < 16; i++) {
    ell(g, -W / 2 + 4 + rand() * 22, -H * (0.2 + rand() * 0.75), 5 + rand() * 4, 4 + rand() * 3);
    g.fill();
  }
  g.fillStyle = 'rgba(150,160,70,0.8)';
  for (let i = 0; i < 9; i++) {
    ell(g, -W / 2 + 4 + rand() * 18, -H * (0.3 + rand() * 0.6), 3 + rand() * 2.5, 2.5 + rand() * 2);
    g.fill();
  }

  // stone step
  rr(g, -26, -2, 52, 10, 5);
  g.fillStyle = P.stone; g.fill(); ink(g, 1.4, 0.25);
  g.restore();
}

// --- signpost with a little icon plaque ----------------------------------
export function signpost(g, x, y, icon, s = 1, rot = 0) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.rotate(rot);
  shadow(g, 0, 2, 22, 8, 0.22);
  g.fillStyle = P.woodDark;
  rr(g, -3.5, -46, 7, 48, 3); g.fill();
  // plaque
  rr(g, -24, -70, 48, 34, 7);
  g.fillStyle = vgrad(g, -70, -36, P.woodLight, P.wood);
  g.fill();
  g.lineWidth = 3; g.strokeStyle = P.woodDeep; g.stroke();
  // nails
  g.fillStyle = P.woodDeep;
  for (const [nx, ny] of [[-18, -64], [18, -64], [-18, -42], [18, -42]]) {
    ell(g, nx, ny, 1.8, 1.8); g.fill();
  }
  drawIcon(g, icon, 0, -53, 13);
  g.restore();
}

// Simple emblem icons used on signs and UI.
export function drawIcon(g, icon, x, y, s) {
  g.save();
  g.translate(x, y);
  const k = s / 13;
  g.scale(k, k);
  g.lineCap = 'round'; g.lineJoin = 'round';
  if (icon === 'sword') {
    g.strokeStyle = '#e8e4d8'; g.lineWidth = 4.5;
    g.beginPath(); g.moveTo(-6, 6); g.lineTo(7, -7); g.stroke();
    g.strokeStyle = P.woodDeep; g.lineWidth = 3.4;
    g.beginPath(); g.moveTo(-2.5, -0.5); g.lineTo(-7.5, 4.5); g.stroke();
    g.beginPath(); g.moveTo(-6, 1); g.lineTo(-1, 6); g.stroke();
  } else if (icon === 'fish') {
    g.fillStyle = '#9fc4c4';
    ell(g, -1, 0, 7.5, 4.5); g.fill();
    g.beginPath(); g.moveTo(5.5, 0); g.lineTo(11, -4.5); g.lineTo(11, 4.5); g.closePath(); g.fill();
    g.fillStyle = '#3b3225';
    ell(g, -5, -1, 1.2, 1.2); g.fill();
  } else if (icon === 'berry') {
    g.fillStyle = '#7f8636';
    ell(g, 0, -5, 7, 4); g.fill();
    g.fillStyle = P.berry;
    for (const [bx, by] of [[-4, 1], [1, 3], [5, 0]]) { ell(g, bx, by, 3.4, 3.4); g.fill(); }
  } else if (icon === 'house') {
    g.fillStyle = P.roof;
    g.beginPath(); g.moveTo(-9, 0); g.lineTo(0, -8); g.lineTo(9, 0); g.closePath(); g.fill();
    g.fillStyle = P.plaster; g.fillRect(-6, 0, 12, 8);
    g.fillStyle = P.woodDark; g.fillRect(-2, 2, 4, 6);
  } else if (icon === 'turnip') {
    g.fillStyle = P.turnipPurple;
    ell(g, 0, 2, 6, 5.5); g.fill();
    g.fillStyle = P.turnip;
    ell(g, 0, 3.5, 5, 4); g.fill();
    g.strokeStyle = '#5d662b'; g.lineWidth = 2.6;
    g.beginPath(); g.moveTo(0, -2); g.quadraticCurveTo(-3, -7, -5, -8); g.stroke();
    g.beginPath(); g.moveTo(0, -2); g.quadraticCurveTo(3, -7, 5, -8); g.stroke();
  }
  g.restore();
}

// --- log + flower border segment (used around map rims) ------------------
export function logBorder(g, x, y, len, seed, horizontal = true) {
  const rand = rng(seed);
  g.save();
  g.translate(x, y);
  if (!horizontal) g.rotate(Math.PI / 2);
  rr(g, 0, -7, len, 14, 7);
  g.fillStyle = vgrad(g, -7, 7, P.woodLight, P.woodDark);
  g.fill(); ink(g, 1.6, 0.3);
  g.fillStyle = 'rgba(70,45,22,0.4)';
  for (let i = 14; i < len - 8; i += 22 + rand() * 10) {
    ell(g, i, 0, 1.6, 4.5); g.fill();
  }
  for (let i = 8; i < len - 6; i += 14 + rand() * 16) {
    if (rand() < 0.6) flower(g, i, -9 - rand() * 4, 3, pick(rand, ['#e87a90', '#f3e9b8', '#f0f0e2', '#e8d57a']));
    else tuft(g, i, -6, 5, 'rgba(110,120,50,0.8)');
  }
  g.restore();
}

// --- tilled soil plot (one cell) -----------------------------------------
export function soilPlot(g, x, y, size, watered = false) {
  const h = size * 0.78;
  g.save();
  g.translate(x, y);
  rr(g, -size / 2, -h / 2, size, h, 9);
  g.fillStyle = watered ? '#503823' : P.soil;
  g.fill();
  g.lineWidth = 3; g.strokeStyle = 'rgba(58,38,20,0.55)'; g.stroke();
  // inner furrow rows
  g.strokeStyle = watered ? 'rgba(38,24,12,0.6)' : 'rgba(58,38,20,0.5)';
  g.lineWidth = 3.6; g.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    g.beginPath();
    g.moveTo(-size * 0.32, i * h * 0.26);
    g.lineTo(size * 0.32, i * h * 0.26);
    g.stroke();
  }
  // crumb highlights
  const rand = rng((x * 31 + y * 17) | 0);
  g.fillStyle = 'rgba(160,120,80,0.5)';
  for (let i = 0; i < 8; i++) {
    ell(g, (rand() - 0.5) * size * 0.8, (rand() - 0.5) * h * 0.7, 1.6, 1.1);
    g.fill();
  }
  g.restore();
}

// --- crops, by kind and growth t in [0,1] --------------------------------
export function crop(g, x, y, kind, t, sway = 0) {
  g.save();
  g.translate(x, y);
  const leafCol = ['#6d8b3a', '#56732e'];
  if (t < 0.18) {
    // freshly planted mound + sprout dot
    g.fillStyle = 'rgba(120,90,55,0.9)';
    ell(g, 0, 0, 7, 4); g.fill();
    if (t > 0.08) {
      g.strokeStyle = '#7fa53f'; g.lineWidth = 2.4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, 1); g.lineTo(0, -5); g.stroke();
    }
    g.restore();
    return;
  }
  const grown = t >= 1;
  const k = 0.45 + t * 0.6; // overall scale
  g.rotate(sway * 0.06);
  // leaves
  const leaves = grown ? 5 : 4;
  for (let i = 0; i < leaves; i++) {
    const a = -Math.PI / 2 + (i - (leaves - 1) / 2) * 0.52;
    const L = 13 * k * (0.85 + (i % 2) * 0.3);
    g.strokeStyle = leafCol[i % 2];
    g.lineWidth = 3.4 * k; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(0, -2);
    g.quadraticCurveTo(Math.cos(a) * L * 0.6, -2 + Math.sin(a) * L * 0.7, Math.cos(a) * L, -2 + Math.sin(a) * L);
    g.stroke();
    g.fillStyle = leafCol[i % 2];
    ell(g, Math.cos(a) * L, -2 + Math.sin(a) * L, 4.6 * k, 3.2 * k);
    g.fill();
  }
  if (grown) {
    // the visible vegetable peeking from the soil
    if (kind === 'turnip') {
      g.fillStyle = P.turnipPurple; ell(g, 0, 1, 8.5, 7); g.fill();
      g.fillStyle = P.turnip; ell(g, 0, 2.5, 7, 5.4); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.6)'; ell(g, -2.5, 0.5, 2.2, 1.6); g.fill();
    } else if (kind === 'radish') {
      g.fillStyle = P.radish; ell(g, 0, 1.5, 7, 6); g.fill();
      g.fillStyle = '#f3c9cd'; ell(g, 0, 4.5, 4.5, 2.6); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.5)'; ell(g, -2.2, -0.5, 2, 1.4); g.fill();
    } else if (kind === 'carrot') {
      g.fillStyle = P.carrot; ell(g, 0, 1.5, 6, 5); g.fill();
      g.fillStyle = '#f2a45e'; ell(g, -1.5, 0.5, 2.4, 1.6); g.fill();
    }
  }
  g.restore();
}

// --- shipping box ---------------------------------------------------------
export function shippingBox(g, x, y, s = 1) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  shadow(g, 0, 3, 44, 13, 0.24);
  // body
  rr(g, -38, -44, 76, 46, 6);
  g.fillStyle = vgrad(g, -44, 2, P.woodLight, P.woodDark); g.fill();
  ink(g, 2, 0.35);
  // planks
  g.strokeStyle = 'rgba(70,45,22,0.45)'; g.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    g.beginPath(); g.moveTo(-38, -22 + i * 13); g.lineTo(38, -22 + i * 13); g.stroke();
  }
  // corner braces
  g.strokeStyle = P.woodDeep; g.lineWidth = 5;
  for (const bx of [-33, 33]) {
    g.beginPath(); g.moveTo(bx, -44); g.lineTo(bx, 2); g.stroke();
  }
  // open lid leaned back
  rr(g, -36, -58, 72, 14, 4);
  g.fillStyle = P.wood; g.fill(); ink(g, 1.8, 0.3);
  // turnips heaped inside
  const rand = rng(9);
  for (let i = 0; i < 6; i++) {
    const tx = -24 + i * 9.6 + (rand() - 0.5) * 5, ty = -46 - rand() * 6;
    g.strokeStyle = '#5d662b'; g.lineWidth = 2.4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(tx, ty - 4); g.quadraticCurveTo(tx - 2, ty - 10, tx - 4, ty - 12); g.stroke();
    g.beginPath(); g.moveTo(tx, ty - 4); g.quadraticCurveTo(tx + 2, ty - 10, tx + 4, ty - 12); g.stroke();
    g.fillStyle = P.turnipPurple; ell(g, tx, ty, 7, 6.4); g.fill();
    g.fillStyle = P.turnip; ell(g, tx, ty + 2.2, 5.8, 4.2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.55)';
    ell(g, tx - 2.2, ty - 1.6, 1.9, 1.3); g.fill();
  }
  g.restore();
}

// --- ruin gate on the farm edge -------------------------------------------
export function ruinGate(g, x, y, s = 1) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  shadow(g, 0, 4, 70, 18, 0.28);
  // broken columns + arch
  for (const px of [-52, 52]) {
    rr(g, px - 14, -86, 28, 88, [6, 6, 2, 2]);
    g.fillStyle = vgrad(g, -86, 2, P.ruinLight, P.ruinDark); g.fill();
    ink(g, 2, 0.35);
    g.strokeStyle = 'rgba(40,32,50,0.35)'; g.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      g.beginPath(); g.moveTo(px - 14, -66 + i * 22); g.lineTo(px + 14, -66 + i * 22); g.stroke();
    }
    rr(g, px - 18, -94, 36, 12, 3);
    g.fillStyle = P.ruinDark; g.fill();
  }
  // cracked lintel
  g.beginPath();
  g.moveTo(-66, -84);
  g.quadraticCurveTo(0, -122, 66, -84);
  g.lineTo(58, -72);
  g.quadraticCurveTo(0, -106, -58, -72);
  g.closePath();
  g.fillStyle = P.ruin; g.fill(); ink(g, 2, 0.35);
  // dark doorway
  g.beginPath();
  g.moveTo(-38, 0);
  g.lineTo(-38, -58);
  g.quadraticCurveTo(0, -86, 38, -58);
  g.lineTo(38, 0);
  g.closePath();
  g.fillStyle = lingrad(g, 0, -86, 0, 0, [[0, '#241f30'], [1, '#3c3450']]);
  g.fill();
  // glowing rune
  g.fillStyle = P.rune;
  g.globalAlpha = 0.9;
  ell(g, 0, -100, 4, 4); g.fill();
  g.globalAlpha = 0.35;
  ell(g, 0, -100, 10, 10); g.fill();
  g.globalAlpha = 1;
  // moss
  g.fillStyle = 'rgba(110,125,53,0.7)';
  for (const [mx, my, mr] of [[-52, -8, 9], [56, -20, 7], [-44, -70, 6], [30, -88, 5]]) {
    ell(g, mx, my, mr, mr * 0.6); g.fill();
  }
  g.restore();
}

// --- village shop stall/house ---------------------------------------------
export function shopHouse(g, x, y, opts) {
  const { awning = '#c75e5e', awning2 = '#f0e6d0', sign = 'turnip', w = 150, h = 96 } = opts || {};
  g.save();
  g.translate(x, y);
  shadow(g, 0, 5, w * 0.62, 24, 0.25);
  // wall
  rr(g, -w / 2, -h, w, h, [6, 6, 9, 9]);
  g.fillStyle = vgrad(g, -h, 0, P.plaster, P.plasterShade); g.fill();
  ink(g, 2, 0.3);
  // roof
  g.beginPath();
  g.moveTo(-w / 2 - 14, -h + 8);
  g.quadraticCurveTo(0, -h - 52, w / 2 + 14, -h + 8);
  g.lineTo(w / 2 + 2, -h + 18);
  g.quadraticCurveTo(0, -h - 36, -w / 2 - 2, -h + 18);
  g.closePath();
  g.fillStyle = P.roofDark; g.fill();
  g.beginPath();
  g.moveTo(-w / 2 - 8, -h + 12);
  g.quadraticCurveTo(0, -h - 46, w / 2 + 8, -h + 12);
  g.lineTo(0, -h - 44);
  g.closePath();
  g.fillStyle = vgrad(g, -h - 46, -h + 12, P.roofLight, P.roof); g.fill();
  g.strokeStyle = 'rgba(80,40,14,0.3)'; g.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    g.beginPath();
    g.moveTo(-w / 2 - 8 + i * 6, -h + 12 - i * 2);
    g.quadraticCurveTo(0, -h - 46 + i * 8, w / 2 + 8 - i * 6, -h + 12 - i * 2);
    g.stroke();
  }
  // scalloped awning over counter
  const aw = w * 0.74;
  for (let i = 0; i < 6; i++) {
    const sx = -aw / 2 + (i + 0.5) * (aw / 6);
    g.fillStyle = i % 2 ? awning2 : awning;
    g.beginPath();
    g.rect(sx - aw / 12, -h * 0.56, aw / 6, 14);
    g.arc(sx, -h * 0.56 + 14, aw / 12, 0, Math.PI);
    g.fill();
  }
  // counter
  rr(g, -aw / 2, -h * 0.34, aw, h * 0.3, 5);
  g.fillStyle = vgrad(g, -h * 0.34, -h * 0.04, P.woodLight, P.woodDark); g.fill();
  ink(g, 1.8, 0.3);
  // hanging sign
  g.strokeStyle = P.woodDeep; g.lineWidth = 2.4;
  g.beginPath(); g.moveTo(-w * 0.38, -h); g.lineTo(-w * 0.38, -h - 4); g.stroke();
  rr(g, -w * 0.38 - 15, -h - 34, 30, 30, 6);
  g.fillStyle = P.wood; g.fill();
  g.lineWidth = 2.6; g.strokeStyle = P.woodDeep; g.stroke();
  drawIcon(g, sign, -w * 0.38, -h - 19, 10);
  g.restore();
}

// --- blacksmith forge add-on ----------------------------------------------
export function anvil(g, x, y, s = 1) {
  g.save();
  g.translate(x, y); g.scale(s, s);
  shadow(g, 0, 2, 20, 7, 0.25);
  g.fillStyle = '#5a5560';
  rr(g, -10, -8, 20, 8, 2); g.fill();
  g.beginPath();
  g.moveTo(-13, -16); g.lineTo(10, -16); g.quadraticCurveTo(20, -15, 22, -11);
  g.lineTo(8, -10) ; g.lineTo(-13, -10); g.closePath();
  g.fillStyle = vgrad(g, -16, -8, '#8b8694', '#5a5560'); g.fill();
  ink(g, 1.4, 0.4);
  g.restore();
}

// --- chest (house interior) -----------------------------------------------
export function chest(g, x, y, s = 1) {
  g.save();
  g.translate(x, y); g.scale(s, s);
  shadow(g, 0, 2, 26, 9, 0.25);
  rr(g, -22, -26, 44, 26, [4, 4, 6, 6]);
  g.fillStyle = vgrad(g, -26, 0, P.woodLight, P.woodDark); g.fill();
  ink(g, 2, 0.35);
  rr(g, -22, -34, 44, 12, [8, 8, 2, 2]);
  g.fillStyle = P.wood; g.fill(); ink(g, 2, 0.3);
  g.strokeStyle = '#caa84e'; g.lineWidth = 3.4;
  g.beginPath(); g.moveTo(-14, -34); g.lineTo(-14, 0); g.moveTo(14, -34); g.lineTo(14, 0); g.stroke();
  g.fillStyle = '#caa84e';
  rr(g, -4, -26, 8, 10, 2); g.fill();
  g.restore();
}

// --- dock planks over water -------------------------------------------------
export function dock(g, x, y, len, s = 1) {
  g.save();
  g.translate(x, y); g.scale(s, s);
  rr(g, -18, 0, 36, len, 4);
  g.fillStyle = vgrad(g, 0, len, P.woodLight, P.wood); g.fill();
  ink(g, 2, 0.35);
  g.strokeStyle = 'rgba(70,45,22,0.45)'; g.lineWidth = 2;
  for (let i = 12; i < len; i += 14) {
    g.beginPath(); g.moveTo(-18, i); g.lineTo(18, i); g.stroke();
  }
  for (const [px, py] of [[-16, 6], [16, 6], [-16, len - 8], [16, len - 8]]) {
    ell(g, px, py, 4, 4);
    g.fillStyle = P.woodDeep; g.fill();
  }
  g.restore();
}

// --- chicken coop ----------------------------------------------------------
export function coop(g, x, y, s = 1) {
  g.save();
  g.translate(x, y); g.scale(s, s);
  shadow(g, 0, 3, 40, 13, 0.24);
  rr(g, -34, -44, 68, 44, [5, 5, 8, 8]);
  g.fillStyle = vgrad(g, -44, 0, '#cf9a5c', '#a06b38'); g.fill();
  ink(g, 2, 0.3);
  // slanted roof
  g.beginPath();
  g.moveTo(-42, -40); g.lineTo(0, -64); g.lineTo(42, -40);
  g.lineTo(34, -34); g.lineTo(0, -54); g.lineTo(-34, -34);
  g.closePath();
  g.fillStyle = P.roof; g.fill(); ink(g, 1.8, 0.3);
  // round door
  ell(g, 0, -16, 12, 14);
  g.fillStyle = '#3c2c18'; g.fill();
  g.strokeStyle = P.woodDeep; g.lineWidth = 3; g.stroke();
  // tiny heart
  g.fillStyle = '#e2566a';
  g.save(); g.translate(0, -48); g.scale(0.5, 0.5);
  heartPath(g); g.fill();
  g.restore();
  g.restore();
}

export function heartPath(g) {
  g.beginPath();
  g.moveTo(0, 6);
  g.bezierCurveTo(-9, -2, -7, -10, 0, -5);
  g.bezierCurveTo(7, -10, 9, -2, 0, 6);
  g.closePath();
}

// --- generic stone wall edge for ruin rooms ---------------------------------
export function ruinPillar(g, x, y, s = 1, seed = 1) {
  const rand = rng(seed);
  g.save();
  g.translate(x, y); g.scale(s, s);
  shadow(g, 0, 2, 22, 8, 0.3);
  const h = 60 + rand() * 30;
  rr(g, -12, -h, 24, h, [4, 4, 2, 2]);
  g.fillStyle = vgrad(g, -h, 0, P.ruinLight, P.ruinDark); g.fill();
  ink(g, 1.8, 0.35);
  g.strokeStyle = 'rgba(40,32,50,0.4)'; g.lineWidth = 1.6;
  for (let i = 1; i < 4; i++) {
    g.beginPath(); g.moveTo(-12, -h + i * (h / 4)); g.lineTo(12, -h + i * (h / 4)); g.stroke();
  }
  if (rand() < 0.7) {
    rr(g, -15, -h - 8, 30, 10, 3);
    g.fillStyle = P.ruinDark; g.fill();
  }
  g.fillStyle = 'rgba(110,125,53,0.6)';
  ell(g, -6 + rand() * 12, -6, 8, 4); g.fill();
  g.restore();
}

export function brazier(g, x, y, lit, s = 1) {
  g.save();
  g.translate(x, y); g.scale(s, s);
  shadow(g, 0, 1, 14, 5, 0.3);
  g.fillStyle = '#4a4456';
  rr(g, -4, -18, 8, 18, 2); g.fill();
  g.beginPath(); g.moveTo(-12, -26); g.lineTo(12, -26); g.lineTo(8, -17); g.lineTo(-8, -17); g.closePath();
  g.fillStyle = '#5c5366'; g.fill(); ink(g, 1.4, 0.4);
  if (lit) {
    g.fillStyle = radgrad(g, 0, -32, 18, [[0, 'rgba(185,240,224,0.5)'], [1, 'rgba(185,240,224,0)']]);
    ell(g, 0, -32, 18, 18); g.fill();
    g.fillStyle = P.rune;
    g.beginPath();
    g.moveTo(0, -40); g.quadraticCurveTo(7, -32, 0, -25); g.quadraticCurveTo(-7, -32, 0, -40);
    g.fill();
  }
  g.restore();
}
