# How the grass, trees & bushes are made

Everything green in the game is procedural vector art drawn with the
Canvas 2D API — there are no image assets. This doc walks through the
techniques that make the foliage feel hand-painted rather than
programmer-art. The relevant code lives mostly in `src/art.js`
(painters), `src/palette.js` (colors), `src/maps.js` (placement/ground)
and `src/render.js` (caching/compositing).

## 1. A shared, narrow palette

`src/palette.js` defines one palette `P` for the whole game, sampled
from the original concept painting. Foliage uses just a handful of
related olive/moss tones:

```js
leafLight: '#a8a945', leaf: '#7f8636', leafDark: '#5d662b', leafDeep: '#46511f',
pineLight: '#6e7d35', pine: '#55652c', pineDark: '#3f4f22',
grassLight / grassMid / grassDark / grassDeep
```

Because every plant is built from 3–4 tones drawn from the same family
(plus a shared `INK = 'rgba(58,44,30,...)'` for outlines), trees, bushes
and grass automatically read as part of one illustration instead of
clashing assets.

## 2. The core trick: `canopy()` — overlapping lobes, three tones, speckles

Almost all foliage (trees, bushes, hedges) is built on one function,
`canopy(g, x, y, r, seed, tones)` in `src/art.js`:

1. **Lobed silhouette** — generate 6–8 random-sized "lobe" circles
   arranged around a center point (plus one big center lobe), using a
   seeded RNG so the shape is irregular but stable.
2. **Three-pass shading** — paint the lobes three times in different
   tones and offsets to fake volumetric lighting with flat fills:
   - Pass 1 (`leafDeep`): full lobes, shifted slightly *down*, forming
     the shadowed underside.
   - Pass 2 (`leaf`): slightly smaller lobes shifted *up-left*, the
     mid-tone body.
   - Pass 3 (`leafLight`): only the top lobes, much smaller and shifted
     further up-left — the "sunlit crown".
3. **Speckled highlights** — a scatter of tiny translucent
   `rgba(255,240,190,0.30)` ellipses across the canopy simulate dappled
   sunlight glinting off individual leaves.

This single function, called with different radii/seeds/tone sets,
becomes a tree canopy, a bush, or a hedge — no separate "bush sprite"
exists.

## 3. Trees and bushes built from the same parts

- `blobTree(g, x, y, s, seed)` — soft contact shadow, a curved trunk
  (quadratic-curve silhouette in `woodDark`), then `canopy()` on top.
  ~50% of trees also get a scatter of tiny pink/yellow dots for
  blossoms or fruit.
- `pine(g, x, y, s, seed)` — instead of `canopy()`, draws 4 layered
  drooping "frond" shapes (quadratic curves) from base to tip, each
  layer rendered in dark → mid → light pine tones so the cone reads as
  lit from above.
- `bush(g, x, y, s, seed, tones)` — literally just a shadow + a smaller
  `canopy()`, optionally passed alternate tone sets (e.g.
  `[leafDeep, leaf, leafLight]` vs. defaults) for visual variety between
  bushes.
- `rock(g, ...)` — not foliage, but shares the same shadow + ink-outline
  + moss-patch language so rocks sit naturally among the plants.

All of these draw a `shadow()` first: a radial gradient ellipse
(squashed flat) that fades from a translucent olive-brown to nothing,
giving every object contact with the ground.

## 4. Grass: tufts, flowers, and the `meadowTexture` scatter pass

Ground-level "grass" isn't individual blades rendered everywhere —
it's a layered scatter system, `meadowTexture(g, w, h, seed, density)`,
called once per map to bake texture into the ground layer:

1. **Tonal patches** — ~26 large soft radial gradients (light olive or
   dark olive, very low alpha) scattered across the field, giving the
   meadow uneven, cloud-like color variation instead of a flat fill.
2. **Tufts** — ~130 calls to `tuft()`, which strokes 3 short curved
   blades fanning outward from a point in translucent green, each one
   tiny (4–8px) and randomly toned light or dark.
3. **Tiny flowers** — ~36 calls to `flower()`, which draws 5 small
   petal ellipses around a point plus a yellow center dot, in one of 4
   pastel colors.
4. **Pebbles** — ~18 small translucent ellipses for ground texture.

Everything is driven by a deterministic seeded RNG (see below), so the
"random" meadow looks identical every time it's rendered/cached.

## 5. Deterministic seeded randomness

`src/util.js` implements `rng(seed)`, a small mulberry32 PRNG. Every
scattered/varied element — canopy lobe shapes, meadow tufts/flowers,
border trees, rock silhouettes — is generated from a seed derived from
its position/index. This means:

- The "hand-painted" randomness is reproducible across frames, reloads,
  and the headless screenshot tool (`tools/shot.mjs`).
- Pre-rendered layers (see below) can be cached safely — re-painting
  always produces pixel-identical output.

## 6. Color gradients instead of flat fills

Almost nothing is a flat `fillStyle = color`. `art.js` provides
`vgrad`, `lingrad`, and `radgrad` helpers wrapping Canvas gradients,
used everywhere — tree trunks, rock faces, the meadow base, fog. This
is what gives shapes a soft, painterly volume rather than a flat-shaded
look.

## 7. Atmosphere & light on top of everything

`paintAtmosphere(g, w, h, seed, strength)` is painted as a final
overlay per map:

- A warm golden radial wash from the upper-left (the "sun" direction).
- A few very soft diagonal light-shaft gradients.
- ~30 soft fog blobs hugging the screen edges, plus stronger glows in
  the four corners (a vignette).

`Renderer.daylight()` (in `render.js`) layers a full-screen tint on top
of *that*, shifting from warm dawn gold through clear noon to amber
dusk and finally a cool blue evening shade based on the in-game time of
day — so the same trees and grass look different in the morning vs. at
dusk without redrawing any geometry.

## 8. Placement: scattering flora across a map

`src/maps.js` builds each map's prop list using small factory helpers:

```js
const tree   = (x, y, s, seed) => p(x, y, ext, (g) => blobTree(g, 0, 0, s, seed));
const pineP  = (x, y, s, seed) => p(x, y, ext, (g) => pine(g, 0, 0, s, seed));
const bushP  = (x, y, s, seed, tones) => p(x, y, ext, (g) => bush(g, 0, 0, s, seed, tones));
```

Most maps hand-place a few "hero" trees/bushes near buildings/paths,
then call `borderFlora(seed, w, h, gaps, density)` to scatter dozens
more pines/trees/rocks/bushes around the screen edges (skipping
rectangular "gaps" reserved for exits/doors), each with randomized size
and a roll that biases toward pines (~42%), then trees, then rocks,
then bushes.

## 9. Rendering pipeline: pre-render once, composite per frame

`src/render.js`'s `Renderer` does the heavy lifting once and caches it:

- **Ground layer** (`paintGround`, including `meadowTexture`) is
  rendered once to an offscreen canvas at device-pixel-ratio and cached
  per map.
- **Atmosphere layer** (fog/vignette/lighting) is also pre-rendered and
  cached per map.
- **Static props** (every tree/bush/rock/building) are each rendered
  once to their own small offscreen canvas, sized exactly to their
  bounding box (`ext: {l, r, t, b}` = left/right/top/bottom extents from
  the anchor point).

Each frame then just composites: draw the cached ground → depth-sort
and `drawImage` the cached prop bitmaps together with dynamic entities
(player, animals) by their Y position (so things lower on screen draw
in front) → draw the cached atmosphere on top → apply the daylight
tint. This keeps the per-frame cost cheap even though each tree's
canopy involves dozens of gradient-filled ellipses.

## Summary

The "pretty" look comes from a small set of compounding tricks applied
consistently:

1. A tiny shared color palette so nothing clashes.
2. Multi-tone overlapping-ellipse "lobe" shading (`canopy`) standing in
   for painted volume/light, reused for every plant type.
3. Soft contact shadows and ink outlines on every object.
4. Dense, layered, seeded-random scatter (tonal patches → tufts →
   flowers → pebbles → speckle highlights) for ground texture.
5. Gradients everywhere instead of flat color.
6. A global fog/vignette + time-of-day tint layered over the whole
   scene.
7. Pre-rendering/caching so this richness doesn't cost anything at
   runtime.
