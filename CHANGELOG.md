# Changelog

## 0.2.0 (unreleased, untested in Foundry)

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
