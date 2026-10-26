# Nimble Quick Monster Builder

Build Nimble v2 monsters in seconds. Pick a level, armor and damage die, and the module creates a Nimble
actor with the right HP and a ready-to-roll attack, using the Monster Builder table from the Nimble v2 GM Guide.

## Usage

Open the **Actors** sidebar tab and click **Monster Builder**, or run
`game.modules.get("nimble-monster-builder").api.open()` from a macro.

- **Standard** monsters: HP and damage can come from different levels, so you can make glass cannons and tanks.
  Tick **Flunky** (Misc tab) for a monster that cannot crit. Use the link button to set HP and damage levels
  separately.
- **Minion** monsters follow the GM Guide rules: no HP, one damage die, cannot crit. Pick the die; the hint
  under it shows the GM Guide's suggested party levels.
- Add abilities from the GM Guide's list (or your own). For each one choose a cost: one table row off HP, one off
  damage, or free, as the GM Guide suggests.
- Add several attacks; each is an alternative that uses the full damage per round, split by its x1 / x2 / x3 multiplier.
- d8 uses the book's sample dice. Other dice are computed to match the table's damage per round.

## Requirements

Foundry VTT v14 and the Nimble system (0.10.0 or later).

## Disclaimer

Unofficial fan-made module. Not affiliated with or endorsed by the creators of Nimble or the Nimble system for
Foundry VTT.

TODO before publishing: confirm the Nimble third-party content license permits redistributing the table values,
add the required attribution here, and choose a license for this module's code.
