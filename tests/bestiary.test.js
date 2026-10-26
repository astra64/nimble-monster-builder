import { describe, expect, it } from "vitest";
import { ROWS, damageFormula } from "../scripts/lib/index.js";
import { BESTIARY_ATTACKS } from "./data/bestiary.js";

// Level 21 (Mummy Lord) is past the end of the table.
const inTable = ([, level]) => ROWS.some((r) => r[0] === level);
const base = BESTIARY_ATTACKS.filter((a) => a[6] === "base" && inTable(a));
const diceCount = (formula) => Number(/^(\d+)d/.exec(formula)[1]);

describe("bestiary fit", () => {
  it("has data for every die size", () => {
    for (const die of [4, 6, 8, 10, 12, 20]) {
      expect(BESTIARY_ATTACKS.some((a) => a[4] === die)).toBe(true);
    }
  });

  it("monsters spend about the table's damage per round", () => {
    const ratios = base
      .map(([, level, count, n, die, bonus]) => {
        const row = ROWS.find((r) => r[0] === level);
        return (count * (n * ((die + 1) / 2) + bonus)) / row[4];
      })
      .sort((a, b) => a - b);
    const median = ratios[Math.floor(ratios.length / 2)];
    expect(median).toBeGreaterThan(0.85);
    expect(median).toBeLessThan(1.05);
  });

  it("generated formulas use the book's number of dice for most attacks", () => {
    const hits = base.filter(([, level, count, n, die]) => {
      const row = ROWS.find((r) => r[0] === level);
      return diceCount(damageFormula(row, die, count).formula) === n;
    });
    // 41 of 52 at the time of tuning (the rest are designers choosing a different style: a caster with dice, a
    // brute with a bigger bonus). Fail if a change to the shares makes the fit clearly worse.
    expect(hits.length / base.length).toBeGreaterThan(0.75);
  });

  it("d4 attacks are always a single die", () => {
    for (const [, level, count] of base.filter((a) => a[4] === 4)) {
      const row = ROWS.find((r) => r[0] === level);
      expect(diceCount(damageFormula(row, 4, count).formula)).toBe(1);
    }
    expect(diceCount(damageFormula(ROWS.at(-1), 4, 1).formula)).toBe(1);
  });
});
