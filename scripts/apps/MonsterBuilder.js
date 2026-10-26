/** The builder window (ApplicationV2). */
import { MODES, MODULE_ID } from "../constants.js";
import { createMonster } from "../builder.js";
import { DAMAGE_TYPES, DIE_HINTS, ROWS, SIZES, averageOf, minionDieForPartyLevel, resolve } from "../lib/index.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const MODE_LABELS = {
  standard: "NMB.Builder.Modes.Standard",
  minion: "NMB.Builder.Modes.Minion",
};

const ARMORS = [
  { value: "none", label: "NMB.Builder.Armor.None" },
  { value: "medium", label: "NMB.Builder.Armor.Medium" },
  { value: "heavy", label: "NMB.Builder.Armor.Heavy" },
];

const DEFAULT_STANDARD_LEVEL = 3; // table index of level 1
const DEFAULT_MINION_LEVEL = 0; // table index of level 1/4

export class MonsterBuilder extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "nmb-builder",
    classes: ["nmb-app"],
    tag: "div",
    window: { title: "NMB.Builder.Title", icon: "fa-solid fa-dragon", resizable: false },
    position: { width: 480 },
    actions: {
      switchMode: MonsterBuilder.#onSwitchMode,
      create: MonsterBuilder.#onCreate,
    },
  };

  static PARTS = {
    main: { template: `modules/${MODULE_ID}/templates/monster-builder.hbs` },
  };

  mode = MODES[0];

  /** Open the builder, or bring the existing window forward. */
  static open() {
    const existing = foundry.applications.instances.get(MonsterBuilder.DEFAULT_OPTIONS.id);
    if (existing) return existing.bringToFront();
    return new MonsterBuilder().render({ force: true });
  }

  async _prepareContext() {
    return {
      mode: this.mode,
      modes: MODES.map((id) => ({ id, label: MODE_LABELS[id], active: id === this.mode })),
      defaultName: game.i18n.localize("NMB.Builder.DefaultName"),
      levels: ROWS.map((r, i) => ({
        value: i,
        label: game.i18n.format("NMB.Builder.Level", { level: r[0] }),
        selectedStandard: i === DEFAULT_STANDARD_LEVEL,
        selectedMinion: i === DEFAULT_MINION_LEVEL,
      })),
      sizes: SIZES.map((s) => ({ value: s, label: s, selected: s === "medium" })),
      armors: ARMORS,
      dice: Object.entries(DIE_HINTS).map(([die, hint]) => ({
        value: die,
        label: `d${die} - ${hint}`,
        selected: die === "8",
      })),
      damageTypes: DAMAGE_TYPES,
    };
  }

  _onRender() {
    const form = this.element.querySelector("form");
    // Enter inside a text field would otherwise submit (and reload) the page.
    form.addEventListener("submit", (event) => event.preventDefault());
    form.addEventListener("input", () => this.#refresh());
    form.addEventListener("change", () => this.#refresh());
    form.elements.partyLevel.addEventListener("change", () => this.#applySuggestedDie());
    this.#refresh();
  }

  #read() {
    const form = this.element.querySelector("form");
    const data = Object.fromEntries(new FormData(form).entries());
    data.mode = this.mode;
    data.twoAttacks = form.elements.twoAttacks.checked;
    data.flunky = form.elements.flunky.checked;
    return data;
  }

  /** Setting a party level picks the GMG's suggested minion die; the GM can still change it afterwards. */
  #applySuggestedDie() {
    const form = this.element.querySelector("form");
    const party = Number(form.elements.partyLevel.value);
    if (!party) return;
    form.elements.die.value = String(minionDieForPartyLevel(party));
    this.#refresh();
  }

  /** Update chips and the footer summary from the form without re-rendering. */
  #refresh() {
    const el = this.element;
    const data = this.#read();
    const r = resolve(data);

    el.querySelector('[data-chip="hp"]').textContent = r.hp ?? "-";
    const avg = averageOf(r.formula);
    el.querySelector('[data-chip="damage"]').textContent =
      `${r.twice ? "2× " : ""}${r.formula}${avg ? ` (avg ${avg})` : ""}`;
    el.querySelector('[data-chip="saveDC"]').textContent = r.saveDC;
    el.querySelector('[data-chip="cr"]').textContent = r.cr;

    const parts =
      r.mode === "minion"
        ? [game.i18n.format("NMB.Builder.Summary.Minion", { level: r.hpLevel })]
        : [
            game.i18n.format("NMB.Builder.Summary.Standard", {
              hp: r.hpLevel,
              dmg: r.dmgLevel,
              dpr: r.dmgPerRound,
            }),
            r.shifted ? game.i18n.localize("NMB.Builder.Summary.Adjusted") : "",
          ];
    const party = Number(data.partyLevel);
    if (r.mode === "minion" && party) {
      parts.push(
        game.i18n.format("NMB.Builder.Summary.SuggestedDie", { party, die: minionDieForPartyLevel(party) }),
      );
    }
    el.querySelector("[data-summary]").textContent = parts.filter(Boolean).join(" ");
  }

  static #onSwitchMode(event, target) {
    this.mode = target.dataset.mode;
    const el = this.element;
    el.querySelector("form").dataset.mode = this.mode;
    for (const tab of el.querySelectorAll(".nmb-tab")) tab.classList.toggle("active", tab === target);
    this.#refresh();
  }

  static async #onCreate(event, target) {
    const data = this.#read();
    data.name = data.name?.trim() || game.i18n.localize("NMB.Builder.DefaultName");
    target.disabled = true;
    try {
      const actor = await createMonster(data);
      ui.notifications.info(game.i18n.format("NMB.Builder.Created", { name: actor.name }));
      if (this.element.querySelector('[name="openSheet"]').checked) actor.sheet.render(true);
    } finally {
      target.disabled = false;
    }
  }
}
