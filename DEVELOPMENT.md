# Development notes

Context and decisions for the Nimble Quick Monster Builder, so work can resume in a fresh session.

## Goal

A Foundry VTT v14 module for the Nimble v2 system that builds monster actors quickly from the Monster Builder
table in the Nimble v2 GM Guide (v2.0.3, p.29). The user may publish it to the community.

Source PDF: `C:\Users\Sam\Desktop\rpg\Nimble\Nimble v2 GM Guide 2.0.3.pdf`

## Decisions

- **Compendium of actors rejected.** It would duplicate the table and not cover armor variants (69 actors) or the
  mix-and-match rules. A builder dialog handles all of that, so there is no actor pack.
- **Builder dialog is the main tool.** Pick HP level, damage level, armor, die size, special abilities.
  - HP and damage levels are chosen separately (glass cannons, tanks), per the GM Guide.
  - Each special ability lowers HP or damage by one table row (setting: HP, damage, or alternate).
  - d8 uses the book's sample dice. Other dice are computed to match the table's damage per round
    (`damageFormula` in `scripts/builder.js`). That formula is our own, not from the book.
- **Started as a Script macro, then became a module.** `nimble-monster-builder.macro.js` is the original macro
  and is superseded; safe to delete.
- **Module id.** Renamed from `nimble-monster-templates` to `nimble-monster-builder` before publishing, because
  changing an id after release breaks installs. Folder name must match the id.

## Layout

- `module.json`: Foundry v14, requires system `nimble` >= 0.10.0.
- `scripts/constants.js`: module id, folder name, modes.
- `scripts/lib/`: pure, unit-tested (`npm test`). `table.js` is the rules data (corrections go here), `stats.js` the
  stat resolution (standard, minion, damage formulas, suggested minion die), `description.js` the actor description.
- `scripts/builder.js`: actor creation. **All Nimble schema field names live here.**
- `scripts/apps/MonsterBuilder.js`: the ApplicationV2 window; `templates/monster-builder.hbs`,
  `styles/monster-builder.css`, `lang/en.json` (namespace `NMB.`).
- `scripts/main.js`: sidebar button on the Actors tab (`renderActorDirectory` hook) and `module.api`.

## Nimble system facts (0.10.0)

Found by reading the system bundle at `Data/systems/nimble/nimble-B3dgSwHu.js` (its monster importer builds
actors; search for `toActorData`).

- Actor types: `npc`, `minion`, `soloMonster`. Only `npc` has `details.isFlunky`.
- `system.attributes`: `armor` ("none" | "medium" | "heavy"), `hp {max, value, temp}`, `sizeCategory`,
  `movement`, `damageResistances/Vulnerabilities/Immunities` (arrays).
- `system.details.level` is a **string** (e.g. "1/4", "5"). `details.creatureType` is a string.
- Attacks are `monsterFeature` items with `system.subtype: "action"` and an `activation.effects` damage node:
  `{type: "damage", damageType, formula, canCrit, canMiss, on: {hit: [damageOutcome]}}`.
- There is no actor-level save DC field. Save DC lives on a saving throw effect node, so the builder puts the
  table's save DC and CR in the actor description instead.
- Prototype token in the importer: `displayName: 50`, `disposition: -1`, solo monsters `displayBars: 40`.

## Status

- v0.3.0 (stages 0-3 of the roadmap) written, **not yet tested in Foundry** (no way to run Foundry from the coding
  session). `npm test` passes (20 tests); all scripts pass `node --check`. The ApplicationV2 window, template and
  CSS have never been rendered.
- First thing to do: enable the module in a Nimble world, click **Monster Builder** on the Actors tab, create a
  standard monster and a minion, in both light and dark themes, and report console errors. Things to look at: sidebar button placement, window
  layout, whether a `minion` actor accepts `hp` 1/1 and the `armor` field, whether `isFlunky` behaves.

## UX plan (stage 3 built; attacks list, damage chips and abilities still to build)

Scope: standard monsters (incl. flunkies) and minions. Legendary monsters are a future feature.
GMG text extracted with `pdftotext -layout`; relevant pages are 24-30 (Running Monsters, Fine Tuning, Monster Builder).

Feedback on v0.2.0 and decisions:

- **Dark mode:** text was unreadable because the CSS hardcodes light backgrounds. Use only Foundry theme variables
  and `color-mix` tints, no fixed light colours; check both themes.
- **Header (always visible):** name field with the creature type field directly under it, Standard / Minion
  segmented toggle, and a **stat card** with six stats: Level, HP, Armor (-, M, H), Damage, Save DC, CR Equiv. No
  sub-text. A one-line note under the stats appears only when special abilities lowered the table row (for
  example "Special abilities: HP level 1 -> 1/3"); otherwise it is hidden. Footer holds only Create.
  The Damage stat shows the damage per round from the table (a minion shows its die), not an attack formula,
  because attacks are alternatives that each draw on that budget; the formulas live on the Attacks tab.
- **Tabs by category:** Stats | Attacks | Abilities | Misc.
- **Stats tab:** one **Level** picker with a link / unlink button; unlinked shows separate HP level and damage
  level pickers. (This replaces the Balanced / Glass cannon / Tank role idea.) Armor as radios with the GMG's
  60 / 30 / 10 hint in grey. Size and creature type.
- **Damage die:** a row of radio buttons whose labels are only the die (d4 d6 d8 d10 d12 d20). Small grey text
  under the row shows the GMG's thematic note for the selected die, worded as a suggestion and without the creature
  type (d4 "slow, with BIG bonus damage", d6 "small, chaotic, likely to miss or crit", d8 "balanced and reliable
  attackers", d10 "stronger than humans", d12 "superhumanly strong/accurate", d20 "massive damage"). In Minion mode
  the text also gives the party levels the GMG suggests for that die (d4 1-3, d6 3-5, d8 5-10, d10 10-13, d12 13-17,
  d20 17-20). Stage 4 adds average damage and crit dice to that line. The die is shared by all attacks. Text lives
  in `lang/en.json` (`NMB.Builder.DieNote`).
- **Attacks tab:** an "Add attack" button and a list of collapsible attack cards. Each card: name, damage type,
  melee / ranged (default range 8), multiplier x1 / x2 / x3, notes (for example "On crit: Prone"). **Each attack is
  an alternative**: it gets the full damage per round divided by its multiplier, as in the book's "Stab OR Shoot".
  The generated item description contains the formula as text ("Deals 2d8+2 slashing damage (avg 11).") followed by
  the notes. Minions get one fixed single-die attack (name, type, range only).
- **Damage type:** grouped toggle chips with icons (Physical: bludgeoning, piercing, slashing; Elemental: acid,
  cold, fire, lightning, poison, thunder; Other: force, necrotic, psychic, radiant) instead of a dropdown. The
  collapsed card shows only the chosen type.
- **Abilities tab:** searchable checklist from the GMG list plus a custom entry. **Cost is not automatic**: each
  ticked ability row has its own buttons `HP -1` / `Damage -1` / `Free`; the stat card applies the sum. No default
  cost is preselected, and the stat card flags abilities that have no choice yet. Minions: abilities are added as
  feature items and cost nothing (no HP), so the buttons are hidden.
- **Misc tab:** Flunky toggle, "open sheet after creating" (default on), later folder, speed, free description.
- **Create** closes the window. Optional: Shift-click keeps it open for batches (tooltip).

Possible later: encounter budget helper (total monster level vs party total level: <50% easy, ~75% medium,
100% hard, 100-125% deadly, 150%+ very deadly; 1-4 monsters per hero, minions excluded).

## Die size and average damage (research)

Goal: the GM picks a die size and sees the average damage, which stays at the table's damage per round for every
die. The GMG gives no formula beyond "any die size is fine as long as overall damage per round stays consistent",
so this is inferred from the bestiary (pp.31-60, `pdftotext` extract).

Bestiary patterns (per-attack damage vs the table's damage per round, divided by the number of attacks):
- Total damage per round tracks the table within about 20%, whatever the die.
- **Smaller dice use fewer dice and a bigger flat bonus.** d4 (undead): Ghoul L1 `1d4+8`, Ogre Zombie L5 2×`1d4+8`,
  Wraith L10 2×`1d4+10`, Great Worm L16 `1d4+40`. Always 1 die. d6: Gray Ooze L1 2×`1d6+2`, Hill Giant L12
  2×`1d6+15`. d10: Gnoll L1 2×`1d10` (no bonus). d12: Greater Stirge L6 `1d12+10`, Bulette `1d12+20`.
  d20 (mimic bite): `1d20`, `2d20`.
- This is the design logic: crits add dice, so the number of dice is the swinginess. d4 = steady and slow, d20 =
  swingy ("massive damage").
- Attack counts go (2×) from level 1 and (3×) at about level 4+ (Bandit Captain 3× `1d8+1`, Gnoll Packleader 3×).
- Typical ranges: Range 8 for thrown/shot, 12 for bows, 6 for webs/spit. The builder currently uses 6.

Proposed rule ("dice share"): for each die size, a share of the per-attack average damage comes from dice, the
remainder from the flat bonus.
`dice = max(1, round(share × target / avgDie))`, `bonus = max(0, round(target − dice × avgDie))`.

| die | d4 | d6 | d8 | d10 | d12 | d20 |
|---|---|---|---|---|---|---|
| share | ~25% | ~35% | the book's d8 column as is | ~55% | ~60% | ~70% |

Checks: Ghoul L1 gives `1d4+8` (exact); Gray Ooze 2× gives `1d6+2` (exact); Gnoll 2× gives `1d10` (exact); Ogre
Zombie 2× gives `1d4+7` (book `1d4+8`). The Hill Giant gives `2d6+10` (book `1d6+15`), so shares are a default,
not a law. The shares are tunable in `table.js`.

Known gap in the current formula (`damageFormula`, 50% dice share for every die): when one die's average exceeds
the target (d12 or d20 at the lowest rows) the result overshoots the table. Stage 4 should handle this, for
example by capping and flagging it in the UI.

UI: show `avg X.X (table Y)` plus "crit adds N dice" next to the die picker. The average is of the formula as
built (flat-bonus rounding can drift by 0.5), against the table target.

Alternatives considered: (a) keep the d8 dice count and flatten with the bonus (breaks for d20, which overshoots
the target, and for d4 at high levels); (b) a Steady-to-Swingy slider replacing fixed shares (more control, more UI).
Recommendation: dice share, with the slider as a later option.

## UI conventions (from nimble-options-filter, module-setup-tools, swade-character-manager)

- **App class:** `ApplicationV2` + `HandlebarsApplicationMixin` (not `DialogV2.prompt`), `static DEFAULT_OPTIONS`
  with `id`, `classes: ["nmb-app"]`, `window: { title (i18n key), icon, resizable }`, `actions: {...}` for
  `data-action` buttons, `static PARTS` for the template. Context in `_prepareContext`, DOM wiring in `_onRender`
  (live preview updates the DOM without re-rendering).
- **Files:** `scripts/apps/`, `scripts/lib/` (pure functions, unit-tested with vitest), `scripts/constants.js`,
  `scripts/settings.js`, `templates/*.hbs`, `styles/*.css`, `lang/en.json` (namespace `NMB.`), `tests/`. Repo files:
  `CHANGELOG.md`, `DEVELOPMENT.md`, `LICENSE` (not yet: licensing unconfirmed), `README.md`, `.gitignore`,
  `package.json` with `vitest`; the other modules are git repos (`github.com/astra64/<id>`).
- **Layout:** `.window-content` with zero padding, a flex column root: chips header, tab strip, scrolling panel,
  sticky footer with status text on the left and the primary action on the right. Searchable lists with a
  "selected only" toggle (for the abilities list). Collapsible sections via `<details>` for Advanced.
- **Style:** prefix classes `nmb-`. Foundry variables with fallbacks (`--color-border-light-primary`,
  `--color-cool-2/-3`, `--color-text-dark-primary`, `--font-size-11/12/14`), accent `#7a9928` via `--nmb-accent`,
  panel/footer background `#d6d2c8`, `color-mix(in srgb, ...)` for tints, 999px pill chips, warn colour `#c48b2b`.
- **Entry point:** a sidebar button added in a `render...` hook. Ours stays on the Actors directory header.

## Roadmap

Do not start a stage until told. Each stage ends with something testable in Foundry.

0. **Housekeeping.** DONE: `DEVELOPMENT.md`, git init, `.gitignore`, `package.json` + vitest, `lang/en.json`,
   `constants.js`, maths moved to `scripts/lib/` with unit tests, macro deleted. Not done: first commit (no
   commit made yet), `LICENSE`.
1. **Minion mode fix + Standard/Minion switch.** DONE (v0.2.0, untested in Foundry): no HP for minions (stored as
   1/1), single die, no crit, level default 1/4, flunky toggle.
2. **ApplicationV2 shell.** DONE (v0.2.0, first look only; see the UX plan for the rework).
3. **UI rework (house style, dark mode).** DONE (untested in Foundry). Theme-safe CSS; header with name, mode toggle and the stat card; tabs
   Stats / Attacks / Abilities / Misc (Abilities holds a temporary counter that lowers HP one row per ability; the cost-target select was removed); linked level with unlink; armor
   radios; die radio row (die value only) with grey suggestion text under it (party levels too in Minion mode,
   replacing the party-level field); Misc tab (flunky, open sheet); Create closes the window. No
   new rules. Uses the existing single attack.
4. **Attacks and die size.** Attack list with add / remove, collapsible cards, damage type chips, melee / ranged
   (default range 8), x1 / x2 / x3, notes, generated descriptions with the formula. Dice-share formula in `lib/`
   (see research below), tested against bestiary examples; a grey line under the die row shows average vs table and
   crit dice.
5. **Abilities.** `abilities.js` with the GMG list (~45 names and descriptions, p.30), searchable checklist,
   custom entry, each adds a `monsterFeature` item; per-ability cost buttons (`HP -1` / `Damage -1` / `Free`),
   uncosted abilities flagged on the stat card. State the defaults (speed 6, reach 1, d20 saves) in the description.
6. **Presets.** Save and load archetypes in world settings, export and import as JSON.
7. **Settings and rebuild.** Default die, default folder; rebuild an existing actor from the table.
8. **Publish prep.** Licensing check (Nimble third-party licence), `module.json` TODOs, README, CHANGELOG,
   manifest URL, id availability.
9. **Future.** Legendary monsters; encounter budget helper.
10. **Future: D&D 5e stat block import.** Paste a 5e stat block (plain text) and get an approximately converted
    Nimble monster, pre-filled into the builder for the GM to review before creating. Rough shape, to be researched
    when it is scheduled:
    - Parse name, size, creature type, AC, HP, speed, CR, attacks (to-hit, damage dice) and notable traits from
      common stat block layouts (SRD / D&D Beyond copy-paste).
    - Map to the table: CR to the nearest level row (the table's CR column gives a start), AC to none / medium /
      heavy armor, HP and damage per round to HP and damage level (5e numbers will not match, so pick the nearest
      row and show the GM the difference), multiattack to the x2 / x3 attack count.
    - Traits and actions become ability checklist entries or custom abilities (stage 5), each with a chosen cost;
      legendary actions wait for the legendary builder.
    - Always an approximation: show the parsed values and the chosen mapping before creating, and keep the original
      text in the actor description.
    - Depends on stages 4-5 (attacks and die size, abilities).

## Known issues / risks

- The sidebar button selectors (`.header-actions`, `.directory-header`) may need adjusting for v14 markup.
- Nimble schema field names are undocumented; a system update could break actor creation (fix in `builder.js`).
- Minions are stored with 1/1 HP (Nimble's minion actor may ignore HP entirely; verify in Foundry).
- Attack is a single attack; the "(2×)" form is only noted in the item description.

## Before publishing

- **Licensing:** the table is copyrighted GM Guide content. Check Nimble's third-party creator license for what
  may be redistributed and the required attribution. Not yet confirmed.
- Fill the `TODO` fields in `module.json` (author, url, manifest, download, license) and the README.
- The manifest URL must be a stable link to the latest `module.json`.
- Check the module id is not already taken on Foundry's package list.
