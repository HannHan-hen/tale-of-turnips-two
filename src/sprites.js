// Animated characters: the farmer, the chicken, villagers and ruin
// creatures. All vector-drawn, chibi proportions, anchored at the feet.

import { TAU, rng } from './util.js';
import { P, INK } from './palette.js';
import { rr, ell, shadow, vgrad, radgrad, ink } from './art.js';
import { heartPath } from './props.js';

// ---------------------------------------------------------------- farmer --
// facing: 'down' | 'up' | 'left' | 'right'; phase: walk cycle [0,1);
// moving: bool; swing: attack progress [0,1] or -1; opts: {hat, boots...}
export function farmer(g, x, y, facing, phase, moving, swing = -1, opts = {}) {
  const side = facing === 'left' || facing === 'right';
  const flip = facing === 'left' ? -1 : 1;
  const bob = moving ? Math.abs(Math.sin(phase * TAU)) * 1.6 : Math.sin(phase * TAU * 0.5) * 0.5;
  const legA = moving ? Math.sin(phase * TAU) * 4.2 : 0;
  const scale = opts.scale || 1.22;

  g.save();
  g.translate(x, y);
  shadow(g, 0, 1, 13 * scale, 4.6 * scale, 0.26);
  g.scale(side ? flip * scale : scale, scale);
  g.translate(0, -bob);

  const skin = P.skin, skinSh = P.skinShade;
  const shirt = '#f4ead2', shirtSh = '#ddcca6';
  const denim = '#c8a16b', denimSh = '#a87f4c', denimHi = '#dbb87f';
  const boot = '#7a4f2a', bootSh = '#5d3a1d';

  // --- legs / boots
  for (const dir of [-1, 1]) {
    const lx = dir * 4.6;
    const ly = dir * legA;
    g.fillStyle = dir === -1 ? denimSh : denim;
    rr(g, lx - 3.6, -14 + Math.min(0, ly), 7.2, 10 + Math.abs(ly) * 0.4, 3);
    g.fill();
    g.fillStyle = dir === -1 ? bootSh : boot;
    rr(g, lx - 4, -6 + ly * 0.9, 8, 6, [3, 3, 2.5, 2.5]);
    g.fill();
  }

  // --- torso: overalls over cream shirt
  // shirt sleeves/arms
  const armSwing = moving ? Math.sin(phase * TAU + Math.PI) * 3 : 0;
  for (const dir of [-1, 1]) {
    if (side && dir === -1) continue; // far arm hidden-ish on side view
    const ax = dir * (side ? 7.5 : 8.6);
    g.fillStyle = dir === -1 ? shirtSh : shirt;
    g.save();
    g.translate(ax, -23);
    g.rotate(dir * 0.18 + (side ? armSwing * 0.12 : dir * armSwing * 0.05));
    rr(g, -2.8, 0, 5.6, 11, 2.8);
    g.fill();
    g.fillStyle = dir === -1 ? skinSh : skin;
    ell(g, 0, 11, 2.8, 2.8);
    g.fill();
    g.restore();
  }
  // body
  rr(g, -8.5, -26, 17, 14, [6, 6, 5, 5]);
  g.fillStyle = vgrad(g, -26, -12, shirt, shirtSh);
  g.fill();
  // overall bib + skirt of overalls
  rr(g, -7.5, -21.5, 15, 10.5, [4, 4, 5, 5]);
  g.fillStyle = vgrad(g, -22, -11, denimHi, denim);
  g.fill();
  rr(g, -5, -25.5, 10, 7, [2.5, 2.5, 0, 0]);
  g.fillStyle = denim;
  g.fill();
  // straps + buttons
  g.strokeStyle = denimSh; g.lineWidth = 2.2; g.lineCap = 'round';
  for (const dir of [-1, 1]) {
    g.beginPath();
    g.moveTo(dir * 4, -25);
    g.lineTo(dir * 6.4, -28.5);
    g.stroke();
  }
  g.fillStyle = '#f2c14e';
  ell(g, -3.6, -24, 1.1, 1.1); g.fill();
  ell(g, 3.6, -24, 1.1, 1.1); g.fill();
  // pocket
  rr(g, -3, -19, 6, 4.5, 1.5);
  g.strokeStyle = denimSh; g.lineWidth = 1.4; g.stroke();

  // --- head
  const hy = -36;
  // back hair mass
  g.fillStyle = P.hairBlondeDark;
  ell(g, 0, hy + 1, 10.6, 10.2);
  g.fill();
  // face
  g.fillStyle = skin;
  ell(g, 0, hy + 1.6, 9.2, 8.8);
  g.fill();
  g.fillStyle = 'rgba(227,185,142,0.55)';
  ell(g, 0, hy + 6.5, 6.5, 3.4); // jaw shading
  g.fill();

  if (facing !== 'up') {
    const ex = side ? 3.2 : 0;
    // eyes (bright green, like the raws)
    for (const dir of side ? [1] : [-1, 1]) {
      const eox = ex + dir * (side ? 2.6 : 3.6);
      g.fillStyle = '#fff';
      ell(g, eox, hy + 2.6, 2.5, 3.0); g.fill();
      g.fillStyle = '#4e9a4e';
      ell(g, eox + 0.3, hy + 3.0, 1.7, 2.2); g.fill();
      g.fillStyle = '#2c3320';
      ell(g, eox + 0.3, hy + 3.2, 0.95, 1.4); g.fill();
      g.fillStyle = '#fff';
      ell(g, eox - 0.4, hy + 2.0, 0.7, 0.9); g.fill();
    }
    if (side) {
      g.fillStyle = '#4e3a22';
      ell(g, ex + 2.6, hy - 0.9, 2.2, 0.7); g.fill(); // brow
    }
    // blush + smile
    g.fillStyle = 'rgba(240,169,140,0.55)';
    ell(g, (side ? 1 : -5.4), hy + 5.6, 1.8, 1.1); g.fill();
    if (!side) { ell(g, 5.4, hy + 5.6, 1.8, 1.1); g.fill(); }
    g.strokeStyle = '#a4633c'; g.lineWidth = 1.1; g.lineCap = 'round';
    g.beginPath();
    g.arc(side ? 4.4 : 0, hy + 5.4, 1.8, 0.25, Math.PI - 0.25);
    g.stroke();
  }

  // front hair: swooping fringe
  g.fillStyle = P.hairBlonde;
  g.beginPath();
  if (facing === 'up') {
    ell(g, 0, hy - 0.5, 9.8, 9.4);
  } else {
    g.moveTo(-9.6, hy + 2.5);
    g.quadraticCurveTo(-10.5, hy - 8.5, 0, hy - 8.8);
    g.quadraticCurveTo(10.5, hy - 8.5, 9.6, hy + 2.5);
    g.quadraticCurveTo(8.5, hy - 1, 4.5, hy - 2.2);
    g.quadraticCurveTo(5.5, hy + 0.4, 4.2, hy + 1.4);
    g.quadraticCurveTo(1.5, hy - 2.8, -2.5, hy - 2.0);
    g.quadraticCurveTo(-7.5, hy - 1.2, -9.6, hy + 2.5);
  }
  g.closePath();
  g.fill();
  // hair sheen
  g.fillStyle = 'rgba(255,233,170,0.6)';
  ell(g, -3, hy - 6, 4.6, 2.0);
  g.fill();
  // ponytail bun + bow (visible from all but straight-down... keep always)
  const px2 = facing === 'up' ? 0 : side ? -7.5 : 0;
  const py2 = facing === 'up' ? hy + 3 : hy - 8.5;
  g.fillStyle = P.hairBlonde;
  ell(g, px2, py2, 4.6, 4.2); g.fill();
  g.fillStyle = P.hairBlondeDark;
  ell(g, px2 + 1, py2 + 1.2, 3.0, 2.6); g.fill();
  // bow
  g.fillStyle = '#8a5a30';
  for (const dir of [-1, 1]) {
    g.beginPath();
    g.moveTo(px2, py2 + 1);
    g.quadraticCurveTo(px2 + dir * 5.5, py2 - 2.5, px2 + dir * 4.5, py2 + 3.5);
    g.closePath();
    g.fill();
  }

  // --- sword swing arc
  if (swing >= 0 && swing <= 1) {
    const a0 = -2.0, a1 = 0.9;
    const a = a0 + (a1 - a0) * swing;
    g.save();
    g.translate(side ? 6 : 8, -22);
    g.rotate(a);
    // blade
    g.fillStyle = '#eceadf';
    rr(g, -1.8, -21, 3.6, 16, 1.8);
    g.fill();
    g.strokeStyle = 'rgba(90,90,80,0.5)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = '#caa84e';
    rr(g, -4.5, -6, 9, 2.6, 1.3); g.fill();
    rr(g, -1.4, -4, 2.8, 6, 1.4); g.fill();
    // motion arc
    g.restore();
    g.strokeStyle = `rgba(255,250,220,${0.5 * (1 - swing)})`;
    g.lineWidth = 5;
    g.beginPath();
    g.arc(side ? 6 : 8, -22, 22, a0 - 1.4, a - 1.4);
    g.stroke();
  }

  g.restore();
}

// --------------------------------------------------------------- chicken --
export function chicken(g, x, y, t, pecking = false) {
  const bob = Math.sin(t * 3) * 0.8;
  const peck = pecking ? Math.abs(Math.sin(t * 14)) * 5 : 0;
  g.save();
  g.translate(x, y);
  shadow(g, 0, 1, 11, 4, 0.22);
  g.translate(0, -bob);
  // body
  g.fillStyle = vgrad(g, -20, -2, '#ffffff', '#e4ddc8');
  g.beginPath();
  g.moveTo(-10, -8);
  g.quadraticCurveTo(-13, -18, -2, -19);
  g.quadraticCurveTo(9, -19.5, 10.5, -11);
  g.quadraticCurveTo(11, -4.5, 3, -3);
  g.quadraticCurveTo(-7, -2.5, -10, -8);
  g.closePath();
  g.fill();
  ink(g, 1.3, 0.25);
  // tail feathers
  g.fillStyle = '#f0ead8';
  for (let i = 0; i < 3; i++) {
    ell(g, -10 + i, -13 - i * 2.6, 3.4, 5 - i);
    g.fill();
  }
  // wing
  g.fillStyle = '#efe8d4';
  ell(g, -1, -10, 5.5, 4);
  g.fill();
  g.strokeStyle = 'rgba(120,110,90,0.35)'; g.lineWidth = 1.2;
  g.beginPath(); g.arc(-1, -10, 4.5, -0.4, 1.4); g.stroke();
  // head
  g.save();
  g.translate(8, -16 + peck);
  g.rotate(peck * 0.06);
  g.fillStyle = '#ffffff';
  ell(g, 0, 0, 5.2, 5); g.fill();
  // comb
  g.fillStyle = '#d9534f';
  for (let i = 0; i < 3; i++) {
    ell(g, -2 + i * 2.4, -5 - (i === 1 ? 1.4 : 0.4), 1.7, 2.2);
    g.fill();
  }
  // beak + wattle + eye
  g.fillStyle = '#e8a33d';
  g.beginPath(); g.moveTo(4, -0.5); g.lineTo(8.5, 1); g.lineTo(4, 2.5); g.closePath(); g.fill();
  g.fillStyle = '#d9534f';
  ell(g, 3.4, 3.4, 1.5, 2); g.fill();
  g.fillStyle = '#3b3225';
  ell(g, 1.6, -1.2, 1.1, 1.3); g.fill();
  g.restore();
  // legs
  g.strokeStyle = '#e8a33d'; g.lineWidth = 1.6; g.lineCap = 'round';
  for (const dx of [-3, 2]) {
    g.beginPath();
    g.moveTo(dx, -3); g.lineTo(dx + Math.sin(t * 6 + dx) * (peck ? 0 : 0.8), 0.5);
    g.stroke();
  }
  g.restore();
}

// ------------------------------------------------------------ villagers --
// A parametric chibi villager. Static poses with idle sway.
export function villager(g, x, y, t, look) {
  const sway = Math.sin(t * 1.4 + (look.seed || 0)) * 0.6;
  g.save();
  g.translate(x, y);
  shadow(g, 0, 1, 13, 4.6, 0.24);
  g.translate(0, -Math.abs(sway) * 0.5);

  const skin = look.skin || P.skin;
  // legs
  g.fillStyle = look.pants || '#6b5a40';
  for (const dir of [-1, 1]) {
    rr(g, dir * 4.6 - 3.4, -13, 6.8, 9, 3); g.fill();
  }
  g.fillStyle = look.shoes || '#4f3a22';
  for (const dir of [-1, 1]) {
    rr(g, dir * 4.6 - 3.8, -6, 7.6, 6, [3, 3, 2.5, 2.5]); g.fill();
  }
  // robe / torso
  const robe = look.top || '#7d8a5a';
  rr(g, -9, -27, 18, 16, [6, 6, 6, 6]);
  g.fillStyle = vgrad(g, -27, -11, robe, shadeColor(robe, -22));
  g.fill();
  if (look.apron) {
    rr(g, -6.5, -22, 13, 11, [3, 3, 5, 5]);
    g.fillStyle = look.apron; g.fill();
    g.strokeStyle = 'rgba(90,70,40,0.4)'; g.lineWidth = 1.2;
    rr(g, -3.5, -19, 7, 5, 1.5); g.stroke();
  }
  // arms
  for (const dir of [-1, 1]) {
    g.fillStyle = robe;
    g.save();
    g.translate(dir * 8.8, -24);
    g.rotate(dir * 0.22);
    rr(g, -2.8, 0, 5.6, 10.5, 2.8); g.fill();
    g.fillStyle = skin;
    ell(g, 0, 10.5, 2.7, 2.7); g.fill();
    g.restore();
  }
  // belly emphasis for burly characters
  if (look.burly) {
    g.fillStyle = shadeColor(robe, -12);
    ell(g, 0, -15, 7.5, 5); g.fill();
  }

  // head
  const hy = -37;
  g.fillStyle = look.hairBack || look.hair || '#888';
  ell(g, 0, hy + 1, 10.6, 10.2); g.fill();
  g.fillStyle = skin;
  ell(g, 0, hy + 1.6, 9.2, 8.8); g.fill();

  // eyes
  for (const dir of [-1, 1]) {
    if (look.elderEyes) {
      g.strokeStyle = '#5a4632'; g.lineWidth = 1.4; g.lineCap = 'round';
      g.beginPath();
      g.arc(dir * 3.6, hy + 3, 1.9, Math.PI + 0.4, TAU - 0.4);
      g.stroke();
    } else {
      g.fillStyle = '#fff';
      ell(g, dir * 3.6, hy + 2.6, 2.4, 2.9); g.fill();
      g.fillStyle = look.eyes || '#5d7fa0';
      ell(g, dir * 3.6 + 0.3, hy + 3.0, 1.6, 2.1); g.fill();
      g.fillStyle = '#2a2a30';
      ell(g, dir * 3.6 + 0.3, hy + 3.2, 0.9, 1.3); g.fill();
      g.fillStyle = '#fff';
      ell(g, dir * 3.6 - 0.4, hy + 2.0, 0.65, 0.85); g.fill();
    }
  }
  // blush / freckles
  if (look.blush) {
    g.fillStyle = 'rgba(240,169,140,0.5)';
    ell(g, -5.4, hy + 5.6, 1.8, 1.1); g.fill();
    ell(g, 5.4, hy + 5.6, 1.8, 1.1); g.fill();
  }
  // mouth
  g.strokeStyle = '#a4633c'; g.lineWidth = 1.1; g.lineCap = 'round';
  g.beginPath();
  if (look.shy) g.arc(0, hy + 6.4, 1.2, 0.4, Math.PI - 0.4);
  else g.arc(0, hy + 5.4, 1.9, 0.25, Math.PI - 0.25);
  g.stroke();

  // hair styles
  g.fillStyle = look.hair || '#888';
  if (look.hairstyle === 'bun') {
    g.beginPath();
    g.moveTo(-9.6, hy + 3);
    g.quadraticCurveTo(-10.5, hy - 8.5, 0, hy - 8.8);
    g.quadraticCurveTo(10.5, hy - 8.5, 9.6, hy + 3);
    g.quadraticCurveTo(5, hy - 3.5, 0, hy - 3.2);
    g.quadraticCurveTo(-5, hy - 3.5, -9.6, hy + 3);
    g.closePath(); g.fill();
    ell(g, 0, hy - 9.5, 4.4, 3.8); g.fill();
  } else if (look.hairstyle === 'bald-beard') {
    // bald with massive beard
    g.beginPath();
    g.arc(0, hy + 0.5, 9.6, Math.PI * 1.05, Math.PI * 1.95);
    g.fill();
    g.fillStyle = look.beard || '#cfc4b2';
    g.beginPath();
    g.moveTo(-8.5, hy + 3);
    g.quadraticCurveTo(-9, hy + 14, 0, hy + 15.5);
    g.quadraticCurveTo(9, hy + 14, 8.5, hy + 3);
    g.quadraticCurveTo(4, hy + 7, 0, hy + 7);
    g.quadraticCurveTo(-4, hy + 7, -8.5, hy + 3);
    g.closePath(); g.fill();
  } else if (look.hairstyle === 'wisp') {
    // old wispy hair + beard
    g.beginPath();
    g.arc(0, hy - 1, 9.6, Math.PI * 1.15, Math.PI * 1.85);
    g.fill();
    g.fillStyle = look.beard || '#e8e2d4';
    g.beginPath();
    g.moveTo(-6, hy + 6);
    g.quadraticCurveTo(-5, hy + 16, 0, hy + 17);
    g.quadraticCurveTo(5, hy + 16, 6, hy + 6);
    g.quadraticCurveTo(0, hy + 9.5, -6, hy + 6);
    g.closePath(); g.fill();
  } else {
    // swoopy fringe (Jay)
    g.beginPath();
    g.moveTo(-9.6, hy + 4);
    g.quadraticCurveTo(-10.5, hy - 8.5, 0, hy - 8.8);
    g.quadraticCurveTo(10.5, hy - 8.5, 9.6, hy + 2.5);
    g.quadraticCurveTo(7.5, hy - 1.5, 3.5, hy - 1);
    g.quadraticCurveTo(4.8, hy + 1.5, 2.5, hy + 2.6);
    g.quadraticCurveTo(-0.5, hy - 2.6, -4, hy - 1.6);
    g.quadraticCurveTo(-8, hy - 0.6, -9.6, hy + 4);
    g.closePath(); g.fill();
  }
  // accessories
  if (look.hat === 'straw') {
    g.fillStyle = '#dcbd6e';
    ell(g, 0, hy - 5.5, 12.5, 4.2); g.fill();
    ell(g, 0, hy - 8, 6.5, 4.6); g.fill();
    g.strokeStyle = '#a8854a'; g.lineWidth = 1.6;
    g.beginPath(); g.arc(0, hy - 6, 6.8, Math.PI, TAU); g.stroke();
  }
  g.restore();
}

function shadeColor(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const gg = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${gg},${b})`;
}

export const LOOKS = {
  marigold: { seed: 1, hair: '#c9889a', hairBack: '#b06f82', hairstyle: 'bun', top: '#9a7fae', apron: '#f0e6d0', eyes: '#7d5a3c', blush: true, pants: '#705a3e', hat: 'straw' },
  bramble: { seed: 2, hair: '#cfc4b2', hairstyle: 'bald-beard', beard: '#cfc4b2', top: '#8a5a3c', apron: '#5a5560', eyes: '#54442e', burly: true, pants: '#4f4536' },
  pip: { seed: 3, hair: '#e8e2d4', hairstyle: 'wisp', beard: '#e8e2d4', top: '#7d8a5a', elderEyes: true, pants: '#6b5a40' },
  jay: { seed: 4, hair: '#2e2a33', hairBack: '#221f28', hairstyle: 'fringe', top: '#5d7fa0', eyes: '#8a93a3', skin: '#f8e8d8', shy: true, blush: true, pants: '#3e4452' },
};

// -------------------------------------------------------------- monsters --
// Nibbler: round mauve critter with big ears and tiny teeth. Cute but rude.
export function nibbler(g, x, y, t, opts = {}) {
  const s = opts.s || 1;
  const hop = Math.abs(Math.sin(t * 6)) * 3;
  g.save();
  g.translate(x, y);
  shadow(g, 0, 1, 10 * s, 3.6 * s, 0.25);
  g.translate(0, -hop);
  g.scale(s, s);
  // ears
  g.fillStyle = '#6b5d78';
  for (const dir of [-1, 1]) {
    g.save();
    g.translate(dir * 5.5, -14);
    g.rotate(dir * 0.35 + Math.sin(t * 6) * 0.1);
    ell(g, 0, -4, 3.0, 5.5); g.fill();
    g.restore();
  }
  // body
  g.fillStyle = vgrad(g, -16, 0, '#8b7d9a', '#6b5d78');
  ell(g, 0, -8, 9.5, 8.5); g.fill();
  ink(g, 1.2, 0.3);
  // belly
  g.fillStyle = '#b3a7be';
  ell(g, 0, -5.5, 5.5, 4.5); g.fill();
  // eyes
  for (const dir of [-1, 1]) {
    g.fillStyle = '#f5ef7a';
    ell(g, dir * 3.6, -10, 2.2, 2.6); g.fill();
    g.fillStyle = '#3a2c44';
    ell(g, dir * 3.6, -9.6, 1.1, 1.5); g.fill();
  }
  // teeth
  g.fillStyle = '#fff';
  g.beginPath(); g.moveTo(-2.4, -5.5); g.lineTo(-1.2, -3.2); g.lineTo(0, -5.5); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(0.4, -5.5); g.lineTo(1.6, -3.2); g.lineTo(2.8, -5.5); g.closePath(); g.fill();
  g.restore();
}

// Wisp: floating spark spirit found in ruins.
export function wisp(g, x, y, t) {
  const fl = Math.sin(t * 3) * 3;
  g.save();
  g.translate(x, y - 18 - fl);
  g.fillStyle = radgrad(g, 0, 0, 16, [[0, 'rgba(185,240,224,0.55)'], [1, 'rgba(185,240,224,0)']]);
  ell(g, 0, 0, 16, 16); g.fill();
  g.fillStyle = '#d8f7ec';
  g.beginPath();
  g.moveTo(0, -9);
  g.quadraticCurveTo(8, -2, 0, 9);
  g.quadraticCurveTo(-8, -2, 0, -9);
  g.fill();
  g.fillStyle = '#3a4c46';
  ell(g, -2.4, -1, 1.2, 2.2); g.fill();
  ell(g, 2.4, -1, 1.2, 2.2); g.fill();
  g.restore();
  shadow(g, x, y, 8, 3, 0.15);
}

// Stone golem bosses, scaled by tier (1 = Warden, 2 = Colossus, 3 = Sentinel).
export function golem(g, x, y, t, tier, flash = 0) {
  const s = 1 + tier * 0.28;
  const breathe = Math.sin(t * 2) * 1.5;
  g.save();
  g.translate(x, y);
  shadow(g, 0, 2, 26 * s, 9 * s, 0.3);
  g.scale(s, s);
  g.translate(0, -breathe);
  const body = flash > 0 ? '#d8cfe0' : null;
  // legs
  g.fillStyle = body || '#5c5366';
  for (const dir of [-1, 1]) {
    rr(g, dir * 11 - 6, -14, 12, 14, 4); g.fill();
  }
  // torso boulder
  g.fillStyle = body || vgrad(g, -44, -8, '#8b7f95', '#5c5366');
  g.beginPath();
  g.moveTo(-20, -12);
  g.quadraticCurveTo(-24, -40, -8, -44);
  g.lineTo(10, -44);
  g.quadraticCurveTo(24, -38, 20, -12);
  g.quadraticCurveTo(0, -6, -20, -12);
  g.closePath();
  g.fill();
  ink(g, 1.8, 0.35);
  // cracks
  g.strokeStyle = 'rgba(40,32,50,0.5)'; g.lineWidth = 1.6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-10, -40); g.lineTo(-6, -32); g.lineTo(-11, -26); g.stroke();
  g.beginPath(); g.moveTo(12, -36); g.lineTo(8, -28); g.stroke();
  // arms
  const swing2 = Math.sin(t * 2 + 1) * 0.08;
  for (const dir of [-1, 1]) {
    g.save();
    g.translate(dir * 20, -36);
    g.rotate(dir * (0.15 + swing2));
    g.fillStyle = body || vgrad(g, 0, 22, '#7b7083', '#4a4255');
    rr(g, -6.5, 0, 13, 24, 6); g.fill();
    ink(g, 1.6, 0.3);
    g.restore();
  }
  // rune eyes + chest rune
  const eye = tier >= 3 ? '#ffd98a' : P.rune;
  g.fillStyle = eye;
  for (const dir of [-1, 1]) {
    ell(g, dir * 6.5, -34, 2.6, 3.2 + Math.sin(t * 4) * 0.4);
    g.fill();
  }
  g.save();
  g.translate(0, -22);
  g.scale(0.8, 0.8);
  g.fillStyle = eye;
  g.globalAlpha = 0.85;
  heartPath(g); g.fill();
  g.globalAlpha = 1;
  g.restore();
  // moss shoulders
  g.fillStyle = 'rgba(110,125,53,0.65)';
  ell(g, -14, -42, 7, 3.4); g.fill();
  ell(g, 12, -43, 5, 2.8); g.fill();
  if (tier >= 2) { // crown of stones
    g.fillStyle = '#4a4255';
    for (let i = -2; i <= 2; i++) {
      rr(g, i * 6 - 2, -50 - (i % 2 ? 2 : 5), 4, 8, 1.5); g.fill();
    }
  }
  g.restore();
}

// The Ruin Heart: a huge cracked crystal heart, pulsing.
export function ruinHeart(g, x, y, t, hpFrac = 1) {
  const pulse = 1 + Math.sin(t * (2 + (1 - hpFrac) * 4)) * 0.05;
  g.save();
  g.translate(x, y - 34);
  g.scale(5.2 * pulse, 5.2 * pulse);
  // glow
  g.fillStyle = radgrad(g, 0, 0, 16, [[0, 'rgba(226,86,106,0.4)'], [1, 'rgba(226,86,106,0)']]);
  ell(g, 0, 0, 16, 16); g.fill();
  // crystal heart
  const grad = g.createLinearGradient(0, -8, 0, 8);
  grad.addColorStop(0, '#d884a0');
  grad.addColorStop(1, '#8a3a5c');
  g.fillStyle = grad;
  heartPath(g); g.fill();
  g.strokeStyle = 'rgba(58,30,46,0.6)'; g.lineWidth = 0.6; g.stroke();
  // facets
  g.strokeStyle = 'rgba(255,220,235,0.55)'; g.lineWidth = 0.45;
  g.beginPath(); g.moveTo(-3, -4); g.lineTo(-1, 0); g.lineTo(-3.5, 3); g.stroke();
  g.beginPath(); g.moveTo(2.5, -4.5); g.lineTo(1.5, -0.5); g.lineTo(3, 2); g.stroke();
  // crack grows as hp falls
  if (hpFrac < 0.7) {
    g.strokeStyle = 'rgba(40,16,28,0.8)'; g.lineWidth = 0.7;
    g.beginPath(); g.moveTo(0, -5.5); g.lineTo(-1.2, -2); g.lineTo(0.6, 1);
    if (hpFrac < 0.35) g.lineTo(-0.6, 4);
    g.stroke();
  }
  g.restore();
  shadow(g, x, y, 30, 10, 0.3);
  // little orbiting motes
  for (let i = 0; i < 3; i++) {
    const a = t * 1.5 + (i * TAU) / 3;
    const mx = x + Math.cos(a) * 46, my = y - 34 + Math.sin(a) * 16;
    g.fillStyle = 'rgba(226,120,140,0.8)';
    ell(g, mx, my, 2.6, 2.6); g.fill();
  }
}

// Loot / pickup twinkle
export function pickup(g, x, y, t, kind) {
  const fl = Math.sin(t * 3 + x) * 2;
  g.save();
  g.translate(x, y - 8 - fl);
  g.fillStyle = radgrad(g, 0, 0, 12, [[0, 'rgba(255,240,190,0.5)'], [1, 'rgba(255,240,190,0)']]);
  ell(g, 0, 0, 12, 12); g.fill();
  if (kind === 'amber') {
    g.fillStyle = '#e8a33d';
    g.beginPath();
    g.moveTo(0, -6); g.lineTo(5, -1); g.lineTo(3, 5); g.lineTo(-3, 5); g.lineTo(-5, -1);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.5)';
    ell(g, -1.5, -2, 1.6, 2.2); g.fill();
  } else if (kind === 'feather') {
    g.fillStyle = '#d8e4f0';
    g.beginPath();
    g.moveTo(0, -7);
    g.quadraticCurveTo(6, -2, 1, 6);
    g.quadraticCurveTo(-4, 0, 0, -7);
    g.fill();
    g.strokeStyle = '#9aa8bc'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, -6); g.lineTo(0.5, 5); g.stroke();
  } else if (kind === 'star') {
    g.fillStyle = '#cdb9ec';
    g.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * TAU) / 5;
      const a2 = a + TAU / 10;
      g.lineTo(Math.cos(a) * 7, Math.sin(a) * 7);
      g.lineTo(Math.cos(a2) * 3, Math.sin(a2) * 3);
    }
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.6)';
    ell(g, -1, -2, 1.6, 1.6); g.fill();
  }
  g.restore();
  shadow(g, x, y, 7, 2.6, 0.18);
}

// Egg on the ground
export function egg(g, x, y) {
  shadow(g, x, y, 6, 2.4, 0.2);
  g.fillStyle = vgrad(g, y - 12, y, '#fdf8ec', '#e8dcc0');
  ell(g, x, y - 5, 4.6, 6); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.7)';
  ell(g, x - 1.5, y - 7.5, 1.6, 2.2); g.fill();
}
