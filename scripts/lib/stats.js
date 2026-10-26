/**
 * Pure stat resolution from the Monster Builder table. No Foundry globals, so it is unit-tested.
 */
import {
  ROWS,
  ARMOR_COL,
  DIE_DICE_SHARE,
  DIE_MAX_DICE,
  MAX_ATTACK_COUNT,
  MINION_DIE_BY_PARTY_LEVEL,
  OVERSHOOT_TOLERANCE,
} from "./table.js";

const clamp = (i) => Math.min(Math.max(i, 0), ROWS.length - 1);

/** Average of a dice formula such as "2d8+4" or "1d6". Returns null when it cannot be parsed. */
export function averageOf(formula) {
  const m = /^(\d+)d(\d+)(?:\+(\d+))?$/.exec(String(formula).trim());
  if (!m) return null;
  return Number(m[1]) * ((Number(m[2]) + 1) / 2) + Number(m[3] ?? 0);
}

const clampCount = (n) => Math.min(Math.max(Math.round(Number(n)) || 1, 1), MAX_ATTACK_COUNT);

/**
 * Damage for one attack. Each attack is an alternative that uses the row's full damage per round divided by
 * its multiplier ("(2×)" = two attacks per action), so the target per attack is damage / count.
 * d8 uses the book's sample dice (single, and the "(2×)" column) where the book gives them; everything else
 * splits the target between dice and flat bonus with DIE_DICE_SHARE.
 * Returns the formula, its average, the per-attack target, where the dice came from, and whether one die
 * already exceeds the target (very low rows with big dice).
 */
export function damageFormula(row, die, count = 1) {
  die = Number(die);
  count = clampCount(count);
  const target = row[4] / count;
  const book = die === 8 ? (count === 1 ? row[5] : count === 2 ? row[6] : null) : null;
  let formula = book;
  if (!formula) {
    const avg = (die + 1) / 2;
    const n = Math.min(
      DIE_MAX_DICE[die] ?? Infinity,
      Math.max(1, Math.round((DIE_DICE_SHARE[die] * target) / avg)),
    );
    // Round the bonus half down so a .5 tie lands just under the table rather than over it.
    const bonus = Math.max(0, Math.ceil(target - n * avg - 0.5));
    formula = `${n}d${die}${bonus ? `+${bonus}` : ""}`;
  }
  const average = averageOf(formula);
  return {
    formula,
    avg: average,
    target,
    die,
    count,
    source: book ? "book" : "computed",
    overshoot: average - target > OVERSHOOT_TOLERANCE,
  };
}

/** Suggested minion die for a party level (GMG p.26). Boundary levels take the lower die. */
export function minionDieForPartyLevel(level) {
  const lvl = Math.min(Math.max(Number(level) || 1, 1), 20);
  return MINION_DIE_BY_PARTY_LEVEL.find(([max]) => lvl <= max)[1];
}

/** Party levels the GMG suggests a minion die for, e.g. "1-3" for d4. Null for a die the GMG does not list. */
export function partyLevelRange(die) {
  const i = MINION_DIE_BY_PARTY_LEVEL.findIndex(([, d]) => d === Number(die));
  if (i < 0) return null;
  return `${i === 0 ? 1 : MINION_DIE_BY_PARTY_LEVEL[i - 1][0]}-${MINION_DIE_BY_PARTY_LEVEL[i][0]}`;
}

const DEFAULT_ATTACK = { name: "Attack", damageType: "slashing", attackType: "melee", count: 1, notes: "" };

/** Standard monster: apply the "special ability" penalty (1 step per ability) and look up the table. */
export function resolveStandard({ hpLevel, dmgLevel, armor, die, abilities, abilityTo, attacks, flunky }) {
  let hpIdx = Number(hpLevel);
  let dmgIdx = Number(dmgLevel);
  const n = Number(abilities) || 0;
  if (abilityTo === "hp") hpIdx -= n;
  else if (abilityTo === "damage") dmgIdx -= n;
  else {
    hpIdx -= Math.ceil(n / 2);
    dmgIdx -= Math.floor(n / 2);
  }
  const hpRow = ROWS[clamp(hpIdx)];
  const dmgRow = ROWS[clamp(dmgIdx)];
  const list = attacks?.length ? attacks : [DEFAULT_ATTACK];
  return {
    mode: "standard",
    hp: hpRow[ARMOR_COL[armor]],
    hpLevel: hpRow[0],
    dmgLevel: dmgRow[0],
    dmgPerRound: dmgRow[4],
    attacks: list.map((a) => ({ ...DEFAULT_ATTACK, ...a, ...damageFormula(dmgRow, a.die ?? die, a.count) })),
    saveDC: dmgRow[7],
    cr: hpRow[8],
    canCrit: !flunky,
    shifted: clamp(hpIdx) !== Number(hpLevel) || clamp(dmgIdx) !== Number(dmgLevel),
  };
}

/**
 * Minion (GMG p.24): no HP, one damage die, cannot crit, misses on a 1. Level only sets the displayed level,
 * save DC and CR equivalent. A minion has a single attack.
 */
export function resolveMinion({ minionLevel, die, attacks }) {
  const row = ROWS[clamp(Number(minionLevel))];
  const minionDie = Number(attacks?.[0]?.die ?? die);
  const formula = `1d${minionDie}`;
  return {
    mode: "minion",
    hp: null,
    hpLevel: row[0],
    dmgLevel: row[0],
    dmgPerRound: null,
    attacks: [
      {
        ...DEFAULT_ATTACK,
        ...attacks?.[0],
        count: 1,
        die: minionDie,
        formula,
        avg: averageOf(formula),
        target: null,
        source: "minion",
        overshoot: false,
      },
    ],
    saveDC: row[7],
    cr: row[8],
    canCrit: false,
    shifted: false,
  };
}

export function resolve(data) {
  return data.mode === "minion" ? resolveMinion(data) : resolveStandard(data);
}
