import { describe, expect, it } from "vitest";
import {
  ARMOR_COL,
  DICE,
  ROWS,
  attackDescription,
  averageOf,
  buildDescription,
  escapeHtml,
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
    expect(damageFormula(ROWS[3], 8)).toMatchObject({ formula: "2d8+2", source: "book", count: 1 });
    expect(damageFormula(ROWS[3], 8, 2)).toMatchObject({ formula: "1d8+1", source: "book", count: 2 });
  });
  it("computes d8 where the book has no sample dice", () => {
    expect(damageFormula(ROWS[0], 8, 2).source).toBe("computed");
    expect(damageFormula(ROWS[5], 8, 3).source).toBe("computed");
  });
  it("matches bestiary examples", () => {
    expect(damageFormula(ROWS[3], 4).formula).toBe("1d4+8"); // Ghoul, level 1
    expect(damageFormula(ROWS[3], 6, 2).formula).toBe("1d6+2"); // Gray Ooze, level 1 (2×)
    expect(damageFormula(ROWS[3], 10, 2).formula).toBe("1d10"); // Gnoll, level 1 (2×)
    expect(damageFormula(ROWS[6], 8, 3).formula).toBe("1d8+1"); // Bandit Captain, level 4 (3×)
  });
  it("clamps the attack count to 1-3", () => {
    expect(damageFormula(ROWS[3], 6, 0).count).toBe(1);
    expect(damageFormula(ROWS[3], 6, 9).count).toBe(3);
    expect(damageFormula(ROWS[3], 6, "2").count).toBe(2);
  });
  it("lands within half a point of the target unless one die already exceeds it", () => {
    for (const die of DICE) {
      for (const row of ROWS) {
        for (const count of [1, 2, 3]) {
          const r = damageFormula(row, die, count);
          if (r.source === "book") continue;
          expect(r.avg).toBeGreaterThanOrEqual(r.target - 0.5);
          if (!r.overshoot) expect(r.avg).toBeLessThanOrEqual(r.target + 1.5);
          if (/\+\d/.test(r.formula)) expect(Math.abs(r.avg - r.target)).toBeLessThanOrEqual(0.5);
        }
      }
    }
  });
  it("flags a single die that exceeds the target", () => {
    expect(damageFormula(ROWS[0], 20).overshoot).toBe(true);
    expect(damageFormula(ROWS[3], 8).overshoot).toBe(false);
  });
  it("book dice never overshoot", () => {
    for (const row of ROWS) {
      expect(damageFormula(row, 8).overshoot).toBe(false);
      if (row[6]) expect(damageFormula(row, 8, 2).overshoot).toBe(false);
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
  it("resolves each attack as an alternative using the full damage per round", () => {
    const r = resolveStandard({
      ...base,
      attacks: [
        { name: "Stab", count: 1 },
        { name: "Shoot", count: 2, attackType: "range" },
      ],
    });
    expect(r.attacks.map((a) => a.formula)).toEqual(["2d8+2", "1d8+1"]);
    expect(r.attacks[1]).toMatchObject({ name: "Shoot", attackType: "range", damageType: "slashing" });
  });
  it("lets each attack use its own die", () => {
    const r = resolveStandard({
      ...base,
      attacks: [{ name: "Bite", die: 4 }, { name: "Slam", die: 12 }, { name: "Default" }],
    });
    expect(r.attacks.map((a) => a.die)).toEqual([4, 12, 8]);
    expect(r.attacks[0].formula).toBe("1d4+8");
    expect(r.attacks[2].formula).toBe("2d8+2");
  });
  it("defaults to one attack", () => {
    expect(resolveStandard(base).attacks).toHaveLength(1);
  });
  it("flunkies cannot crit", () => {
    expect(resolveStandard({ ...base, flunky: true }).canCrit).toBe(false);
    expect(resolveStandard(base).canCrit).toBe(true);
  });
});

describe("resolveMinion", () => {
  it("has no HP, one die, and cannot crit", () => {
    const r = resolveMinion({ minionLevel: 0, die: "6" });
    expect(r).toMatchObject({ mode: "minion", hp: null, canCrit: false, hpLevel: "1/4" });
    expect(r.attacks).toHaveLength(1);
    expect(r.attacks[0]).toMatchObject({ formula: "1d6", avg: 3.5, count: 1 });
  });
  it("uses the first attack's die", () => {
    expect(resolveMinion({ minionLevel: 0, die: 8, attacks: [{ die: 4 }] }).attacks[0].formula).toBe("1d4");
  });
  it("keeps only the first attack and ignores its multiplier", () => {
    const r = resolveMinion({ minionLevel: 0, die: 4, attacks: [{ name: "Stab", count: 3 }, { name: "Other" }] });
    expect(r.attacks).toHaveLength(1);
    expect(r.attacks[0]).toMatchObject({ name: "Stab", count: 1 });
  });
  it("resolve dispatches on mode", () => {
    expect(resolve({ mode: "minion", minionLevel: 0, die: 4 }).mode).toBe("minion");
    expect(resolve({ ...base, mode: "standard" }).mode).toBe("standard");
  });
});

describe("attackDescription", () => {
  it("states the formula, type and average", () => {
    const text = attackDescription({ formula: "2d8+2", damageType: "fire", avg: 11, count: 1, notes: "" });
    expect(text).toContain("<strong>2d8+2</strong> fire damage (avg 11)");
  });
  it("rounds a fractional average to one decimal", () => {
    expect(attackDescription({ formula: "1d6", damageType: "fire", avg: 3.5, count: 1 })).toContain("avg 3.5");
  });
  it("adds the multiplier, minion rule and escaped notes", () => {
    const text = attackDescription(
      { formula: "1d8+1", damageType: "slashing", avg: 5.5, count: 2, notes: "On crit: <b>Prone</b>" },
      { minion: true },
    );
    expect(text).toContain("Make 2 attacks");
    expect(text).toContain("Follows minion rules");
    expect(text).toContain("On crit: &lt;b&gt;Prone&lt;/b&gt;");
  });
});

describe("escapeHtml", () => {
  it("escapes markup characters", () => {
    expect(escapeHtml(`<a href="x">&</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;");
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
