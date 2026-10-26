# Nimble Quick Monster Builder

Build Nimble v2 monsters in seconds. Pick a level, armor and damage die, and the module creates a Nimble actor with the right HP and a ready-to-roll attack, using the Monster Builder table from the Nimble v2 GM Guide.

## Usage

Open the **Actors** sidebar tab and click **Monster Builder**, or run
`game.modules.get("nimble-monster-builder").api.open()` from a macro.

- **Standard** monsters: HP and damage can come from different levels, so you can make glass cannons and tanks.
  Tick **Flunky** (under the Standard / Minion toggle) for a monster that cannot crit. Use the link button to set HP and damage levels
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

Unofficial module. Not affiliated with or endorsed by Nimble Co.

This module is free to use for anyone who already owns the content, is trying the system out, or cannot afford to buy it right now. If you enjoy Nimble and are able, please support the game by purchasing the official content at [nimbleRPG.com](https://nimblerpg.com).

Nimble Quick Monster Builder is an independent product published under the Nimble 3rd Party Creator License. Nimble © Nimble Co.

## License

The code in this module is released under the [MIT License](LICENSE). Nimble content is used under the Nimble 3rd Party Creator License; the Nimble art and logo are not included.
