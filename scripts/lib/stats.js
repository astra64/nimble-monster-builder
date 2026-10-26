/**
 * Pure stat resolution from the Monster Builder table. No Foundry globals, so it is unit-tested.
 */
import { ROWS, ARMOR_COL, MINION_DIE_BY_PARTY_LEVEL } from "./table.js";

const clamp = (i) => Math.min(Math.max(i, 0), ROWS.length - 1);

/** Average of a dice formula such as "2d8+4" or "1d6". Returns null when it cannot be parsed. */
export function averageOf(formula) {
  const m = /^(\d+)d(\d+)(?:\+(\d+))?$/.exec(String(formula).trim());
  if (!m) return null;
  return Number(m[1]) * ((Number(m[2]) + 1) / 2) + Number(m[3] ?? 0);
}

/** Damage formula for a damage row and die size. d8 uses the book's sample dice. */
export function damageFormula(row, die, twice = false) {
  if (die === 8) {
    if (twice && row[6]) return { formula: row[6], alt: `Single attack: ${row[5]}`, twice: true };
    return { formula: row[5], alt: row[6] ? `(2×) ${row[6]}` : null, twice: false };
  }
  const target = twice ? row[4] / 2 : row[4];
  const avg = (die + 1) / 2;
  const n = Math.max(1, Math.round((target * 0.5) / avg));
  const bonus = Math.max(0, Math.round(target - n * avg));
  return { formula: `${n}d${die}${bonus ? `+${bonus}` : ""}`, alt: null, twice };
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

/** Standard monster: apply the "special ability" penalty (1 step per ability) and look up the table. */
export function resolveStandard({ hpLevel, dmgLevel, armor, die, abilities, abilityTo, twoAttacks, flunky }) {
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
  const { formula, alt, twice } = damageFormula(dmgRow, Number(die), !!twoAttacks);
  return {
    mode: "standard",
    twice,
    hp: hpRow[ARMOR_COL[armor]],
    hpLevel: hpRow[0],
    dmgLevel: dmgRow[0],
    dmgPerRound: dmgRow[4],
    formula,
    alt,
    saveDC: dmgRow[7],
    cr: hpRow[8],
    canCrit: !flunky,
    shifted: clamp(hpIdx) !== Number(hpLevel) || clamp(dmgIdx) !== Number(dmgLevel),
  };
}

/**
 * Minion (GMG p.24): no HP, one damage die, cannot crit, misses on a 1. Level only sets the displayed level,
 * save DC and CR equivalent.
 */
export function resolveMinion({ minionLevel, die }) {
  const row = ROWS[clamp(Number(minionLevel))];
  return {
    mode: "minion",
    twice: false,
    hp: null,
    hpLevel: row[0],
    dmgLevel: row[0],
    dmgPerRound: null,
    formula: `1d${Number(die)}`,
    alt: null,
    saveDC: row[7],
    cr: row[8],
    canCrit: false,
    shifted: false,
  };
}

export function resolve(data) {
  return data.mode === "minion" ? resolveMinion(data) : resolveStandard(data);
}
