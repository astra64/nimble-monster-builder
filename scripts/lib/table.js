/**
 * Monster Builder table, Nimble v2 GM Guide p.29.
 * Keep all rules data in this file so corrections are a one-line edit.
 */

// [level, HP none, HP medium, HP heavy, dmg/round, sample dice (d8), 2x attack form, save DC, CR equiv]
export const ROWS = [
  ["1/4", 12, 9, 7, 3, "1d4+1", null, 9, "1/8"],
  ["1/3", 15, 11, 8, 5, "1d6+2", null, 9, "1/4"],
  ["1/2", 18, 15, 11, 7, "1d6+3", null, 10, "1/4"],
  ["1", 26, 20, 16, 11, "2d8+2", "1d8+1", 10, "1/2"],
  ["2", 34, 27, 20, 13, "2d8+4", "1d8+3", 11, "1"],
  ["3", 41, 33, 25, 15, "2d8+6", "1d8+4", 11, "1"],
  ["4", 49, 39, 29, 18, "2d8+9", "1d8+5", 12, "2"],
  ["5", 58, 46, 35, 19, "2d8+10", "1d8+6", 12, "2"],
  ["6", 68, 54, 41, 21, "2d8+12", "1d8+7", 13, "3"],
  ["7", 79, 63, 47, 24, "3d8+10", "2d8+4", 13, "3"],
  ["8", 91, 73, 55, 26, "3d8+12", "2d8+5", 14, "4"],
  ["9", 104, 83, 62, 28, "4d8+10", "2d8+6", 14, "4"],
  ["10", 118, 94, 71, 30, "4d8+12", "2d8+7", 15, "5"],
  ["11", 133, 106, 80, 33, "5d8+11", "3d8+3", 15, "6"],
  ["12", 149, 119, 89, 35, "5d8+13", "3d8+4", 16, "7"],
  ["13", 166, 132, 100, 38, "6d8+11", "3d8+6", 16, "8"],
  ["14", 184, 147, 110, 40, "6d8+13", "3d8+7", 17, "9"],
  ["15", 203, 162, 122, 43, "7d8+11", "3d8+8", 17, "9"],
  ["16", 223, 178, 134, 45, "7d8+13", "4d8+5", 18, "10"],
  ["17", 244, 195, 146, 48, "8d8+12", "4d8+6", 18, "11"],
  ["18", 266, 213, 160, 50, "8d8+14", "4d8+7", 19, "12"],
  ["19", 289, 231, 173, 52, "9d8+12", "4d8+8", 19, "13"],
  ["20", 313, 250, 189, 54, "9d8+13", "4d8+9", 20, "14"],
];

export const ARMOR_COL = { none: 1, medium: 2, heavy: 3 };

// Damage dice offered by the builder. The GMG's thematic guidelines per die live in lang/en.json (NMB.Builder.DieNote).
export const DICE = [4, 6, 8, 10, 12, 20];

// GMG p.26 suggested minion die by party level: [highest party level, die]. The book's ranges share their
// boundary levels (1-3, 3-5, 5-10, ...); a boundary level takes the lower die.
export const MINION_DIE_BY_PARTY_LEVEL = [
  [3, 4],
  [5, 6],
  [10, 8],
  [13, 10],
  [17, 12],
  [20, 20],
];

export const SIZES = ["tiny", "small", "medium", "large", "huge", "gargantuan"];
export const TOKEN_SIZE = { tiny: 0.5, small: 0.5, medium: 1, large: 2, huge: 3, gargantuan: 4 };

// Damage types grouped for the attack card chips. Icons are Font Awesome free solid classes.
export const DAMAGE_TYPE_GROUPS = [
  {
    id: "physical",
    types: [
      { id: "bludgeoning", icon: "fa-hammer" },
      { id: "piercing", icon: "fa-bullseye" },
      { id: "slashing", icon: "fa-khanda" },
    ],
  },
  {
    id: "elemental",
    types: [
      { id: "acid", icon: "fa-flask" },
      { id: "cold", icon: "fa-snowflake" },
      { id: "fire", icon: "fa-fire" },
      { id: "lightning", icon: "fa-bolt" },
      { id: "poison", icon: "fa-skull-crossbones" },
    ],
  },
  {
    id: "other",
    types: [
      { id: "force", icon: "fa-burst" },
      { id: "necrotic", icon: "fa-skull" },
      { id: "psychic", icon: "fa-brain" },
      { id: "radiant", icon: "fa-sun" },
    ],
  },
];

export const DAMAGE_TYPES = DAMAGE_TYPE_GROUPS.flatMap((g) => g.types.map((t) => t.id));

export const MAX_ATTACK_COUNT = 3;

/**
 * Share of an attack's average damage that comes from dice (the rest is the flat bonus), per die size.
 * Our own heuristic, fitted to the GMG bestiary (tests/data/bestiary.js, checked in tests/bestiary.test.js); the
 * book gives no formula. What the bestiary shows: most monsters use one die plus a flat bonus, so smaller dice
 * and multi-attack forms have small shares, while d8 (the book's own sample dice) and d20 are dice-heavy.
 * d8 only uses it where the book gives no sample dice.
 */
export const DIE_DICE_SHARE = { 4: 0.25, 6: 0.3, 8: 0.7, 10: 0.5, 12: 0.3, 20: 0.9 };

/** Most dice an attack of this die size gets. Undead d4 attacks are always one die with a big bonus. */
export const DIE_MAX_DICE = { 4: 1 };

/** A single die whose average exceeds the target by more than this is flagged as overshooting the table. */
export const OVERSHOOT_TOLERANCE = 1.5;
