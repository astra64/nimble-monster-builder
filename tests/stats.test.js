import { describe, expect, it } from "vitest";
import {
  ARMOR_COL,
  ROWS,
  averageOf,
  buildDescription,
  damageFormula,
  minionDieForPartyLevel,
  partyLevelRange,
  resolve,
  resolveMinion,
  resolveStandard,
} from "../scripts/lib/index.js";

const base = { hpLevel: 3, dmgLevel: 3, armor: "none", die: "8", abilities: 0, abilityTo: "hp" };

describe("table", () => {
  it("has 23 rows of 9 columns", () => {
    expect(ROWS).toHaveLength(23);
    for (const r of ROWS) expect(r).toHaveLength(9);
  });
  it("HP falls with armor and rises with level", () => {
    ROWS.forEach((r, i) => {
      expect(r[1]).toBeGreaterThan(r[2]);
      expect(r[2]).toBeGreaterThan(r[3]);
      if (i) expect(r[1]).toBeGreaterThan(ROWS[i - 1][1]);
    });
  });
  it("sample dice average is within 1 of the damage column", () => {
    for (const r of ROWS) expect(Math.abs(averageOf(r[5]) - r[4])).toBeLessThanOrEqual(1);
  });
  it("(2×) dice give about the same damage per round", () => {
    for (const r of ROWS.filter((r) => r[6])) expect(Math.abs(averageOf(r[6]) * 2 - r[4])).toBeLessThanOrEqual(2.5);
  });
});

describe("averageOf", () => {
  it("parses dice with and without bonus", () => {
    expect(averageOf("2d8+4")).toBe(13);
    expect(averageOf("1d6")).toBe(3.5);
    expect(averageOf("nope")).toBeNull();
  });
});

describe("damageFormula", () => {
  it("uses the book's sample dice for d8", () => {
    expect(damageFormula(ROWS[3], 8).formula).toBe("2d8+2");
    expect(damageFormula(ROWS[3], 8, true)).toMatchObject({ formula: "1d8+1", twice: true });
  });
  it("falls back to a single attack when a row has no (2×) form", () => {
    expect(damageFormula(ROWS[0], 8, true)).toMatchObject({ formula: "1d4+1", twice: false });
  });
  // Stage 3 replaces this formula; until then a single die can overshoot a very small target.
  it("keeps the average near the table for other dice unless one die already exceeds it", () => {
    for (const die of [4, 6, 10, 12, 20]) {
      for (const row of ROWS.filter((r) => (die + 1) / 2 <= r[4])) {
        const { formula } = damageFormula(row, die);
        expect(Math.abs(averageOf(formula) - row[4])).toBeLessThanOrEqual(1.5);
      }
    }
  });
});

describe("minionDieForPartyLevel", () => {
  it("follows the GMG table, boundary levels taking the lower die", () => {
    expect(minionDieForPartyLevel(1)).toBe(4);
    expect(minionDieForPartyLevel(3)).toBe(4);
    expect(minionDieForPartyLevel(4)).toBe(6);
    expect(minionDieForPartyLevel(10)).toBe(8);
    expect(minionDieForPartyLevel(11)).toBe(10);
    expect(minionDieForPartyLevel(17)).toBe(12);
    expect(minionDieForPartyLevel(20)).toBe(20);
  });
  it("clamps out-of-range input", () => {
    expect(minionDieForPartyLevel(0)).toBe(4);
    expect(minionDieForPartyLevel(99)).toBe(20);
    expect(minionDieForPartyLevel("")).toBe(4);
  });
});

describe("partyLevelRange", () => {
  it("gives the GMG party level range for each die", () => {
    expect(partyLevelRange(4)).toBe("1-3");
    expect(partyLevelRange("6")).toBe("3-5");
    expect(partyLevelRange(8)).toBe("5-10");
    expect(partyLevelRange(20)).toBe("17-20");
  });
  it("is null for a die the GMG does not list", () => {
    expect(partyLevelRange(3)).toBeNull();
  });
});

describe("resolveStandard", () => {
  it("reads HP from the armor column", () => {
    for (const armor of Object.keys(ARMOR_COL)) {
      expect(resolveStandard({ ...base, armor }).hp).toBe(ROWS[3][ARMOR_COL[armor]]);
    }
  });
  it("lowers HP per ability by default target", () => {
    const r = resolveStandard({ ...base, abilities: 2 });
    expect(r.hpLevel).toBe(ROWS[1][0]);
    expect(r.dmgLevel).toBe(ROWS[3][0]);
    expect(r.shifted).toBe(true);
  });
  it("lowers damage when asked", () => {
    const r = resolveStandard({ ...base, abilities: 1, abilityTo: "damage" });
    expect(r.hpLevel).toBe(ROWS[3][0]);
    expect(r.dmgLevel).toBe(ROWS[2][0]);
  });
  it("alternates HP and damage", () => {
    const r = resolveStandard({ ...base, abilities: 3, abilityTo: "split" });
    expect(r.hpLevel).toBe(ROWS[1][0]);
    expect(r.dmgLevel).toBe(ROWS[2][0]);
  });
  it("clamps at the table edges without reporting a shift for in-range picks", () => {
    expect(resolveStandard({ ...base, hpLevel: 0, abilities: 5 }).hpLevel).toBe("1/4");
    expect(resolveStandard(base).shifted).toBe(false);
  });
  it("flunkies cannot crit", () => {
    expect(resolveStandard({ ...base, flunky: true }).canCrit).toBe(false);
    expect(resolveStandard(base).canCrit).toBe(true);
  });
});

describe("resolveMinion", () => {
  it("has no HP, one die, and cannot crit", () => {
    expect(resolveMinion({ minionLevel: 0, die: "6" })).toMatchObject({
      mode: "minion",
      hp: null,
      formula: "1d6",
      canCrit: false,
      hpLevel: "1/4",
    });
  });
  it("resolve dispatches on mode", () => {
    expect(resolve({ mode: "minion", minionLevel: 0, die: 4 }).mode).toBe("minion");
    expect(resolve({ ...base, mode: "standard" }).mode).toBe("standard");
  });
});

describe("buildDescription", () => {
  it("states minion rules", () => {
    const text = buildDescription(resolveMinion({ minionLevel: 0, die: 4 }), {});
    expect(text).toContain("No HP to track");
    expect(text).toContain("Save DC");
  });
  it("mentions abilities and flunkies for standard monsters", () => {
    const data = { ...base, abilities: 1, flunky: true };
    const text = buildDescription(resolveStandard(data), data);
    expect(text).toContain("1 special ability");
    expect(text).toContain("Flunky");
  });
});
