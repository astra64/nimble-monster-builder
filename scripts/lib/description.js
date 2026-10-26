/** Actor description text. Pure, so it is unit-tested. */
export function buildDescription(r, data) {
  const stats = `<p><strong>Save DC:</strong> ${r.saveDC} &nbsp; <strong>CR equiv.:</strong> ${r.cr}</p>`;

  if (r.mode === "minion") {
    return (
      stats +
      `<p><strong>Minion.</strong> No HP to track: any damage kills it. Attacks with a single damage die, ` +
      `cannot crit, and misses on a roll of 1. When several minions attack one target their damage is combined ` +
      `and counts as a single attack.</p>` +
      `<p><em>Optional overkill: excess damage carries over to other minions in range, using the die size as ` +
      `durability.</em></p>`
    );
  }

  const abilities = Number(data.abilities) || 0;
  return (
    stats +
    `<p><em>Built from the GM Guide Monster Builder table: HP from level ${r.hpLevel}, damage from level ` +
    `${r.dmgLevel}${abilities ? `, ${abilities} special abilit${abilities === 1 ? "y" : "ies"} accounted for` : ""}.` +
    `${r.canCrit ? "" : " Flunky: cannot crit."}</em></p>`
  );
}
