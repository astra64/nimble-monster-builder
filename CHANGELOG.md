# Changelog

## 0.4.0 (unreleased, untested in Foundry)

- Multiple attacks: add and remove attack cards (name, attacks per action x1 / x2 / x3, damage type, melee or
  ranged, notes). Each attack is an alternative balanced against the full damage per round. Minions keep a single
  attack. Replaces the "Two attacks (2x)" checkbox.
- Damage die is chosen per attack, inside each attack card.
- Damage types are grouped icon chips instead of a dropdown, with the group label above its chips.
- Fixed the attack card arrow (it rendered as a broken glyph). The attack card summary now shows the average
  damage and the separate formula line is gone.
- Attacks are named after their damage type ("Fire Attack") until you rename them. The stat card's damage stat
  is labelled "Avg Dmg" (a minion shows its die's average).
- Damage type chips are coloured per type (icon always, whole chip when selected) with more space between groups.
  Attacks per action and range share one line. The card summary reads "formula, type, avg".
- Layout: the active panel scrolls, the footer stays pinned, and attack card spacing is looser.
- Attack item descriptions state the damage formula, the multiplier and your notes.
- New damage formula for non-d8 dice (and d8 where the book has no sample dice): the average stays at the table
  value, with smaller dice using fewer dice and a bigger flat bonus. Each attack card shows average against the
  table and warns when one die already exceeds it.
- Ranged attacks default to range 8.
- Dice shares re-tuned against every standard monster in the GM Guide bestiary (new `tests/data/bestiary.js`):
  d4 is always one die with a big flat bonus, d6 and d12 lean on the flat bonus, d8 and d20 are dice-heavy.
  Matches the book's dice count for 79% of attacks (was 63%).

## 0.3.0

- UI rework: theme-safe styling (readable in dark mode), a header with the name, Standard / Minion toggle and a
  stat card (HP, damage, Save DC, CR), and Stats / Attacks / Abilities / Misc tabs.
- HP and damage share one level by default; a link button sets them separately.
- Armor and damage die are radio rows. Grey text under the die row shows the GM Guide's thematic suggestion for the
  selected die (and the suggested party levels for minions); the minion party-level field is gone.
- Stat card shows Level, HP, Armor, Damage, Save DC and CR Equiv.; a note appears only when special abilities
  lowered HP. Creature type sits under the name.
- Removed the "ability cost lowers" select; special abilities lower HP until the abilities tab arrives.
- Create closes the window (Shift-click keeps it open). Flunky and "open sheet" moved to Misc.

## 0.2.0

- Standard / Minion modes. Minions follow the GMG rules: no HP, a single damage die, cannot crit, misses on a 1.
  Optional party level suggests the minion die.
- Flunky toggle for standard monsters (`isFlunky`, attacks cannot crit).
- "Two attacks (2×)" option.
- Builder is now an `ApplicationV2` window in the house style (chips header, mode tabs, sticky footer) instead of a
  `DialogV2` prompt. The window stays open after creating a monster.
- Removed the actor-type picker (solo monsters return with the legendary builder).
- Project housekeeping: git, vitest unit tests for the table and stat maths, `lang/en.json`.

## 0.1.0

- First version: sidebar button and builder dialog.
