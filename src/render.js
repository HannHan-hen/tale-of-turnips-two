// Scene renderer. Pre-renders each map's ground + atmosphere + static props
// into offscreen layers (at device pixel ratio), then per frame composites:
//   ground -> [props + entities, depth sorted] -> atmosphere -> daylight tint
// Works in the browser and in node-canvas (the screenshot tool).

import { VIEW_W, VIEW_H, MAPS } from './maps.js';
import { paintAtmosphere, radgrad, lingrad, ell } from './art.js';
import { clamp, lerp } from './util.js';

export class Renderer {
  constructor(createCanvas, dpr = 2) {
    this.createCanvas = createCanvas;
    this.dpr = dpr;
    this.groundCache = new Map(); // mapId -> canvas
    this.atmoCache = new Map();
    this.propCache = new Map(); // mapId -> [{x, y, img, ox, oy, w, h, draw?}]
  }

  layer(paint) {
    const c = this.createCanvas(VIEW_W * this.dpr, VIEW_H * this.dpr);
    const g = c.getContext('2d');
    g.scale(this.dpr, this.dpr);
    paint(g, VIEW_W, VIEW_H);
    return c;
  }

  ground(map) {
    if (!this.groundCache.has(map.id)) {
      this.groundCache.set(map.id, this.layer((g, w, h) => map.paintGround(g, w, h)));
    }
    return this.groundCache.get(map.id);
  }

  atmosphere(map) {
    if (!this.atmoCache.has(map.id)) {
      this.atmoCache.set(map.id, this.layer((g, w, h) => {
        if (map.ruin) {
          // heavy gloom pressing in from the rim, faint teal mist
          for (const [cx, cy] of [[0, 0], [w, 0], [0, h], [w, h]]) {
            g.fillStyle = radgrad(g, cx, cy, 420, [
              [0, 'rgba(16,12,26,0.65)'],
              [1, 'rgba(16,12,26,0)'],
            ]);
            g.fillRect(cx - 420, cy - 420, 840, 840);
          }
          g.fillStyle = lingrad(g, 0, 0, 0, h, [
            [0, 'rgba(14,10,24,0.45)'],
            [0.3, 'rgba(14,10,24,0)'],
            [0.85, 'rgba(14,10,24,0)'],
            [1, 'rgba(14,10,24,0.4)'],
          ]);
          g.fillRect(0, 0, w, h);
          g.fillStyle = radgrad(g, w / 2, h / 2, w * 0.55, [
            [0, 'rgba(185,240,224,0.07)'],
            [1, 'rgba(185,240,224,0)'],
          ]);
          g.fillRect(0, 0, w, h);
        } else if (map.indoor) {
          for (const [cx, cy] of [[0, 0], [w, 0], [0, h], [w, h]]) {
            g.fillStyle = radgrad(g, cx, cy, 380, [
              [0, 'rgba(52,32,18,0.4)'],
              [1, 'rgba(52,32,18,0)'],
            ]);
            g.fillRect(cx - 380, cy - 380, 760, 760);
          }
        } else {
          paintAtmosphere(g, w, h, 17 + map.id.length, 1);
        }
      }));
    }
    return this.atmoCache.get(map.id);
  }

  props(map, state) {
    if (!this.propCache.has(map.id)) {
      const built = map.buildProps ? map.buildProps(state) : [];
      const cached = built.map((pr) => {
        const { l, r, t, b } = pr.ext;
        const w = Math.ceil(l + r), h = Math.ceil(t + b);
        const c = this.createCanvas(Math.max(1, w * this.dpr), Math.max(1, h * this.dpr));
        const g = c.getContext('2d');
        g.scale(this.dpr, this.dpr);
        g.translate(l, t);
        pr.draw(g, 0);
        return { x: pr.x, y: pr.y, img: c, ox: l, oy: t, w, h };
      });
      this.propCache.set(map.id, cached);
    }
    return this.propCache.get(map.id);
  }

  invalidateProps(mapId) {
    this.propCache.delete(mapId);
  }

  // entities: [{y, draw(g)}] dynamic drawables in world space.
  // underlays: drawn right above ground (crop plots, water rings...).
  drawScene(g, mapId, state, t, entities = [], underlays = []) {
    const map = MAPS[mapId];
    g.drawImage(this.ground(map), 0, 0, VIEW_W, VIEW_H);
    for (const u of underlays) u(g);

    const drawables = [];
    for (const pr of this.props(map, state)) {
      drawables.push({
        y: pr.y,
        draw: (gg) => gg.drawImage(pr.img, pr.x - pr.ox, pr.y - pr.oy, pr.w, pr.h),
      });
    }
    for (const e of entities) drawables.push(e);
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) d.draw(g);

    g.drawImage(this.atmosphere(map), 0, 0, VIEW_W, VIEW_H);
  }

  // Daylight tint: dayFrac in [0,1) across one in-game day.
  daylight(g, dayFrac, indoor) {
    if (indoor) return;
    // dawn gold -> clear noon -> amber dusk
    let col = null, a = 0;
    if (dayFrac < 0.18) {
      a = lerp(0.16, 0, dayFrac / 0.18);
      col = '255,196,120';
    } else if (dayFrac > 0.62) {
      const t = clamp((dayFrac - 0.62) / 0.38, 0, 1);
      a = lerp(0, 0.26, t);
      col = '230,120,70';
    }
    if (a > 0.005) {
      g.fillStyle = `rgba(${col},${a})`;
      g.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    // late-evening cool shade
    if (dayFrac > 0.82) {
      const t = (dayFrac - 0.82) / 0.18;
      g.fillStyle = `rgba(40,38,80,${t * 0.22})`;
      g.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }
}
