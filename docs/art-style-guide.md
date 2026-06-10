# Art style rules — technical basics for matching this project's look

This project has **no image assets**. Every visual — grass, trees, bushes,
buildings, characters, UI icons — is vector code drawn with the Canvas 2D
API in `src/art.js`, `src/props.js`, `src/sprites.js`, `src/maps.js`. If a
new session is producing "uglier" art, it's almost always because one or
more of these conventions got skipped. Treat this as a checklist.

## 1. Stay inside the shared palette

All color comes from `P` in `src/palette.js` (plus `INK =
'rgba(58,44,30,...)'` for outlines). Don't invent new hex colors ad hoc —
pick from `P`, or if a new tone is genuinely needed, add it to `P` in the
same family (warm olive/terracotta/cream/mauve, "golden-hour" concept
painting). Foliage specifically should stay within the `leaf*` / `pine*` /
`grass*` groups so new plants don't clash with existing ones.

## 2. Never use a flat `fillStyle = color` for a big shape

Big shapes (trunks, bodies, walls, ground, water, rocks) get a **gradient**,
via the helpers in `art.js`:

- `vgrad(g, y0, y1, c0, c1)` — vertical linear gradient
- `lingrad(g, x0, y0, x1, y1, stops)` — arbitrary linear gradient, `stops`
  is `[[t, color], ...]`
- `radgrad(g, x, y, r, stops)` — radial gradient

A flat fill reads as cheap/plasticky in this style; a 2-stop gradient from
a lighter to a darker version of the same hue is the minimum bar.

## 3. Every grounded object gets a soft contact shadow

Call `shadow(g, x, y, rx, ry, alpha)` **before** drawing the object itself,
at its base/feet point. It's a squashed radial gradient from
`rgba(48,52,24,alpha)` to transparent. Typical alpha is 0.18–0.3. Without
this, objects look like they're floating.

## 4. Outline filled shapes with `ink()`, not solid strokes

After filling a shape, call `ink(g, width, alpha)` (default `width=1.4,
alpha=0.35`) — it strokes with `INK` (a translucent warm brown), never pure
black. This gives the "soft hand-inked line" look. Typical widths: 1.2–2.4.

## 5. Build volume with layered, offset, multi-tone shapes — not single-tone fills + a highlight

The signature technique (see `canopy()` for foliage, but the pattern repeats
for pine fronds, rocks, roofs, etc.):

1. Draw the **darkest** tone shape(s), often nudged slightly *down/right*
   (shadowed underside).
2. Draw a **mid** tone version, slightly smaller and nudged *up/left*.
3. Draw a **light** tone version, only over the *upper* portion, smaller
   still, nudged further *up/left* (sunlit crown).
4. Optionally scatter tiny translucent highlight specks
   (`rgba(255,240,190,0.3)`-ish) across the top for dappled light.

Each tone is a flat fill of overlapping primitives (ellipses mostly) — the
*layering and offsetting* creates the gradient/volume illusion, not the
fills themselves.

## 6. Use rounded shapes: `rr()` and `ell()`, quadratic curves for organic edges

- `rr(g, x, y, w, h, r)` — rounded rect, `r` can be one number or
  `[tl, tr, br, bl]` for asymmetric corners (used constantly for soft
  building/box/sign shapes).
- `ell(g, x, y, rx, ry)` — ellipse path (used for almost everything organic:
  leaves, rocks, fruit, eyes, petals).
- For organic silhouettes (tree trunks, pine fronds, roofs, animals), use
  `g.quadraticCurveTo` with control points pulled outward — straight lines
  read as "programmer art" in this style.

## 7. Deterministic seeded randomness — never `Math.random()` for art

Use `rng(seed)` from `src/util.js` (mulberry32) for any "random" variation:
lobe shapes, scatter positions, color picks (`pick(rand, arr)`), tuft
angles, etc. Pass a stable seed (often derived from position/index/map id).
This keeps re-renders, caching, and the screenshot test tool
(`tools/shot.mjs`) pixel-stable. `Math.random()` would make cached layers
flicker/regenerate differently each load.

## 8. Anchor objects at their "feet" (baseline), origin at (0,0)

Drawing functions take `(g, x, y, ...)`, then `g.save() / g.translate(x, y)
/ ... / g.restore()`, and draw everything relative to `(0,0)` being the
*bottom-center / ground-contact point* of the object — not its visual
center, not its top-left. This is what makes Y-based depth sorting work
(see #10) and matches how shadows are drawn (also at `(0,0)`).

Use `g.scale(s, s)` for a uniform size parameter, and `g.rotate(...)` /
`g.translate` for facing/lean variants — don't hand-recompute every
coordinate for size variants.

## 9. Texture via dense scatter passes, not single big shapes

Ground/meadow texture (`meadowTexture()`) is built from several *layers* of
small repeated elements at different scales/opacities:

1. Big soft low-alpha radial "tonal patches" (color variation)
2. Mid-size repeated strokes/shapes (grass tufts via `tuft()`)
3. Small accent shapes (flowers via `flower()`)
4. Tiny dots (pebbles, speckles)

Each pass uses a different seeded RNG draw, low opacity, and a count scaled
by a `density` parameter. This layering of "big soft → small crisp" is what
makes flat ground feel alive. A single texture pass (e.g. just dots) looks
sparse/flat by comparison.

## 10. Composition rules in `maps.js` / `render.js`

- **World is 960×720 logical pixels** (`VIEW_W`/`VIEW_H` in `maps.js`).
  Canvas is created at `VIEW_W * dpr` / `VIEW_H * dpr` and `ctx.scale(dpr,
  dpr)` is applied — always draw in logical coordinates, never multiply by
  dpr yourself.
- Each prop is `{ x, y, ext: {l, r, t, b}, draw(g) }` — `ext` is the
  bounding box extents *from the anchor point* (left/right/top/bottom), used
  to size the offscreen cache canvas. Get `ext` right or the prop will be
  clipped.
- **Depth sorting is just sorting by `y`** (the anchor/feet point).
  Anything drawn must have its anchor at the correct ground-contact Y for
  this to look right relative to the player and other props.
- Static art (ground, atmosphere, props) is **pre-rendered once to offscreen
  canvases and cached** (`Renderer` in `render.js`) — only dynamic entities
  (player, animals, monsters) are redrawn every frame. New static decoration
  should go through `buildProps()`, not be drawn per-frame.

## 11. Atmosphere/lighting is a separate overlay, applied last

Don't bake lighting into individual sprites. Per-map mood comes from
`paintAtmosphere()` (golden wash, light shafts, edge fog, corner vignette)
painted as a top layer, plus `Renderer.daylight()` (a full-screen tint based
on time of day) applied after everything else. New scenes should rely on
these existing overlays rather than tinting individual assets.

## 12. Characters: chibi proportions, anchored at feet, side/down/up facings

`sprites.js` characters are short/wide ("chibi"), built from the same
`rr`/`ell`/gradient/ink primitives, anchored at the feet, with a `facing`
param (`'down'|'up'|'left'|'right'`) handled via `flip = facing === 'left'
? -1 : 1` and conditionally hiding/repositioning far-side limbs for side
views. Eyes/blush/simple curve-mouths follow the same palette (`P.skin`,
`P.blush`, bright green `#4e9a4e` eyes).

## Quick checklist for new art

- [ ] Colors only from `P` (or new additions in the same family)
- [ ] Big shapes use gradients (`vgrad`/`lingrad`/`radgrad`), not flat fills
- [ ] `shadow()` under every grounded object
- [ ] `ink()` outline after filling
- [ ] Volume via layered offset multi-tone shapes (dark→mid→light, shifted)
- [ ] Rounded/curved shapes (`rr`, `ell`, quadratic curves) over rectangles/lines
- [ ] All "randomness" via seeded `rng(seed)`, not `Math.random()`
- [ ] Anchored at `(0,0)` = feet/ground point, drawn via save/translate/scale
- [ ] Texture = multiple layered scatter passes at different scales/alphas
- [ ] New static decoration added via `buildProps()` with correct `ext`
- [ ] No per-sprite lighting — rely on `paintAtmosphere`/`daylight` overlays
