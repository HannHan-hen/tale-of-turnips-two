// Headless gameplay smoke test: drives the real Game class through the
// farming loop, shops, ruins combat and the ending, with stubbed DOM bits.
import { createCanvas } from 'canvas';
import { Renderer } from '../src/render.js';
import { MAPS, VIEW_W, VIEW_H, plotCenter } from '../src/maps.js';

// stubs
global.localStorage = {
  _d: {},
  getItem(k) { return this._d[k] ?? null; },
  setItem(k, v) { this._d[k] = String(v); },
  removeItem(k) { delete this._d[k]; },
};
global.window = { addEventListener() {} };

const { Game } = await import('../src/game.js');
const { SEEDS, maxHearts } = await import('../src/state.js');

const sfxStub = new Proxy({}, { get: () => () => {} });
const uiStub = {
  menuOpen: false,
  toasts: [],
  toast(msg) { this.toasts.push(msg); },
  refreshHud() {},
  tick() {},
  dialogue(name, text) { this.lastDialogue = `${name}: ${text}`; },
  openShipping() { this.opened = 'shipping'; },
  openSeedShop() { this.opened = 'seeds'; },
  openSmith() { this.opened = 'smith'; },
  openCollection() { this.opened = 'collection'; },
  showEnding() { this.opened = 'ending'; },
  hideTitle() {},
};
const inputStub = {
  axis: () => ({ x: 0, y: 0 }),
  hit: () => false,
  interact: () => false,
  attack: () => false,
  consumeAny: () => true,
  endFrame() {},
  touch: {},
};

const R = new Renderer((w, h) => createCanvas(w, h), 1);
const game = new Game(R, inputStub, sfxStub, uiStub);

let failures = 0;
const ok = (cond, msg) => {
  if (!cond) { failures++; console.error('FAIL:', msg); }
  else console.log(' ok :', msg);
};

// --- title -> play
game.update(1 / 60);
ok(game.mode === 'play', 'title dismisses to play');

// --- plant all turnips
const s = game.state;
ok(s.seeds.turnip === 12, 'starts with 12 turnip seeds');
for (let i = 0; i < 9; i++) game.plant(i);
ok(s.seeds.turnip === 3, 'planting consumes seeds');
ok(s.plots.every((p) => p.kind === 'turnip'), 'all plots planted');

// --- advance days; crops mature at 3 days
game.advanceDay(); game.advanceDay(); game.advanceDay();
ok(s.day === 4, 'day advances');
ok(s.plots[0].daysGrown >= SEEDS.turnip.days, 'turnips mature after 3 days');
game.harvest(0);
ok((s.inv.turnip || 0) === 1, 'harvest yields a turnip');
for (let i = 1; i < 9; i++) game.harvest(i);
ok(s.inv.turnip === 9, 'harvested all nine');
ok(s.stats.harvested === 9, 'stats track harvest');

// --- shipping (simulate the menu's sell)
s.gold += 14 * s.inv.turnip; s.goldEarned += 14 * s.inv.turnip; s.inv.turnip = 0;
ok(s.gold === 126, 'turnips sell for 14g each');

// --- chicken
game.petChicken();
ok(s.chicken.egg === true, 'petting produces egg');
ok(s.stats.petted === 1, 'pet stat');

// --- map travel via enter
game.enter('village', { x: 100, y: 400 });
ok(game.mapId === 'village', 'enter village');
game.talkJay();
ok(s.jay.aff === 1, 'talking to Jay raises affection');
game.talkJay();
ok(s.jay.aff === 1, 'no double affection same day');

// --- buy sword (simulate smith purchase)
s.gold += 100;
s.equip.sword = true;

// --- ruins room 1 combat
game.enter('ruin1', { x: 480, y: 620 });
ok(game.enemies.length > 0, 'ruin1 spawns enemies');
const before = game.enemies.filter((e) => !e.dead).length;
// player attacks everything by teleporting next to each enemy
for (const e of [...game.enemies]) {
  game.player.x = e.x; game.player.y = e.y + 30;
  game.player.facing = 'up';
  game.player.swingCd = 0;
  for (let k = 0; k < 12 && !e.dead; k++) {
    game.player.swingCd = 0;
    game.tryAttack(MAPS.ruin1);
  }
}
ok(game.enemies.every((e) => e.dead), `cleared room (${before} enemies)`);
ok(s.roomsClearedDay.ruin1 === s.day, 'room marked cleared today');
ok(game.pickups.length > 0, 'enemies dropped loot');

// --- pickups collected when near
game.player.x = game.pickups[0].x; game.player.y = game.pickups[0].y;
game.pickups.forEach((pk) => { pk.t = 1; });
const goldBefore = s.gold;
game.updatePickups(1 / 60);
ok(s.gold > goldBefore || Object.values(s.inv).some((v) => v > 0), 'pickup collected');

// --- boss room
game.enter('ruin2', { x: 480, y: 620 });
const boss = game.enemies.find((e) => e.kind === 'golem');
ok(!!boss, 'boss room 1 has a Warden golem');
s.threat = 2;
while (!boss.dead) {
  game.player.x = boss.x; game.player.y = boss.y + 40;
  game.player.facing = 'up';
  game.player.swingCd = 0;
  game.tryAttack(MAPS.ruin2);
}
ok(s.bosses[1] === true, 'boss 1 defeated and recorded');
ok(s.threat === 1, 'boss kill lowers threat');

// --- sealed door logic
ok(game.roomCleared(MAPS.ruin2), 'boss room cleared check');
ok(!game.roomCleared(MAPS.ruin3), 'ruin3 not cleared yet');

// --- threat raid spawn (farm, threat >= 3)
s.threat = 4;
game.enter('farm', { x: 480, y: 400 });
game.plant(0);
game.raidTimer = 0.01;
game.updateRaids(0.05, MAPS.farm);
ok(game.enemies.some((e) => e.raider), 'raiders spawn at high threat');

// --- raider eats a crop
const raider = game.enemies.find((e) => e.raider);
const target0 = plotCenter(0);
raider.x = target0.x; raider.y = target0.y;
for (let i = 0; i < 60 * 6; i++) game.updateEnemies(1 / 60, MAPS.farm);
ok(s.plots[0].kind === null, 'raider ate the crop');

// --- relic drop path (force RNG)
s.goldEarned = 999;
const mr = Math.random;
Math.random = () => 0.01;
game.petChicken(); // pettedDay equals same day so still works for relic? petChicken sets again - fine
Math.random = mr;
ok(s.set.crown === true, 'relic can drop from petting after boss1+gold');
ok(maxHearts(s) >= 2, 'crown grants heart');

// --- final boss & win
game.enter('ruin7', { x: 480, y: 620 });
const heart = game.enemies.find((e) => e.kind === 'heart');
ok(!!heart, 'final room has the Ruin Heart');
let guard = 0;
while (game.enemies.some((e) => !e.dead) && guard++ < 500) {
  const target = game.enemies.find((e) => !e.dead);
  game.player.x = target.x; game.player.y = target.y + 40;
  game.player.facing = 'up';
  game.player.swingCd = 0;
  game.player.iframes = 2;
  game.tryAttack(MAPS.ruin7);
}
ok(s.bosses.final === true || game.mode === 'ending', 'Ruin Heart defeated triggers ending');
ok(uiStub.opened === 'ending', 'ending screen shown');

// --- death path
game.mode = 'play';
s.gold = 100;
s.hearts = 1;
game.enter('ruin1', { x: 480, y: 620 });
game.hurtPlayer({ x: 480, y: 600 });
ok(game.fade.dir > 0, 'death starts fade');
game.fade.a = 1;
game.update(1 / 60); // triggers fade.then -> respawn
ok(s.gold === 90, 'death costs 10% gold');
ok(game.mapId === 'house', 'wake up at home');

// --- map-edge exits trigger from inside the walkable area
game.mode = 'play';
game.fade = { a: 0, dir: 0, then: null };
game.enter('farm', { x: 480, y: 400 });
const walkF = MAPS.farm.walk;
game.player.x = walkF.x + walkF.w - 11; game.player.y = 385; // hugging east wall
game.updatePlayer(1 / 60, MAPS.farm);
ok(game.fade.dir > 0, 'east edge exit triggers inside walk bounds');
game.fade.a = 1; game.update(1 / 60); // fire transition
ok(game.mapId === 'village', 'arrived in village via edge exit');
// spawn point must not instantly bounce back through the exit
game.fade = { a: 0, dir: 0, then: null };
game.updatePlayer(1 / 60, MAPS.village);
ok(game.fade.dir === 0, 'village spawn clear of exit trigger');
// every exit spawn lands clear of all triggers on the destination map
let safeSpawns = true;
for (const mid of Object.keys(MAPS)) {
  for (const ex of MAPS[mid].exits || []) {
    game.enter(ex.to, ex.spawn);
    game.fade = { a: 0, dir: 0, then: null };
    game.updatePlayer(1 / 60, MAPS[ex.to]);
    if (game.fade.dir !== 0) { safeSpawns = false; console.error('   bounce:', mid, '->', ex.to); }
  }
}
ok(safeSpawns, 'no spawn bounces straight back through an exit');

// --- house door is reachable
game.fade = { a: 0, dir: 0, then: null };
game.enter('house', { x: 480, y: 300 });
const walkH = MAPS.house.walk;
game.player.x = 480; game.player.y = walkH.y + walkH.h - 11;
const inter = game.nearestInteract(MAPS.house);
ok(inter && inter.label === 'Outside', 'house exit door prompt reachable');
inter.action();
game.fade.a = 1; game.update(1 / 60);
ok(game.mapId === 'farm', 'left the house through the door');

// --- render every map once (sanity against draw crashes)
const c = createCanvas(VIEW_W, VIEW_H);
const g = c.getContext('2d');
for (const id of Object.keys(MAPS)) {
  game.enter(id, { x: 480, y: 400 });
  game.currentInteract = null;
  game.render(g);
}
ok(true, 'all maps render without crashing');

// --- save/load roundtrip
const { save, load } = await import('../src/state.js');
save(s);
const loaded = load();
ok(loaded && loaded.day === s.day && loaded.gold === s.gold, 'save/load roundtrip');

console.log(failures ? `\n${failures} FAILURES` : '\nALL TESTS PASSED');
process.exit(failures ? 1 : 0);
