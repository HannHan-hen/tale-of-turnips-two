// Keyboard + touch input. Exposes axis(), plus edge-triggered action queries.

export class Input {
  constructor() {
    this.down = new Set();
    this.pressed = new Set();
    this.anyKey = false;
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.down.add(e.code);
      this.pressed.add(e.code);
      this.anyKey = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => this.down.clear());
    // touch buttons populate these
    this.touch = { x: 0, y: 0, interact: false, attack: false };
  }

  axis() {
    let x = 0, y = 0;
    if (this.down.has('ArrowLeft') || this.down.has('KeyA')) x -= 1;
    if (this.down.has('ArrowRight') || this.down.has('KeyD')) x += 1;
    if (this.down.has('ArrowUp') || this.down.has('KeyW')) y -= 1;
    if (this.down.has('ArrowDown') || this.down.has('KeyS')) y += 1;
    x += this.touch.x; y += this.touch.y;
    const m = Math.hypot(x, y);
    return m > 1 ? { x: x / m, y: y / m } : { x, y };
  }

  // edge-triggered: true once per press
  hit(code) {
    if (this.pressed.has(code)) { this.pressed.delete(code); return true; }
    return false;
  }

  interact() {
    if (this.touch.interact) { this.touch.interact = false; return true; }
    return this.hit('KeyE') || this.hit('Enter');
  }

  attack() {
    if (this.touch.attack) { this.touch.attack = false; return true; }
    return this.hit('Space') || this.hit('KeyJ');
  }

  consumeAny() {
    const any = this.anyKey || this.touch.interact || this.touch.attack;
    this.anyKey = false;
    this.touch.interact = false; this.touch.attack = false;
    this.pressed.clear();
    return any;
  }

  endFrame() {
    this.pressed.clear();
  }
}
