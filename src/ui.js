// DOM overlay: HUD, toasts, dialogue, shop menus, collection, title and
// ending screens. Crisp text lives in DOM; the world lives on canvas.

import { SEEDS, SEED_ORDER, ITEMS, GEAR, SET_PIECES, maxHearts, setCount, clearSave, highScore } from './state.js';
import { jayTier, JAY_TIER_NAMES } from './dialogue.js';
import { rr, ell } from './art.js';
import { heartPath, drawIcon } from './props.js';

const $ = (sel) => document.querySelector(sel);

// Small canvas icons for HUD/menus, cached per kind+size.
const iconCache = new Map();
export function iconEl(kind, size = 22) {
  const key = kind + size;
  if (!iconCache.has(key)) {
    const c = document.createElement('canvas');
    c.width = size * 2; c.height = size * 2;
    c.style.width = size + 'px'; c.style.height = size + 'px';
    c.className = 'icon';
    const g = c.getContext('2d');
    g.scale(2, 2);
    paintIcon(g, kind, size / 2, size / 2, size * 0.42);
    iconCache.set(key, c);
  }
  return cloneCanvas(iconCache.get(key));
}

function cloneCanvas(src) {
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  c.style.cssText = src.style.cssText;
  c.className = src.className;
  c.getContext('2d').drawImage(src, 0, 0);
  return c;
}

export function paintIcon(g, kind, x, y, r) {
  g.save();
  g.translate(x, y);
  const s = r / 9;
  g.scale(s, s);
  g.lineCap = 'round'; g.lineJoin = 'round';
  switch (kind) {
    case 'heart':
      g.fillStyle = '#e2566a';
      g.scale(1.5, 1.5);
      heartPath(g); g.fill();
      break;
    case 'heart-empty':
      g.strokeStyle = 'rgba(226,86,106,0.6)';
      g.lineWidth = 1.6;
      g.scale(1.5, 1.5);
      heartPath(g); g.stroke();
      break;
    case 'coin':
      g.fillStyle = '#b8860b'; ell(g, 0, 0.8, 8.5, 8.5); g.fill();
      g.fillStyle = '#f2c14e'; ell(g, 0, 0, 8.5, 8.5); g.fill();
      g.fillStyle = '#d9a431'; ell(g, 0, 0, 5.5, 5.5); g.fill();
      g.fillStyle = '#fff3c4'; ell(g, -3, -3.4, 2.2, 2.2); g.fill();
      break;
    case 'turnip': case 'radish': case 'carrot': case 'berry': case 'fish': case 'sword':
      drawIcon(g, kind === 'radish' || kind === 'carrot' ? 'turnip' : kind, 0, 0, 9);
      if (kind === 'radish') { g.fillStyle = '#d85f6a'; ell(g, 0, 2.5, 5.6, 5); g.fill(); g.fillStyle = '#f3c9cd'; ell(g, 0, 4.6, 3.6, 2.2); g.fill(); }
      if (kind === 'carrot') {
        g.fillStyle = '#fff'; ell(g, 0, 3, 6.2, 5.6); g.fill();
        g.fillStyle = '#e08236';
        g.beginPath(); g.moveTo(-4.5, -1); g.quadraticCurveTo(0, 10, 0, 10); g.quadraticCurveTo(0, 10, 4.5, -1); g.quadraticCurveTo(0, -4, -4.5, -1); g.fill();
      }
      break;
    case 'egg':
      g.fillStyle = '#fdf8ec'; ell(g, 0, 0.5, 6, 7.5); g.fill();
      g.fillStyle = '#e0d4b8'; ell(g, 1.5, 2.5, 4, 4.5); g.fill();
      g.fillStyle = '#fff'; ell(g, -2, -2.5, 2, 2.6); g.fill();
      break;
    case 'amber':
      g.fillStyle = '#e8a33d';
      g.beginPath(); g.moveTo(0, -7); g.lineTo(6, -1); g.lineTo(3.5, 6); g.lineTo(-3.5, 6); g.lineTo(-6, -1); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.5)'; ell(g, -1.5, -2, 1.8, 2.6); g.fill();
      break;
    case 'feather':
      g.fillStyle = '#d8e4f0';
      g.beginPath(); g.moveTo(0, -8); g.quadraticCurveTo(7, -2, 1, 7); g.quadraticCurveTo(-5, 0, 0, -8); g.fill();
      g.strokeStyle = '#9aa8bc'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -7); g.lineTo(0.6, 6); g.stroke();
      break;
    case 'star':
      g.fillStyle = '#cdb9ec';
      g.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        const a2 = a + Math.PI / 5;
        g.lineTo(Math.cos(a) * 8, Math.sin(a) * 8);
        g.lineTo(Math.cos(a2) * 3.6, Math.sin(a2) * 3.6);
      }
      g.closePath(); g.fill();
      break;
    case 'star-empty':
      g.strokeStyle = 'rgba(205,185,236,0.5)'; g.lineWidth = 1.4;
      g.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        const a2 = a + Math.PI / 5;
        g.lineTo(Math.cos(a) * 8, Math.sin(a) * 8);
        g.lineTo(Math.cos(a2) * 3.6, Math.sin(a2) * 3.6);
      }
      g.closePath(); g.stroke();
      break;
    case 'skull':
      g.fillStyle = '#e8e2d4';
      ell(g, 0, -1.5, 6.5, 6); g.fill();
      g.fillRect(-4, 2, 8, 4);
      g.fillStyle = '#3a2c44';
      ell(g, -2.6, -2, 1.8, 2.2); g.fill();
      ell(g, 2.6, -2, 1.8, 2.2); g.fill();
      break;
    case 'sun':
      g.fillStyle = '#f5b03c';
      ell(g, 0, 0, 5, 5); g.fill();
      g.strokeStyle = '#f5b03c'; g.lineWidth = 1.8;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.beginPath();
        g.moveTo(Math.cos(a) * 6.6, Math.sin(a) * 6.6);
        g.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
        g.stroke();
      }
      break;
    case 'seed':
      g.fillStyle = '#bf9a64';
      g.beginPath();
      g.moveTo(-6, -4); g.quadraticCurveTo(0, -8, 6, -4);
      g.quadraticCurveTo(8, 4, 0, 8); g.quadraticCurveTo(-8, 4, -6, -4);
      g.fill();
      g.strokeStyle = '#8a6a3c'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(-5, -3.4); g.quadraticCurveTo(0, -6.4, 5, -3.4); g.stroke();
      g.fillStyle = '#6e4f2a';
      ell(g, -2, 1.5, 1.2, 1.8); g.fill();
      ell(g, 2.2, 2.5, 1.2, 1.8); g.fill();
      break;
    case 'door':
      g.fillStyle = '#8c5e34';
      rr(g, -5.5, -8, 11, 16, [5, 5, 1, 1]); g.fill();
      g.fillStyle = '#e9c46a'; ell(g, 2.6, 1, 1.4, 1.4); g.fill();
      break;
    default:
      g.fillStyle = '#ccc'; ell(g, 0, 0, 7, 7); g.fill();
  }
  g.restore();
}

export class UI {
  constructor(sfx) {
    this.sfx = sfx;
    this.menuOpen = false;
    this.game = null;
    this.toastTimers = [];
    $('#menu-close').addEventListener('click', () => this.closeMenu());
    this.escUsed = false;
    window.addEventListener('keydown', (e) => {
      if (e.code !== 'Escape') return;
      if (!$('#dialogue').classList.contains('hidden')) {
        this.advanceDialogue();
        this.escUsed = true;
      } else if (!$('#menu').classList.contains('hidden')) {
        this.closeMenu();
        this.escUsed = true;
      }
    });
    $('#dlg-next').addEventListener('click', () => this.advanceDialogue());
    window.addEventListener('keydown', (e) => {
      if ((e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') && !$('#dialogue').classList.contains('hidden')) {
        e.preventDefault();
        this.advanceDialogue();
      }
    });
  }

  // ------------------------------------------------------------- title ----
  hideTitle() {
    $('#title').classList.add('hidden');
  }

  showTitle(paused) {
    $('#title').classList.remove('hidden');
    $('.title-press').textContent = paused ? 'paused — press any key to continue' : 'press any key to begin';
    if (paused) $('#title-reset').classList.remove('hidden');
  }

  // true once if Esc was already used to close a menu/dialogue this frame
  consumeEsc() {
    const used = this.escUsed;
    this.escUsed = false;
    return used;
  }

  // -------------------------------------------------------------- toast ---
  toast(msg, icon = 'star') {
    const box = $('#toasts');
    const el = document.createElement('div');
    el.className = 'toast';
    el.appendChild(iconEl(icon, 20));
    const span = document.createElement('span');
    span.textContent = msg;
    el.appendChild(span);
    box.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 400);
    }, 3400);
    while (box.children.length > 3) box.firstChild.remove();
  }

  // ---------------------------------------------------------------- hud ---
  refreshHud(game) {
    this.game = game;
    const s = game.state;
    // hearts
    const hb = $('#hearts');
    hb.innerHTML = '';
    const mh = maxHearts(s);
    for (let i = 0; i < mh; i++) {
      hb.appendChild(iconEl(i < s.hearts ? 'heart' : 'heart-empty', 22));
    }
    $('#gold-n').textContent = s.gold;
    $('#day-n').textContent = s.day;
    // threat
    const th = $('#threat');
    th.innerHTML = '';
    if (s.threat > 0) {
      th.appendChild(iconEl('skull', 16));
      const sp = document.createElement('span');
      sp.textContent = '!'.repeat(Math.min(5, s.threat));
      th.appendChild(sp);
      th.title = `Ruin threat: ${s.threat}`;
    }
    // stars
    const st = $('#setpieces');
    st.innerHTML = '';
    const n = setCount(s);
    if (n > 0 || s.bosses[1]) {
      for (let i = 0; i < 5; i++) st.appendChild(iconEl(i < n ? 'star' : 'star-empty', 15));
    }
    // hotbar
    const bar = $('#hotbar');
    bar.innerHTML = '';
    SEED_ORDER.forEach((kind, i) => {
      const slot = document.createElement('div');
      slot.className = 'slot' + (s.selSeed === kind ? ' sel' : '');
      const key = document.createElement('b');
      key.textContent = i + 1;
      slot.appendChild(key);
      slot.appendChild(iconEl(kind, 24));
      const ct = document.createElement('i');
      ct.textContent = s.seeds[kind];
      slot.appendChild(ct);
      slot.title = `${SEEDS[kind].name} seeds (${SEEDS[kind].days} days)`;
      slot.addEventListener('click', () => { s.selSeed = kind; this.refreshHud(game); });
      bar.appendChild(slot);
    });
    // sword indicator
    $('#swordslot').classList.toggle('hidden', !s.equip.sword);
  }

  tick(game) {
    const s = game.state;
    const frac = Math.min(1, s.dayT / 75);
    $('#daybar i').style.width = (frac * 100).toFixed(1) + '%';
    $('#daybar').classList.toggle('dusk', frac > 0.62);
  }

  // ----------------------------------------------------------- dialogue ---
  dialogue(name, text, onClose = null, extra = null) {
    this.menuOpen = true;
    this._dlgClose = onClose;
    $('#dialogue').classList.remove('hidden');
    $('#dlg-name').textContent = name;
    const body = $('#dlg-text');
    body.textContent = '';
    this._typing = { text, i: 0 };
    clearInterval(this._typeIv);
    this._typeIv = setInterval(() => {
      if (!this._typing) return;
      this._typing.i += 2;
      body.textContent = text.slice(0, this._typing.i);
      if (this._typing.i >= text.length) { clearInterval(this._typeIv); this._typing = null; }
    }, 18);
    const ex = $('#dlg-extra');
    if (extra) {
      ex.classList.remove('hidden');
      ex.textContent = extra.label;
      ex.onclick = () => { this.hideDialogue(); extra.action(); };
    } else {
      ex.classList.add('hidden');
      ex.onclick = null;
    }
  }

  advanceDialogue() {
    if ($('#dialogue').classList.contains('hidden')) return;
    if (this._typing) { // fast-forward
      $('#dlg-text').textContent = this._typing.text;
      this._typing = null;
      clearInterval(this._typeIv);
      return;
    }
    const onClose = this._dlgClose;
    this.hideDialogue();
    if (onClose) onClose();
  }

  hideDialogue() {
    $('#dialogue').classList.add('hidden');
    this._dlgClose = null;
    this._typing = null;
    clearInterval(this._typeIv);
    this.menuOpen = !$('#menu').classList.contains('hidden');
  }

  // --------------------------------------------------------------- menus --
  openMenu(title) {
    this.menuOpen = true;
    $('#menu').classList.remove('hidden');
    $('#menu-title').textContent = title;
    const body = $('#menu-body');
    body.innerHTML = '';
    return body;
  }

  closeMenu() {
    $('#menu').classList.add('hidden');
    this.menuOpen = !$('#dialogue').classList.contains('hidden');
    if (this.game) this.refreshHud(this.game);
  }

  row(body, { icon, name, desc, price, btn, onBuy, disabled, badge }) {
    const r = document.createElement('div');
    r.className = 'row';
    r.appendChild(iconEl(icon, 30));
    const mid = document.createElement('div');
    mid.className = 'mid';
    const nm = document.createElement('b'); nm.textContent = name;
    const ds = document.createElement('small'); ds.textContent = desc || '';
    mid.appendChild(nm); mid.appendChild(ds);
    r.appendChild(mid);
    if (badge) {
      const bd = document.createElement('span');
      bd.className = 'badge'; bd.textContent = badge;
      r.appendChild(bd);
    }
    if (btn) {
      const b = document.createElement('button');
      b.innerHTML = btn + (price != null ? ` <em>${price}g</em>` : '');
      b.disabled = !!disabled;
      b.addEventListener('click', onBuy);
      r.appendChild(b);
    }
    body.appendChild(r);
    return r;
  }

  goldLine(body, s) {
    const d = document.createElement('div');
    d.className = 'goldline';
    d.appendChild(iconEl('coin', 20));
    const sp = document.createElement('span');
    sp.textContent = s.gold + 'g';
    d.appendChild(sp);
    body.prepend(d);
  }

  openSeedShop(game) {
    const s = game.state;
    const body = this.openMenu("Marigold's Seeds");
    for (const kind of SEED_ORDER) {
      const sd = SEEDS[kind];
      this.row(body, {
        icon: kind,
        name: `${sd.name} seed`,
        desc: `Grows in ${sd.days} days · sells for ${ITEMS[kind].sell}g`,
        price: sd.price,
        btn: 'Buy',
        disabled: s.gold < sd.price,
        onBuy: () => {
          if (s.gold < sd.price) return;
          s.gold -= sd.price;
          s.seeds[kind] += 1;
          game.sfx.coin();
          this.openSeedShop(game);
          this.refreshHud(game);
        },
      });
      // buy 5
      const last = body.lastChild;
      const b5 = document.createElement('button');
      b5.innerHTML = `×5 <em>${sd.price * 5}g</em>`;
      b5.disabled = s.gold < sd.price * 5;
      b5.addEventListener('click', () => {
        if (s.gold < sd.price * 5) return;
        s.gold -= sd.price * 5;
        s.seeds[kind] += 5;
        game.sfx.coin();
        this.openSeedShop(game);
        this.refreshHud(game);
      });
      last.appendChild(b5);
    }
    this.goldLine(body, s);
  }

  openSmith(game) {
    const s = game.state;
    const body = this.openMenu("Bramble's Smithy");
    for (const id of Object.keys(GEAR)) {
      const gr = GEAR[id];
      const owned = s.equip[id];
      this.row(body, {
        icon: id === 'sword' ? 'sword' : 'heart',
        name: gr.name,
        desc: gr.desc,
        price: owned ? null : gr.price,
        btn: owned ? null : 'Buy',
        badge: owned ? 'Owned' : null,
        disabled: s.gold < gr.price,
        onBuy: () => {
          if (owned || s.gold < gr.price) return;
          s.gold -= gr.price;
          s.equip[id] = true;
          if (id !== 'sword') s.hearts += 1; // armor adds a heart, filled
          game.sfx.relic();
          this.toast(`${gr.name} equipped!`, id === 'sword' ? 'sword' : 'heart');
          this.openSmith(game);
          this.refreshHud(game);
        },
      });
    }
    this.goldLine(body, s);
  }

  openShipping(game) {
    const s = game.state;
    const body = this.openMenu('Shipping Box');
    const sellables = Object.keys(ITEMS).filter((k) => (s.inv[k] || 0) > 0);
    if (!sellables.length) {
      const d = document.createElement('p');
      d.className = 'empty';
      d.textContent = 'Nothing to ship yet. Harvest crops, gather berries, catch fish!';
      body.appendChild(d);
    }
    let total = 0;
    for (const k of sellables) {
      const n = s.inv[k];
      const value = ITEMS[k].sell * n;
      total += value;
      this.row(body, {
        icon: ITEMS[k].icon,
        name: `${ITEMS[k].name} × ${n}`,
        desc: `${ITEMS[k].sell}g each${ITEMS[k].gift ? ' · Jay might like this...' : ''}`,
        price: value,
        btn: 'Sell',
        onBuy: () => {
          s.gold += value; s.goldEarned += value;
          s.stats.shipped += n;
          s.inv[k] = 0;
          s.tut.sold = true;
          game.sfx.coin();
          this.openShipping(game);
          this.refreshHud(game);
        },
      });
    }
    if (sellables.length > 1) {
      const all = document.createElement('button');
      all.className = 'sell-all';
      all.innerHTML = `Sell everything <em>${total}g</em>`;
      all.addEventListener('click', () => {
        for (const k of sellables) {
          const n = s.inv[k];
          s.gold += ITEMS[k].sell * n;
          s.goldEarned += ITEMS[k].sell * n;
          s.stats.shipped += n;
          s.inv[k] = 0;
        }
        s.tut.sold = true;
        game.sfx.coin();
        this.openShipping(game);
        this.refreshHud(game);
      });
      body.appendChild(all);
    }
    this.goldLine(body, s);
  }

  openCollection(game) {
    const s = game.state;
    const body = this.openMenu('The Starless Set');
    for (const id of Object.keys(SET_PIECES)) {
      const pc = SET_PIECES[id];
      const owned = s.set[id];
      this.row(body, {
        icon: owned ? 'star' : 'star-empty',
        name: owned ? pc.name : '???',
        desc: owned ? pc.desc : pc.source,
        badge: owned ? 'Found' : null,
      });
    }
    const st = document.createElement('div');
    st.className = 'statline';
    st.textContent = `Day ${s.day} · ${s.stats.harvested} crops harvested · ${s.stats.monsters} monsters bested · high score ${highScore()}g`;
    body.appendChild(st);
  }

  // -------------------------------------------------------------- ending --
  showEnding(game, best) {
    const s = game.state;
    this.menuOpen = true;
    const el = $('#ending');
    el.classList.remove('hidden');
    $('#end-gold').textContent = s.gold + 'g';
    $('#end-best').textContent = best + 'g';
    const tier = jayTier(s.jay.aff);
    const rows = [
      ['Days survived', s.day],
      ['Crops harvested', s.stats.harvested],
      ['Goods shipped', s.stats.shipped],
      ['Chicken pettings', s.stats.petted],
      ['Monsters bested', s.stats.monsters],
      ['Fish caught', s.stats.fish],
      ['Starless pieces', `${setCount(s)} / 5`],
      ['Jay thinks you are...', JAY_TIER_NAMES[tier]],
    ];
    const tbl = $('#end-stats');
    tbl.innerHTML = '';
    for (const [k, v] of rows) {
      const tr = document.createElement('tr');
      const td1 = document.createElement('td'); td1.textContent = k;
      const td2 = document.createElement('td'); td2.textContent = v;
      tr.appendChild(td1); tr.appendChild(td2);
      tbl.appendChild(tr);
    }
    $('#end-jay').textContent = tier >= 3
      ? 'Jay was waiting by the gate. He heard everything. He is very proud, and only a little terrified.'
      : tier >= 1
        ? 'Jay gives you an awkward, delighted wave from the village gate.'
        : 'The village sleeps peacefully, never knowing how close the ruin came.';
    $('#end-continue').onclick = () => {
      el.classList.add('hidden');
      this.menuOpen = false;
      game.mode = 'play';
      game.startFade(() => game.enter('farm', { x: 480, y: 400 }));
      this.toast('The farm is safe. The turnips grow on.', 'turnip');
    };
    $('#end-new').onclick = () => {
      clearSave();
      location.reload();
    };
  }
}
