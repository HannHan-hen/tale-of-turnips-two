# Gameplay Goal

## Definition

*Tale of Turnips* is a cozy, browser-playable farming adventure game. It must remain playable from a clickable browser link, with no install required for players; the current public play link documented by the project is:

<https://hannhan-hen.github.io/tale-of-turnips/>

The game runs entirely in the browser, saves progress in `localStorage`, and has no backend or accounts.

## Game purpose

The purpose of the game is to give players a small, polished, old-Flash-inspired farming-adventure loop: grow and sell crops for gold, gather resources, buy supplies and gear, protect the farm from ruin monsters, collect the five-piece Starless Set, romance a villager and defeat the Ruin Heart in the ruins. Victory shows a results screen, and the player's final gold total is recorded as the high score.

The player starts with 12 turnip seeds, 1 heart and no equipment. Day lasts around one minute, with a quick fadeout into the new day.

## Main gameplay loop

The core loop is:

1. **Farm for income.**
   - Select seeds with number keys.
   - Plant seeds in farm plots.
   - Let time advance while crops grow.
   - Harvest mature crops.
   - Sell sellable goods at the shipping box for gold.

2. **Spend gold to expand options.**
   - Visit the village.
   - Buy radish, turnip and carrot seeds from Marigold's seed shop. Each crop has a different grow time in days: 2, 3, 4, and different price.
   - Buy basic combat gear from Bramble's blacksmith shop. Basic sword needs to be equipped to fight. Basic armor pieces add hearts. Each costs gold.

3. **Do daily and resource chores.**
   - Pet the farm chicken once per day for an egg.
   - Visit the forest and gather berries from bushes regrowing each day.
   - Visit the lake and catch fish from the water.
   
4. **Explore and fight in the ruins.**
   - Enter the ruins from the farm.
   - Clear each room's enemies with attacks.
   - Defeating monsters can drop sellable or giftable loot.
   - Defeating boss enemies reduces threat and unlocks guarded Starless Set cache in boss room two.
   - Rooms deeper into the ruins stay sealed until the current room is cleared. There are 6 rooms in total, one room with normal monsters followed by one room with a boss. Monsters get progressively harder and more numerous.

5. **Manage farm threat.**
   - After the opening grace period of 7 days, ruin threat rises every three days.
   - Defeating a boss lowers threat by one.
   - If threat grows high enough (let's say to three) while the player is on the farm, crop nibblers raid and can eat planted crops. The amount of nibblers grows with threat.

6. **Collect the Starless Set.**
   - Open boss-guarded ruin cache for a set piece in the second boss room.
   - Find hidden set relics as rare drops from qualifying chores after the first boss and gold threshold (one for each chore: farming, petting, harvesting bush, fishing).
   - Pieces grant effects such as extra heart, extra damage, faster movement, extra harvest yield, longer sword reach.

7. **Build optional affection with Jay.**
   - Talk to Jay in the village once per day.
   - Give him loved gifts you occasionally get from monster drops.
   - Affection tiers affect his dialogue and the relationship outcome shown on the ending screen.

8. **Win the run.**
   - Defeat the third boss so the sealed route to the final chamber can be opened.
   - Defeat the Ruin Heart (final boss).
   - View the ending/results screen, which tallies final gold, best-ever high score, days survived, crops harvested, chickens petted, monsters defeated, Starless pieces, and Jay relationship status.
   - Return to the farm after victory with the high score banked.

## Maps

The farm is the home base. It has crop plots, the shipping box, a chicken, and paths to the house, village, forest, and ruins. At the start the crop plot is 3x3, below the farmhouse. The farmhouse is in the upper left corner.

The house is a safe interior with a storage chest.

The village has Marigold's seed shop, Bramble's blacksmith shop, Old Pip's hints, and Jay by the gate.

The forest is a foraging map with berry bushes among the trees.

The lake has simple fishing.

The ruins are a six-room dungeon. Each stone room must be cleared to move deeper. Room two holds the Ruin Warden. Room four holds the Ruin Colossus. Room six holds the Ruin Sentinel. The final room holds the final boss, Ruin Heart.

## NPCs

All NPCs are static on the village map.

Marigold sells seeds.

Bramble sells equipment for combat help.

Old Pip gives simple guidance about farming, shops, Jay, and the ruins.

Jay is the shy village romance character. He is the grandson of Marigold and Bramble, pale, black haired with gray eyes. Talking and gifting can move him from barely knowing the player to being deeply impressed by the player's strange farming-warrior life.

