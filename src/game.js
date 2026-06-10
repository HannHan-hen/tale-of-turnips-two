// Core game logic: player, day cycle, farming, chores, combat, ruins,
// threat & raids, relics, romance, win/lose. The UI layer (ui.js) renders
// menus and HUD from this state; render.js composites the scene.

import { MAPS, VIEW_W, VIEW_H, PLOT, plotCenter } from './maps.js';
import {
  SEEDS, SEED_ORDER, ITEMS, GEAR, SET_PIECES, DAY_LENGTH, GRACE_DAYS,
  THREAT_RAID, RELIC_GOLD, newGame, load, save, maxHearts, swordDamage,
  moveSpeed, swordReach, addItem, bankHighScore, highScore,
} from './state.js';
import { clamp, lerp, dist, rng, TAU } from './util.js';
import { farmer, chicken, villager, LOOKS, nibbler, wisp, golem, ruinHeart, pickup as drawPickup, egg as drawEgg } from './sprites.js';
import { crop as drawCrop, soilPlot, chest as drawChest, drawIcon } from './props.js';
import { bush, ell, radgrad, rr } from './art.js';
import { jayLine, jayGiftLine, pipLine, jayTier, JAY_TIER_NAMES, MARIGOLD_HELLO, BRAMBLE_HELLO } from './dialogue.js';

const NPCS = {
  marigold: { map: 'village', x: 240, y: 318, look: LOOKS.marigold, name: 'Marigold' },
  bramble: { map: 'village', x: 668, y: 318, look: LOOKS.bramble, name: 'Bramble' },
  pip: { map: 'village', x: 118, y: 545, look: LOOKS.pip, name: 'Old Pip' },
  jay: { map: 'village', x: 858, y: 468, look: LOOKS.jay, name: 'Jay' },
};

export class Game {
  constructor(renderer, input, sfx, ui) {
    this.R = renderer;
    this.input = input;
    this.sfx = sfx;
    this.ui = ui;
    this.t = 0;
    this.state = load() || newGame();
    this.mode = 'title'; // title | play | ending
    this.fade = { a: 1, dir: -1, then: null }; // fade-in on boot
    this.mapId = 'farm';
    this.player = { x: 480, y: 400, facing: 'down', phase: 0, moving: false, swing: -1, swingCd: 0, iframes: 0, kx: 0, ky: 0 };
    this.rooms = {}; // runtime per ruin room: {enemies, pickups, cleared}
    this.pickups = []; // current map pickups
    this.enemies = [];
    this.raidTimer = 12;
    this.fishing = null; // {phase:'wait'|'bite', t}
    this.toastQ = [];
    this.particles = [];
    this.smoke = [];
    this.smokeT = 0;
    this.shake = 0;
    if (this.state.won) this.state.won = false; // returning champions keep playing
  }

  // ------------------------------------------------------------- helpers --
  toast(msg, icon) { this.ui.toast(msg, icon); }

  startFade(then) {
    this.fade = { a: 0, dir: 1, then };
  }

  enter(mapId, spawn) {
    this.mapId = mapId;
    this.player.x = spawn.x; this.player.y = spawn.y;
    this.enemies = [];
    this.pickups = [];
    this.fishing = null;
    const map = MAPS[mapId];
    if (map.ruin) this.setupRuinRoom(map);
    this.sfx.door();
  }

  setupRuinRoom(map) {
    const s = this.state;
    const cleared = this.roomCleared(map);
    if (cleared) return;
    const depth = map.depth;
    if (map.final) {
      this.enemies.push(this.mkEnemy('heart', VIEW_W / 2, 270, 40));
    } else if (map.boss) {
      this.enemies.push(this.mkEnemy('golem', VIEW_W / 2, 280, 10 + map.boss * 7, map.boss));
    } else {
      const rand = rng(depth * 31 + s.day * 7);
      const n = 2 + Math.ceil(depth / 2);
      for (let i = 0; i < n; i++) {
        const x = 140 + rand() * (VIEW_W - 280);
        const y = 160 + rand() * (VIEW_H - 320);
        const kind = rand() < 0.65 ? 'nibbler' : 'wisp';
        this.enemies.push(this.mkEnemy(kind, x, y, kind === 'nibbler' ? 2 + Math.floor(depth / 3) : 2 + Math.floor(depth / 2)));
      }
    }
  }

  mkEnemy(kind, x, y, hp, tier = 0) {
    return { kind, x, y, hp, maxHp: hp, tier, t: Math.random() * 9, hitT: 0, st: 'roam', stT: 0, vx: 0, vy: 0, eatT: 0, target: null, dead: false };
  }

  roomCleared(map) {
    const s = this.state;
    if (map.final) return s.bosses.final;
    if (map.boss) return s.bosses[map.boss];
    return s.roomsClearedDay[map.id] === s.day;
  }

  // ---------------------------------------------------------------- day ---
  advanceDay(viaSleep = false) {
    const s = this.state;
    s.day += 1;
    s.dayT = 0;
    // crops grow
    for (const pl of s.plots) {
      if (pl.kind) pl.daysGrown += 1;
    }
    // chores reset
    s.chicken.egg = false;
    s.berriesPicked = [];
    s.berriesDay = s.day;
    s.fishedToday = 0;
    // threat
    if (s.day > GRACE_DAYS && (s.day - GRACE_DAYS) % 3 === 1 && s.threat < 5) {
      s.threat += 1;
      if (s.threat >= THREAT_RAID) this.toast('The ruins rumble... the farm feels watched.', 'skull');
      else this.toast('A faint rumble from the ruins...', 'skull');
      this.sfx.raid();
    }
    // heal
    s.hearts = maxHearts(s);
    this.raidTimer = 10 + Math.random() * 8;
    save(s);
    this.ui.refreshHud(this);
    if (s.day === 2 && !s.tut.ship) this.toast('Tip: crops grow each morning. Sell at the shipping box!', 'coin');
  }

  sleepToMorning() {
    this.sfx.sleep();
    this.startFade(() => {
      this.advanceDay(true);
      this.enter('house', { x: 480, y: 300 });
      this.toast(`Day ${this.state.day} — a fresh morning.`, 'sun');
    });
  }

  die() {
    const s = this.state;
    const lost = Math.floor(s.gold * 0.1);
    s.gold -= lost;
    this.sfx.hurt();
    this.startFade(() => {
      this.advanceDay();
      s.hearts = maxHearts(s);
      this.enter('house', { x: 480, y: 300 });
      this.toast(lost > 0 ? `You were carried home... and the doctor took ${lost}g.` : 'You were carried home to rest.', 'heart');
      save(s);
    });
  }

  win() {
    const s = this.state;
    s.won = true;
    s.stats.days = s.day;
    const best = bankHighScore(s.gold);
    this.sfx.win();
    save(s);
    this.mode = 'ending';
    this.ui.showEnding(this, best);
  }

  // ------------------------------------------------------------- update ---
  update(dt) {
    this.t += dt;
    if (this.toastQ.length) this.ui.toast(...this.toastQ.shift());

    // fade transitions always tick
    if (this.fade.dir !== 0) {
      this.fade.a += this.fade.dir * dt * 2.2;
      if (this.fade.dir > 0 && this.fade.a >= 1) {
        this.fade.a = 1;
        const then = this.fade.then;
        this.fade = { a: 1, dir: -1, then: null };
        if (then) then();
      } else if (this.fade.dir < 0 && this.fade.a <= 0) {
        this.fade = { a: 0, dir: 0, then: null };
      }
    }

    if (this.mode === 'title') {
      if (this.input.consumeAny()) {
        this.sfx.pickup();
        this.mode = 'play';
        this.ui.hideTitle();
        this.ui.refreshHud(this);
        if (!this.state.tut.hello) {
          this.state.tut.hello = true;
          this.toast('Plant turnips with E, then explore! Arrows/WASD to move.', 'turnip');
        }
      }
      return;
    }
    if (this.mode !== 'play') { this.input.endFrame(); return; }
    if (this.ui.menuOpen) { this.input.endFrame(); return; } // menus pause the world

    const s = this.state;
    const map = MAPS[this.mapId];

    // day clock (paused indoors at home & in menus; ruins still tick)
    if (!map.indoor || map.ruin) {
      s.dayT += dt;
      if (s.dayT >= DAY_LENGTH && this.fade.dir === 0) {
        this.startFade(() => {
          this.advanceDay();
          this.toast(`Day ${this.state.day}`, 'sun');
        });
      }
    }

    this.updatePlayer(dt, map);
    this.updateEnemies(dt, map);
    this.updatePickups(dt);
    this.updateFishing(dt);
    this.updateRaids(dt, map);
    this.updateParticles(dt);
    this.updateSmoke(dt);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 30);

    // interaction
    const inter = this.nearestInteract(map);
    this.currentInteract = inter;
    if (inter && this.input.interact()) inter.action();
    else if (this.input.attack()) this.tryAttack(map);

    // seed hotkeys
    SEED_ORDER.forEach((kind, i) => {
      if (this.input.hit('Digit' + (i + 1))) {
        s.selSeed = kind;
        this.ui.refreshHud(this);
        this.sfx.talk();
      }
    });

    this.input.endFrame();
  }

  updatePlayer(dt, map) {
    const p = this.player;
    const s = this.state;
    const ax = this.input.axis();
    const sp = moveSpeed(s) * (this.fishing ? 0 : 1);
    let vx = ax.x * sp, vy = ax.y * sp;
    // knockback decay
    vx += p.kx; vy += p.ky;
    p.kx *= Math.pow(0.0001, dt); p.ky *= Math.pow(0.0001, dt);
    if (Math.abs(p.kx) < 1) p.kx = 0;
    if (Math.abs(p.ky) < 1) p.ky = 0;

    p.moving = !!(ax.x || ax.y);
    if (p.moving && !this.fishing) {
      if (Math.abs(ax.x) > Math.abs(ax.y)) p.facing = ax.x > 0 ? 'right' : 'left';
      else p.facing = ax.y > 0 ? 'down' : 'up';
      p.phase = (p.phase + dt * 2.4) % 1;
      if (this.fishing) this.fishing = null;
    } else {
      p.phase = (p.phase + dt * 0.5) % 1;
    }

    const nx = p.x + vx * dt;
    const ny = p.y + vy * dt;
    const r = 10;
    const blocked = (x, y) => {
      const w = map.walk;
      if (x < w.x + r || x > w.x + w.w - r || y < w.y + r || y > w.y + w.h - r) return true;
      for (const c of map.colliders || []) {
        if (x > c.x - r && x < c.x + c.w + r && y > c.y - r && y < c.y + c.h + r) return true;
      }
      for (const c of map.waterBlocks || []) {
        if (x > c.x - r && x < c.x + c.w + r && y > c.y - r && y < c.y + c.h + r) {
          // allow standing on the dock
          if (this.mapId === 'lake' && y > 408 && y < 452 && x > 320) return false;
          return true;
        }
      }
      // farm: soil plots block walking through their centers? no — walkable.
      return false;
    };
    if (!blocked(nx, p.y)) p.x = nx;
    if (!blocked(p.x, ny)) p.y = ny;

    // swing animation
    if (p.swing >= 0) {
      p.swing += dt * 3.6;
      if (p.swing > 1) p.swing = -1;
    }
    p.swingCd = Math.max(0, p.swingCd - dt);
    p.iframes = Math.max(0, p.iframes - dt);

    // exits / doors
    if (this.fade.dir === 0) {
      for (const ex of map.exits || []) {
        if (p.x > ex.x && p.x < ex.x + ex.w && p.y > ex.y && p.y < ex.y + ex.h) {
          this.startFade(() => this.enter(ex.to, ex.spawn));
          return;
        }
      }
    }
  }

  tryAttack(map) {
    const p = this.player;
    const s = this.state;
    if (!s.equip.sword) {
      if (map.ruin) this.toast('You need a sword! Bramble sells one in the village.', 'sword');
      return;
    }
    if (p.swingCd > 0) return;
    p.swing = 0;
    p.swingCd = 0.42;
    this.sfx.swing();
    const reach = swordReach(s);
    const dmg = swordDamage(s);
    const dir = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[p.facing];
    const hx = p.x + dir[0] * reach * 0.6;
    const hy = p.y - 14 + dir[1] * reach * 0.6;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const eh = e.kind === 'golem' ? 30 : e.kind === 'heart' ? 40 : 12;
      if (dist(hx, hy, e.x, e.y - eh / 2) < reach * 0.75 + (e.kind === 'golem' ? 16 : e.kind === 'heart' ? 30 : 8)) {
        this.damageEnemy(e, dmg);
      }
    }
  }

  damageEnemy(e, dmg) {
    e.hp -= dmg;
    e.hitT = 0.18;
    this.sfx.hit();
    const p = this.player;
    const k = e.kind === 'golem' || e.kind === 'heart' ? 40 : 170;
    const d = Math.max(1, dist(p.x, p.y, e.x, e.y));
    e.x += ((e.x - p.x) / d) * 8;
    e.y += ((e.y - p.y) / d) * 8;
    e.vx = ((e.x - p.x) / d) * k;
    e.vy = ((e.y - p.y) / d) * k;
    this.burst(e.x, e.y - 14, '#cdb9ec', 5);
    if (e.hp <= 0) this.killEnemy(e);
  }

  killEnemy(e) {
    const s = this.state;
    e.dead = true;
    s.stats.monsters += 1;
    this.burst(e.x, e.y - 12, '#e8d57a', 10);
    // drops
    const roll = Math.random();
    if (e.kind === 'golem' || e.kind === 'heart') {
      for (let i = 0; i < 4; i++) {
        this.pickups.push({ kind: 'coin', x: e.x + (Math.random() - 0.5) * 50, y: e.y + (Math.random() - 0.5) * 26, t: 0, val: 4 + Math.floor(Math.random() * 4) });
      }
      this.pickups.push({ kind: 'feather', x: e.x, y: e.y + 10, t: 0 });
    } else {
      this.pickups.push({ kind: 'coin', x: e.x, y: e.y, t: 0, val: 2 + Math.floor(Math.random() * 4) });
      if (roll < 0.22) this.pickups.push({ kind: 'amber', x: e.x + 14, y: e.y + 6, t: 0 });
      else if (roll < 0.3) this.pickups.push({ kind: 'feather', x: e.x + 14, y: e.y + 6, t: 0 });
    }

    const map = MAPS[this.mapId];
    if (!map.ruin) return;
    const alive = this.enemies.filter((x) => !x.dead);
    if (alive.length === 0) {
      if (map.final) {
        this.win();
        return;
      }
      if (map.boss) {
        s.bosses[map.boss] = true;
        if (s.threat > 0) {
          s.threat -= 1;
          this.toast('The boss falls! The farm breathes easier. (Threat -1)', 'skull');
        } else {
          this.toast('The boss falls!', 'sword');
        }
        this.sfx.bossDown();
        if (map.boss === 3) this.toast('The way to the Ruin Heart is open...', 'star');
      } else {
        s.roomsClearedDay[map.id] = s.day;
        this.toast('Room cleared — the way deeper is open.', 'sword');
        this.sfx.seal();
      }
      save(s);
      this.ui.refreshHud(this);
    }
  }

  updateEnemies(dt, map) {
    const p = this.player;
    const s = this.state;
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.t += dt;
      e.hitT = Math.max(0, e.hitT - dt);
      e.stT -= dt;
      // friction on knockback
      e.x += (e.vx || 0) * dt; e.y += (e.vy || 0) * dt;
      e.vx = (e.vx || 0) * Math.pow(0.001, dt);
      e.vy = (e.vy || 0) * Math.pow(0.001, dt);

      const dToP = dist(e.x, e.y, p.x, p.y);
      let sp = 0, tx = p.x, ty = p.y;

      if (e.kind === 'nibbler') {
        if (e.raider) {
          // raid AI: run to a planted plot and munch it
          if (!e.target || !s.plots[e.target.i].kind) {
            const cands = s.plots.map((pl, i) => ({ pl, i })).filter((o) => o.pl.kind);
            if (!cands.length) { e.flee = true; }
            else {
              const c = cands[Math.floor(Math.random() * cands.length)];
              const pc = plotCenter(c.i);
              e.target = { i: c.i, x: pc.x, y: pc.y };
            }
          }
          if (e.flee) {
            tx = e.x < VIEW_W / 2 ? -40 : VIEW_W + 40; ty = e.y;
            sp = 95;
            if (e.x < -30 || e.x > VIEW_W + 30) e.dead = true;
          } else if (e.target) {
            const d2 = dist(e.x, e.y, e.target.x, e.target.y);
            if (d2 < 14) {
              e.eatT += dt;
              if (e.eatT > 2.6) {
                const pl = s.plots[e.target.i];
                if (pl.kind) {
                  pl.kind = null; pl.daysGrown = 0;
                  this.toast('A nibbler ate a crop!', 'skull');
                  this.sfx.bite();
                }
                e.eatT = 0; e.target = null;
              }
            } else {
              tx = e.target.x; ty = e.target.y; sp = 78;
            }
          }
        } else {
          // dungeon AI: hop toward the player
          sp = dToP < 240 ? 64 + map.depth * 5 : 22;
          if (e.stT < 0) { e.stT = 1 + Math.random() * 1.5; e.wx = (Math.random() - 0.5) * 80; e.wy = (Math.random() - 0.5) * 80; }
          if (dToP >= 240) { tx = e.x + e.wx; ty = e.y + e.wy; }
        }
      } else if (e.kind === 'wisp') {
        sp = 55 + map.depth * 4;
        // drifts in a sine weave toward player
        tx = p.x + Math.sin(e.t * 2.2) * 60;
        ty = p.y + Math.cos(e.t * 1.7) * 40;
      } else if (e.kind === 'golem') {
        if (e.st === 'roam') {
          sp = 30 + e.tier * 7;
          if (e.stT < 0 && dToP < 320) { e.st = 'windup'; e.stT = 0.7; }
        } else if (e.st === 'windup') {
          sp = 0;
          if (e.stT < 0) {
            e.st = 'charge'; e.stT = 0.85;
            const d = Math.max(1, dToP);
            e.cx = ((p.x - e.x) / d) * (190 + e.tier * 40);
            e.cy = ((p.y - e.y) / d) * (190 + e.tier * 40);
            this.sfx.raid();
          }
        } else if (e.st === 'charge') {
          e.x += e.cx * dt; e.y += e.cy * dt;
          if (e.stT < 0) { e.st = 'roam'; e.stT = 1.4 + Math.random(); this.shake = 5; }
        }
        // tier 3 spawns wisps sometimes
        if (e.tier === 3 && Math.random() < dt * 0.1 && this.enemies.filter((x) => !x.dead).length < 4) {
          this.enemies.push(this.mkEnemy('wisp', e.x, e.y, 2));
        }
      } else if (e.kind === 'heart') {
        // pulses; spawns minions at hp thresholds, throbs toward player slowly
        sp = 26 + (1 - e.hp / e.maxHp) * 30;
        if (!e.spawned) e.spawned = [];
        for (const th of [0.75, 0.5, 0.25]) {
          if (e.hp / e.maxHp <= th && !e.spawned.includes(th)) {
            e.spawned.push(th);
            for (let i = 0; i < 2 + Math.round((1 - th) * 3); i++) {
              const kind = i % 2 ? 'wisp' : 'nibbler';
              this.enemies.push(this.mkEnemy(kind, e.x + (Math.random() - 0.5) * 160, e.y + 60 + Math.random() * 60, 3));
            }
            this.sfx.raid();
            this.shake = 6;
          }
        }
      }

      if (sp > 0) {
        const d = Math.max(1, dist(e.x, e.y, tx, ty));
        e.x += ((tx - e.x) / d) * sp * dt;
        e.y += ((ty - e.y) / d) * sp * dt;
      }
      // keep inside walk area
      const w = map.walk;
      if (!e.raider) {
        e.x = clamp(e.x, w.x + 14, w.x + w.w - 14);
        e.y = clamp(e.y, w.y + 20, w.y + w.h - 6);
      }

      // contact damage
      const hurtR = e.kind === 'golem' ? 26 + e.tier * 5 : e.kind === 'heart' ? 40 : 13;
      if (!e.raider && p.iframes <= 0 && dToP < hurtR + 9) {
        this.hurtPlayer(e);
      }
    }
    this.enemies = this.enemies.filter((e) => !e.dead || e.deathT > 0);
  }

  hurtPlayer(e) {
    const p = this.player;
    const s = this.state;
    s.hearts -= 1;
    p.iframes = 1.1;
    this.sfx.hurt();
    this.shake = 6;
    const d = Math.max(1, dist(e.x, e.y, p.x, p.y));
    p.kx = ((p.x - e.x) / d) * 260;
    p.ky = ((p.y - e.y) / d) * 260;
    this.ui.refreshHud(this);
    if (s.hearts <= 0) this.die();
  }

  updatePickups(dt) {
    const p = this.player;
    const s = this.state;
    for (const pk of this.pickups) {
      pk.t += dt;
      if (pk.t > 0.35 && dist(pk.x, pk.y, p.x, p.y) < 22) {
        pk.got = true;
        if (pk.kind === 'coin') {
          s.gold += pk.val; s.goldEarned += pk.val;
          this.sfx.coin();
        } else {
          addItem(s, pk.kind);
          this.toast(`Got ${ITEMS[pk.kind].name}!`, pk.kind);
          this.sfx.pickup();
        }
        this.ui.refreshHud(this);
      }
    }
    this.pickups = this.pickups.filter((pk) => !pk.got);
  }

  updateFishing(dt) {
    if (!this.fishing) return;
    const f = this.fishing;
    f.t -= dt;
    if (f.phase === 'wait' && f.t <= 0) {
      f.phase = 'bite';
      f.t = 0.9;
      this.sfx.bite();
    } else if (f.phase === 'bite' && f.t <= 0) {
      this.fishing = null;
      this.toast('It got away...', 'fish');
    }
  }

  updateRaids(dt, map) {
    const s = this.state;
    if (this.mapId !== 'farm' || s.threat < THREAT_RAID) return;
    this.raidTimer -= dt;
    if (this.raidTimer <= 0) {
      this.raidTimer = 26 - s.threat * 3 + Math.random() * 10;
      const hasCrops = s.plots.some((pl) => pl.kind);
      if (!hasCrops) return;
      const n = clamp(s.threat - 2, 1, 3);
      for (let i = 0; i < n; i++) {
        const e = this.mkEnemy('nibbler', Math.random() < 0.5 ? -20 : VIEW_W + 20, 300 + Math.random() * 250, 2);
        e.raider = true;
        this.enemies.push(e);
      }
      this.toast('Crop nibblers are raiding the farm!', 'skull');
      this.sfx.raid();
    }
  }

  burst(x, y, col, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const v = 40 + Math.random() * 90;
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 50, t: 0.5 + Math.random() * 0.3, col });
    }
  }

  updateParticles(dt) {
    for (const pa of this.particles) {
      pa.t -= dt;
      pa.x += pa.vx * dt;
      pa.y += pa.vy * dt;
      pa.vy += 220 * dt;
    }
    this.particles = this.particles.filter((pa) => pa.t > 0);
  }

  updateSmoke(dt) {
    if (this.mapId === 'farm') {
      this.smokeT -= dt;
      if (this.smokeT <= 0) {
        this.smokeT = 0.9 + Math.random() * 0.5;
        this.smoke.push({ x: 255, y: 88, r: 4 + Math.random() * 2, t: 0, life: 4.5 });
      }
    }
    for (const sm of this.smoke) {
      sm.t += dt;
      sm.x += dt * (6 + Math.sin(sm.t * 1.3) * 5);
      sm.y -= dt * 13;
      sm.r += dt * 3.2;
    }
    this.smoke = this.smoke.filter((sm) => sm.t < sm.life);
  }

  // -------------------------------------------------------- interactions --
  nearestInteract(map) {
    const p = this.player;
    const s = this.state;
    const list = [];
    const add = (x, y, r, label, action, icon) => {
      const d = dist(p.x, p.y, x, y);
      if (d < r) list.push({ x, y, d, label, action, icon });
    };

    if (this.mapId === 'farm') {
      // plots
      s.plots.forEach((pl, i) => {
        const c = plotCenter(i);
        if (!pl.kind) {
          const kind = s.selSeed;
          if (s.seeds[kind] > 0) {
            add(c.x, c.y, 46, `Plant ${SEEDS[kind].name}`, () => this.plant(i), 'seed');
          } else {
            add(c.x, c.y, 46, 'No seeds! Buy more in the village', () => {
              this.toast(`No ${SEEDS[kind].name.toLowerCase()} seeds left — Marigold sells them.`, 'turnip');
            }, 'seed');
          }
        } else if (pl.daysGrown >= SEEDS[pl.kind].days) {
          add(c.x, c.y, 46, `Harvest ${SEEDS[pl.kind].name}`, () => this.harvest(i), 'turnip');
        }
      });
      add(805, 230, 60, 'Ship goods', () => this.ui.openShipping(this), 'coin');
      const ch = this.chickenPos();
      if (s.chicken.pettedDay !== s.day) {
        add(ch.x, ch.y, 42, 'Pet Clementine', () => this.petChicken(), 'heart');
      } else if (s.chicken.egg) {
        add(470, 248, 40, 'Take the egg', () => {
          s.chicken.egg = false;
          addItem(s, 'egg');
          this.toast('Got an egg! Clementine looks proud.', 'egg');
          this.sfx.pickup();
        }, 'egg');
      }
      for (const d of map.doors) {
        add(d.x + d.w / 2, d.y + d.h, 52, d.label, () => {
          if (d.to === 'ruin1' && !s.tut.ruinWarn && !s.equip.sword) {
            s.tut.ruinWarn = true;
            this.toast('The ruins are dangerous without a sword...', 'sword');
            return;
          }
          this.startFade(() => this.enter(d.to, d.spawn));
        }, 'door');
      }
    } else if (this.mapId === 'house') {
      add(480, 180, 70, 'Sleep until morning', () => this.sleepToMorning(), 'sun');
      add(170, 160, 56, 'Starless collection', () => this.ui.openCollection(this), 'star');
      for (const d of map.doors) {
        add(d.x + d.w / 2, d.y, 60, d.label, () => this.startFade(() => this.enter(d.to, d.spawn)), 'door');
      }
    } else if (this.mapId === 'village') {
      add(NPCS.marigold.x, NPCS.marigold.y, 55, 'Talk to Marigold', () => {
        this.sfx.talk();
        this.ui.dialogue('Marigold', MARIGOLD_HELLO, () => this.ui.openSeedShop(this));
      }, 'turnip');
      add(NPCS.bramble.x, NPCS.bramble.y, 55, 'Talk to Bramble', () => {
        this.sfx.talk();
        this.ui.dialogue('Bramble', BRAMBLE_HELLO, () => this.ui.openSmith(this));
      }, 'sword');
      add(NPCS.pip.x, NPCS.pip.y, 55, 'Talk to Old Pip', () => {
        this.sfx.talk();
        this.ui.dialogue('Old Pip', pipLine(s));
        s.pipHint += 1;
      }, 'house');
      add(NPCS.jay.x, NPCS.jay.y, 55, 'Talk to Jay', () => this.talkJay(), 'heart');
    } else if (this.mapId === 'forest') {
      MAPS.forest.berries.forEach((b, i) => {
        if (!s.berriesPicked.includes(i)) {
          add(b.x, b.y, 44, 'Gather berries', () => this.pickBerries(i), 'berry');
        }
      });
    } else if (this.mapId === 'lake') {
      const f = MAPS.lake.fishSpot;
      if (!this.fishing) {
        add(f.x, f.y, 60, 'Cast a line', () => this.castLine(), 'fish');
      } else if (this.fishing.phase === 'bite') {
        add(f.x, f.y, 80, 'Reel in!!', () => this.reelIn(), 'fish');
      } else {
        add(f.x, f.y, 80, '... waiting ...', () => {
          this.fishing = null;
          this.toast('You pulled the line out early.', 'fish');
        }, 'fish');
      }
    } else if (map.ruin) {
      for (const d of map.doors) {
        const cx = d.x + d.w / 2;
        const cy = d.y === 0 ? 60 : d.y;
        if (d.sealed && !this.roomCleared(map)) {
          add(cx, cy, 64, 'Sealed by ruin magic', () => {
            this.toast('Clear this room to break the seal.', 'skull');
            this.sfx.seal();
          }, 'skull');
        } else {
          add(cx, cy, 64, d.label, () => this.startFade(() => this.enter(d.to, d.spawn)), 'door');
        }
      }
      // Starless cache in the second boss room
      if (map.boss === 2 && s.bosses[2] && !s.cacheOpened) {
        add(VIEW_W / 2, 230, 56, 'Open the Starless cache', () => {
          s.cacheOpened = true;
          s.set.blade = true;
          this.toast(`${SET_PIECES.blade.name} acquired! ${SET_PIECES.blade.desc}.`, 'star');
          this.sfx.relic();
          save(s);
          this.ui.refreshHud(this);
        }, 'star');
      }
    }

    list.sort((a, b) => a.d - b.d);
    return list[0] || null;
  }

  chickenPos() {
    // Clementine wanders in a little loop near the coop
    const t = this.t * 0.3;
    return { x: 520 + Math.cos(t) * 36, y: 250 + Math.sin(t * 1.7) * 18 };
  }

  plant(i) {
    const s = this.state;
    const kind = s.selSeed;
    if (s.seeds[kind] <= 0) return;
    s.seeds[kind] -= 1;
    s.plots[i] = { kind, daysGrown: 0 };
    this.sfx.plant();
    this.burst(plotCenter(i).x, plotCenter(i).y, '#8a6243', 4);
    this.ui.refreshHud(this);
    save(s);
  }

  harvest(i) {
    const s = this.state;
    const pl = s.plots[i];
    const kind = pl.kind;
    const yieldN = 1 + (s.set.gloves ? 1 : 0);
    addItem(s, kind, yieldN);
    s.stats.harvested += yieldN;
    pl.kind = null; pl.daysGrown = 0;
    this.sfx.harvest();
    const c = plotCenter(i);
    this.burst(c.x, c.y - 10, '#e8d57a', 6);
    this.toast(`+${yieldN} ${ITEMS[kind].name}${yieldN > 1 ? 's' : ''}`, kind);
    this.maybeRelic('gloves', 'Something glints in the turned soil...');
    this.ui.refreshHud(this);
    save(s);
  }

  petChicken() {
    const s = this.state;
    s.chicken.pettedDay = s.day;
    s.chicken.egg = true;
    s.stats.petted += 1;
    this.sfx.cluck();
    this.toast('Clementine is delighted! She left you an egg by the coop.', 'heart');
    const ch = this.chickenPos();
    this.burst(ch.x, ch.y - 20, '#e2566a', 5);
    this.maybeRelic('crown', 'Clementine scratches something out of the dust...');
    save(s);
  }

  pickBerries(i) {
    const s = this.state;
    s.berriesPicked.push(i);
    addItem(s, 'berry', 2);
    s.stats.berries += 2;
    this.sfx.harvest();
    this.toast('+2 Bramble Berries', 'berry');
    this.maybeRelic('sboots', 'Something was buried under the berry bush!');
    save(s);
  }

  castLine() {
    this.fishing = { phase: 'wait', t: 1.2 + Math.random() * 2.6 };
    this.player.facing = 'left';
    this.sfx.splash();
  }

  reelIn() {
    const s = this.state;
    this.fishing = null;
    addItem(s, 'fish');
    s.stats.fish += 1;
    s.fishedToday += 1;
    this.sfx.harvest();
    this.toast('Caught a Mirror Trout!', 'fish');
    this.maybeRelic('pendant', 'Something glimmers on the hook...');
    save(s);
  }

  maybeRelic(piece, msg) {
    const s = this.state;
    if (s.set[piece]) return;
    if (!s.bosses[1] || s.goldEarned < RELIC_GOLD) return;
    if (Math.random() > 0.16) return;
    s.set[piece] = true;
    this.toast(msg, 'star');
    this.toastQ.push([`${SET_PIECES[piece].name} acquired! ${SET_PIECES[piece].desc}.`, 'star']);
    this.sfx.relic();
    this.ui.refreshHud(this);
    save(s);
  }

  talkJay() {
    const s = this.state;
    const j = s.jay;
    this.sfx.talk();
    const giftable = ['feather', 'amber'].filter((k) => (s.inv[k] || 0) > 0);
    const canGift = j.giftedDay !== s.day && giftable.length > 0;
    let line;
    if (j.talkedDay !== s.day) {
      j.talkedDay = s.day;
      j.aff += 1;
      line = jayLine(s, Math.random());
    } else {
      line = "We already talked today but... I don't mind. Stay a minute.";
    }
    save(s);
    this.ui.dialogue('Jay', line, null, canGift ? {
      label: `Give ${ITEMS[giftable[0]].name}`,
      action: () => this.giftJay(giftable[0]),
    } : null);
  }

  giftJay(item) {
    const s = this.state;
    s.inv[item] -= 1;
    s.jay.giftedDay = s.day;
    s.jay.aff += ITEMS[item].gift || 1;
    this.sfx.relic();
    save(s);
    this.ui.refreshHud(this);
    this.ui.dialogue('Jay', jayGiftLine(item));
  }

  // -------------------------------------------------------------- render --
  render(g) {
    const s = this.state;
    const map = MAPS[this.mapId];
    const p = this.player;

    g.save();
    if (this.shake > 0) {
      g.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }

    const entities = [];
    const underlays = [];

    // farm dynamics
    if (this.mapId === 'farm') {
      underlays.push((gg) => {
        for (let i = 0; i < 9; i++) {
          const c = plotCenter(i);
          soilPlot(gg, c.x, c.y, PLOT.cell);
        }
      });
      s.plots.forEach((pl, i) => {
        if (!pl.kind) return;
        const c = plotCenter(i);
        const tGrow = clamp(pl.daysGrown / SEEDS[pl.kind].days, 0, 1);
        entities.push({ y: c.y, draw: (gg) => drawCrop(gg, c.x, c.y, pl.kind, tGrow, Math.sin(this.t * 1.6 + i)) });
      });
      const ch = this.chickenPos();
      entities.push({ y: ch.y, draw: (gg) => chicken(gg, ch.x, ch.y, this.t, s.chicken.pettedDay === s.day && Math.sin(this.t) > 0.4) });
      if (s.chicken.egg) entities.push({ y: 248, draw: (gg) => drawEgg(gg, 470, 248) });
    }

    if (this.mapId === 'village') {
      for (const id of Object.keys(NPCS)) {
        const n = NPCS[id];
        entities.push({ y: n.y, draw: (gg) => {
          villager(gg, n.x, n.y, this.t, n.look);
          // daily-chat heart over Jay
          if (id === 'jay' && s.jay.talkedDay !== s.day) {
            this.bubble(gg, n.x, n.y - 62, 'heart');
          }
        } });
      }
    }

    if (this.mapId === 'forest') {
      MAPS.forest.berries.forEach((b, i) => {
        const picked = s.berriesPicked.includes(i);
        entities.push({ y: b.y, draw: (gg) => {
          bush(gg, b.x, b.y, 17, 1000 + i * 13, ['#3f5222', '#5a7029', '#788c33']);
          if (!picked) {
            const rand = rng(i * 77 + 5);
            for (let k = 0; k < 6; k++) {
              const a = rand() * TAU, d = 4 + rand() * 10;
              const bx = b.x + Math.cos(a) * d * 1.4, by = b.y - 12 + Math.sin(a) * d * 0.8;
              gg.fillStyle = '#c9527a';
              ell(gg, bx, by, 3.2, 3.2); gg.fill();
              gg.fillStyle = 'rgba(255,255,255,0.65)';
              ell(gg, bx - 1, by - 1, 1.1, 1.1); gg.fill();
            }
          }
        } });
      });
    }

    if (this.mapId === 'lake' && this.fishing) {
      const f = MAPS.lake.fishSpot;
      entities.push({ y: 998, draw: (gg) => {
        // line + bobber
        gg.strokeStyle = 'rgba(40,30,20,0.6)';
        gg.lineWidth = 1.4;
        gg.beginPath();
        gg.moveTo(p.x - 12, p.y - 34);
        gg.quadraticCurveTo(p.x - 50, p.y - 60, f.x - 60, f.y + 6);
        gg.stroke();
        const bobY = f.y + 6 + (this.fishing.phase === 'bite' ? Math.sin(this.t * 25) * 4 : Math.sin(this.t * 3) * 1.5);
        gg.fillStyle = '#d9534f';
        ell(gg, f.x - 60, bobY, 4.5, 4.5); gg.fill();
        gg.fillStyle = '#fff';
        ell(gg, f.x - 60, bobY - 2.5, 4.5, 2); gg.fill();
        if (this.fishing.phase === 'bite') this.bubble(gg, f.x - 60, bobY - 26, 'alert');
      } });
    }

    // ruins: sealed barrier + cache
    if (map.ruin) {
      const sealed = !this.roomCleared(map);
      if (!map.final && sealed) {
        entities.push({ y: 80, draw: (gg) => {
          const cx = VIEW_W / 2;
          gg.fillStyle = `rgba(185,240,224,${0.18 + Math.sin(this.t * 2.4) * 0.05})`;
          gg.beginPath();
          gg.moveTo(cx - 44, 74); gg.lineTo(cx - 44, 36);
          gg.quadraticCurveTo(cx, 12, cx + 44, 36); gg.lineTo(cx + 44, 74);
          gg.closePath(); gg.fill();
          gg.strokeStyle = 'rgba(185,240,224,0.5)';
          gg.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            const yy = 30 + i * 16;
            gg.beginPath(); gg.moveTo(cx - 40, yy + 8); gg.lineTo(cx + 40, yy + 4); gg.stroke();
          }
        } });
      }
      if (map.boss === 2 && s.bosses[2] && !s.cacheOpened) {
        entities.push({ y: 232, draw: (gg) => {
          drawChest(gg, VIEW_W / 2, 232, 1.2);
          gg.fillStyle = radgrad(gg, VIEW_W / 2, 210, 40, [[0, 'rgba(205,185,236,0.35)'], [1, 'rgba(205,185,236,0)']]);
          ell(gg, VIEW_W / 2, 210, 40, 30); gg.fill();
        } });
      }
    }

    // enemies
    for (const e of this.enemies) {
      if (e.dead) continue;
      entities.push({ y: e.y, draw: (gg) => {
        gg.save();
        if (e.hitT > 0) { gg.globalAlpha = 0.6 + Math.sin(this.t * 60) * 0.3; }
        if (e.kind === 'nibbler') nibbler(gg, e.x, e.y, e.t, { s: 1 + (map.depth || 0) * 0.04 });
        else if (e.kind === 'wisp') wisp(gg, e.x, e.y, e.t);
        else if (e.kind === 'golem') golem(gg, e.x, e.y, e.t, e.tier, e.hitT);
        else if (e.kind === 'heart') ruinHeart(gg, e.x, e.y, e.t, e.hp / e.maxHp);
        gg.restore();
        // boss hp bar
        if (e.kind === 'golem' || e.kind === 'heart') {
          const bw = 70;
          const top = e.kind === 'heart' ? 120 : 60 + e.tier * 18;
          gg.fillStyle = 'rgba(30,22,40,0.7)';
          rr(gg, e.x - bw / 2, e.y - top - 10, bw, 7, 3.5); gg.fill();
          gg.fillStyle = '#e2566a';
          rr(gg, e.x - bw / 2 + 1, e.y - top - 9, Math.max(3, (bw - 2) * (e.hp / e.maxHp)), 5, 2.5); gg.fill();
        }
      } });
    }

    // pickups
    for (const pk of this.pickups) {
      entities.push({ y: pk.y, draw: (gg) => {
        if (pk.kind === 'coin') {
          const fl = Math.sin(this.t * 4 + pk.x) * 2;
          gg.fillStyle = '#b8860b';
          ell(gg, pk.x, pk.y - 8 - fl, 6.5, 6.5); gg.fill();
          gg.fillStyle = '#f2c14e';
          ell(gg, pk.x, pk.y - 9 - fl, 6, 6); gg.fill();
          gg.fillStyle = '#fff3c4';
          ell(gg, pk.x - 2, pk.y - 11 - fl, 2, 2); gg.fill();
        } else {
          drawPickup(gg, pk.x, pk.y, this.t, pk.kind === 'feather' ? 'feather' : pk.kind === 'amber' ? 'amber' : 'star');
        }
      } });
    }

    // player
    entities.push({ y: p.y, draw: (gg) => {
      gg.save();
      if (p.iframes > 0) gg.globalAlpha = 0.55 + Math.sin(this.t * 40) * 0.35;
      farmer(gg, p.x, p.y, p.facing, p.phase, p.moving, p.swing);
      gg.restore();
    } });

    this.R.drawScene(g, this.mapId, s, this.t, entities, underlays);

    // chimney smoke drifts above everything
    for (const sm of this.smoke) {
      const a = 0.34 * Math.min(1, sm.t * 2) * (1 - sm.t / sm.life);
      g.fillStyle = `rgba(244,238,222,${a})`;
      ell(g, sm.x, sm.y, sm.r, sm.r * 0.85);
      g.fill();
    }
    // particles above scene
    for (const pa of this.particles) {
      g.globalAlpha = clamp(pa.t * 2.4, 0, 1);
      g.fillStyle = pa.col;
      ell(g, pa.x, pa.y, 2.6, 2.6);
      g.fill();
    }
    g.globalAlpha = 1;

    // interaction prompt
    if (this.mode === 'play' && !this.ui.menuOpen && this.currentInteract) {
      this.promptPill(g, this.currentInteract);
    }

    // daylight tint
    this.R.daylight(g, s.dayT / DAY_LENGTH, map.indoor);
    g.restore();

    // fade curtain
    if (this.fade.a > 0.002) {
      g.fillStyle = `rgba(24,20,14,${clamp(this.fade.a, 0, 1)})`;
      g.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }

  bubble(g, x, y, kind) {
    const bobble = Math.sin(this.t * 3) * 2.5;
    g.save();
    g.translate(x, y + bobble);
    g.fillStyle = 'rgba(252,248,236,0.95)';
    g.beginPath();
    g.ellipse(0, 0, 13, 12, 0, 0, TAU);
    g.fill();
    g.beginPath();
    g.moveTo(-4, 10); g.lineTo(0, 17); g.lineTo(4, 10);
    g.closePath(); g.fill();
    if (kind === 'heart') {
      g.fillStyle = '#e2566a';
      g.translate(0, 1);
      g.scale(0.8, 0.8);
      g.beginPath();
      g.moveTo(0, 6);
      g.bezierCurveTo(-9, -2, -7, -10, 0, -5);
      g.bezierCurveTo(7, -10, 9, -2, 0, 6);
      g.fill();
    } else {
      g.fillStyle = '#d9534f';
      g.font = 'bold 16px sans-serif';
      g.textAlign = 'center';
      g.fillText('!', 0, 6);
    }
    g.restore();
  }

  promptPill(g, inter) {
    const text = inter.label;
    g.save();
    g.font = '600 15px Quicksand, sans-serif';
    const w = g.measureText(text).width + 46;
    const x = clamp(inter.x - w / 2, 8, VIEW_W - w - 8);
    const y = clamp(inter.y - 86, 10, VIEW_H - 40);
    g.fillStyle = 'rgba(44,36,26,0.82)';
    rr(g, x, y, w, 30, 15); g.fill();
    g.strokeStyle = 'rgba(250,238,200,0.35)';
    g.lineWidth = 1.4; g.stroke();
    // E key cap
    g.fillStyle = '#f2c14e';
    rr(g, x + 6, y + 5, 20, 20, 6); g.fill();
    g.fillStyle = '#4a3b2a';
    g.font = '700 13px Quicksand, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('E', x + 16, y + 16);
    g.fillStyle = '#fcf6e6';
    g.font = '600 15px Quicksand, sans-serif';
    g.textAlign = 'left';
    g.fillText(text, x + 33, y + 16);
    g.restore();
  }
}
