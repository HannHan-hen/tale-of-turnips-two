// NPC dialogue. Lines are picked by game condition; Jay's depend on
// affection tier.

import { GRACE_DAYS } from './state.js';

export function jayTier(aff) {
  if (aff >= 15) return 4; // smitten
  if (aff >= 10) return 3; // close
  if (aff >= 6) return 2;  // friend
  if (aff >= 3) return 1;  // curious
  return 0;                // stranger
}

export const JAY_TIER_NAMES = ['a stranger', 'curious', 'a friend', 'close', 'smitten'];

const JAY_TALK = [
  [ // stranger
    "Oh— um. Hello. I'm Jay. I... like standing here. By the gate.",
    "Grandma Marigold says I should talk to people more. So. Hi.",
    "You're the new farmer? The one by the old ruins? That's... brave.",
  ],
  [ // curious
    "You came to talk to me again? That's... nice. Unexpected, but nice.",
    "I heard turnips scream when you pull them. That's not true. I checked.",
    "Grandpa Bramble says you bought a sword. Please don't lose any arms.",
  ],
  [ // friend
    "I saved you a spot in the shade. Not that I was waiting. Okay, I was waiting.",
    "Sometimes I hear the ruins humming at night. When you're in there... be careful, okay?",
    "You smell like soil and sunshine. That's— I meant that in a good way!",
  ],
  [ // close
    "I told Old Pip about you. He laughed and called me 'smitten'. Absurd. Anyway, hi.",
    "I made you a flower crown but a chicken ate it. Long story. The chicken seemed happy.",
    "When you defeat that... heart-thing, come tell me first? Before anyone else?",
  ],
  [ // smitten
    "Every day you stomp out of those ruins covered in dust and I think: that's MY terrifying farmer.",
    "Marigold keeps winking at me when you buy seeds. The whole village knows. I don't even mind.",
    "Stay safe down there. There's a turnip stew with your name on it when you're done.",
  ],
];

const JAY_GIFT = {
  amber: "Ruin amber? It's so warm... like a tiny sunset. I'll keep it forever. Um. Thank you.",
  feather: "A starlit feather!? They say these only fall where monsters dream... It's beautiful. YOU'RE— it. It's beautiful.",
};

export function jayLine(s, rng01) {
  const tier = jayTier(s.jay.aff);
  const lines = JAY_TALK[tier];
  return lines[Math.floor(rng01 * lines.length) % lines.length];
}

export function jayGiftLine(item) {
  return JAY_GIFT[item] || "For me? That's... thank you.";
}

export function pipLine(s) {
  const hints = [];
  if (!s.tut.sold) hints.push("New roots take gold to grow. Plant those turnips, then ship 'em in the box by your gate.");
  if (!s.equip.sword) hints.push("Bramble's iron is dear, but don't go near them ruins bare-handed, child.");
  if (s.day <= GRACE_DAYS) hints.push(`The ruins sleep for now... around day ${GRACE_DAYS + 1} they'll start stirring. Be ready.`);
  else if (!s.bosses[1]) hints.push("The deeper rooms stay sealed till you clear the one before. Wardens guard every second hall.");
  if (s.bosses[1] && !s.cacheOpened) hints.push("Folk say a cache of Starless treasure sits behind the second warden. And more pieces hide in honest chores, for those the ruins respect.");
  if (s.threat >= 2) hints.push("Threat's rising — I can smell it. Thump a boss to calm the ground, or nibblers will be at your crops.");
  if (s.jay.aff > 0 && s.jay.aff < 10) hints.push("Young Jay asks about you, you know. Boy likes shiny things from the deep, if you're inclined.");
  if (!hints.length) hints.push("Sun's warm, turnips are fat, and you're winning. Old Pip approves.");
  return hints[s.pipHint % hints.length];
}

export const MARIGOLD_HELLO = "Welcome, dear! Seeds fresh from the capital. The carrots gossip, ignore them.";
export const BRAMBLE_HELLO = "Hmph. Farmer wants steel? Good. Ruins don't fear pitchforks.";
