// Shared palette, sampled from the concept painting: warm golden-hour olives,
// terracotta roofs, cream plaster, mauve ruin stone. Keep every asset inside
// this family so the whole game reads as one illustration.

export const P = {
  // meadow
  grassLight: '#a8a352',
  grassMid: '#8f8c3e',
  grassDark: '#6f7030',
  grassDeep: '#585c28',
  pathLight: '#cfb273',
  path: '#b2945c',

  // soil / wood
  soilLight: '#7c5a38',
  soil: '#62452a',
  soilDark: '#4b3520',
  woodLight: '#a97a48',
  wood: '#8c5e34',
  woodDark: '#6b4526',
  woodDeep: '#4f3119',

  // cottage
  plaster: '#f0dfb4',
  plasterShade: '#d9c393',
  beam: '#7a522e',
  roofLight: '#c08049',
  roof: '#a8662f',
  roofDark: '#82491f',
  stone: '#b9ac8d',
  stoneDark: '#94886c',

  // foliage
  leafLight: '#a8a945',
  leaf: '#7f8636',
  leafDark: '#5d662b',
  leafDeep: '#46511f',
  pineLight: '#6e7d35',
  pine: '#55652c',
  pineDark: '#3f4f22',

  // sky / light / fog
  fog: '#f4ead0',
  gold: '#ffd98a',
  glow: '#ffe9b3',

  // water
  waterLight: '#7fa687',
  water: '#5c8a72',
  waterDark: '#41705e',

  // ruins
  ruinLight: '#9b8fa0',
  ruin: '#7b7083',
  ruinDark: '#5c5366',
  ruinDeep: '#403a4d',
  rune: '#b9f0e0',

  // characters
  skin: '#f6d7b2',
  skinShade: '#e3b98e',
  blush: '#f0a98c',
  hairBlonde: '#e8b34f',
  hairBlondeDark: '#c08f33',

  // ui-ish accents
  turnip: '#ece4f2',
  turnipPurple: '#9b6fb5',
  radish: '#d85f6a',
  carrot: '#e08236',
  berry: '#b54a6e',
  heart: '#e2566a',
  coin: '#f2c14e',
  outline: '#4a3b2a',
};

// Slight transparent ink for soft outlines, so shapes feel hand-inked
// without harsh black borders.
export const INK = 'rgba(58,44,30,';
