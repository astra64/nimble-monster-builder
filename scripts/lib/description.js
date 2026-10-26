/** Actor and attack description text. Pure, so it is unit-tested. */

export const escapeHtml = (text) =>
  String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Attack item description: the damage formula as text, the multiplier, then the GM's notes. */
export function attackDescription(attack, { minion = false } = {}) {
  const avg = Number.isInteger(attack.avg) ? attack.avg : Number(attack.avg).toFixed(1);
  const parts = [`<p>Deals <strong>${attack.formula}</strong> ${attack.damageType} damage (avg ${avg}).</p>`];
  if (attack.count > 1) parts.push(`<p>Make ${attack.count} attacks, each dealing this damage.</p>`);
  if (minion) parts.push("<p>Follows minion rules.</p>");
  const notes = String(attack.notes ?? "").trim();
  if (notes) parts.push(`<p>${escapeHtml(notes)}</p>`);
  return parts.join("");
}

/** Feature item description for an ability. */
export function abilityDescription(ability) {
  const text = String(ability.text ?? "").trim();
  return text ? `<p>${escapeHtml(text)}</p>` : "";
}

const DEFAULTS = "<p><em>Unless noted: speed 6, attacks have Reach 1, saves roll 1d20.</em></p>";

export function buildDescription(r) {
  const stats = `<p><strong>Save DC:</strong> ${r.saveDC} &nbsp; <strong>CR equiv.:</strong> ${r.cr}</p>`;

  if (r.mode === "minion") {
    return (
      stats +
      `<p><strong>Minion.</strong> No HP to track: any damage kills it. Attacks with a single damage die, ` +
      `cannot crit, and misses on a roll of 1. When several minions attack one target their damage is combined ` +
      `and counts as a single attack.</p>` +
      `<p><em>Optional overkill: excess damage carries over to other minions in range, using the die size as ` +
      `durability.</em></p>` +
      DEFAULTS
    );
  }

  const { hp, damage } = r.abilitySteps;
  const abilities = r.abilities.length;
  const costs = [hp ? `${hp} off HP` : "", damage ? `${damage} off damage` : ""].filter(Boolean).join(", ");
  return (
    stats +
    `<p><em>Built from the GM Guide Monster Builder table: HP from level ${r.hpLevel}, damage from level ` +
    `${r.dmgLevel}${abilities ? `; ${abilities} special abilit${abilities === 1 ? "y" : "ies"}${costs ? ` (${costs} rows)` : ""}` : ""}.` +
    `${r.canCrit ? "" : " Flunky: cannot crit."}</em></p>` +
    DEFAULTS
  );
}
