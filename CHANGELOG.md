# Changelog

## 0.3.0 (unreleased, untested in Foundry)

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
