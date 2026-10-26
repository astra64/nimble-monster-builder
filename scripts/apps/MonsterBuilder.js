/** The builder window (ApplicationV2). */
import { MODES, MODULE_ID } from "../constants.js";
import { createMonster } from "../builder.js";
import { DAMAGE_TYPES, DICE, ROWS, SIZES, partyLevelRange, resolve } from "../lib/index.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const TABS = ["stats", "attacks", "abilities", "misc"];

const MODE_LABELS = {
  standard: "NMB.Builder.Modes.Standard",
  minion: "NMB.Builder.Modes.Minion",
};

const ARMORS = [
  { value: "none", label: "NMB.Builder.Armor.None" },
  { value: "medium", label: "NMB.Builder.Armor.Medium" },
  { value: "heavy", label: "NMB.Builder.Armor.Heavy" },
];

// Table index each mode starts at: level 1 for standard monsters, level 1/4 for minions.
const DEFAULT_LEVEL = { standard: 3, minion: 0 };

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export class MonsterBuilder extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "nmb-builder",
    classes: ["nmb-app"],
    tag: "div",
    window: { title: "NMB.Builder.Title", icon: "fa-solid fa-dragon", resizable: false },
    position: { width: 500 },
    actions: {
      switchMode: MonsterBuilder.#onSwitchMode,
      switchTab: MonsterBuilder.#onSwitchTab,
      toggleLink: MonsterBuilder.#onToggleLink,
      create: MonsterBuilder.#onCreate,
    },
  };

  static PARTS = {
    main: { template: `modules/${MODULE_ID}/templates/monster-builder.hbs` },
  };

  mode = MODES[0];
  tab = TABS[0];
  linked = true;
  /** Level (table index) remembered per mode while the GM switches between them. */
  levels = { ...DEFAULT_LEVEL };

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
      tabs: TABS.map((id) => ({
        id,
        label: `NMB.Builder.Tabs.${capitalize(id)}`,
        active: id === this.tab,
      })),
      defaultName: game.i18n.localize("NMB.Builder.DefaultName"),
      levels: ROWS.map((r, i) => ({
        value: i,
        label: game.i18n.format("NMB.Builder.Level", { level: r[0] }),
        selectedStandard: i === DEFAULT_LEVEL.standard,
      })),
      sizes: SIZES.map((s) => ({ value: s, label: s, selected: s === "medium" })),
      armors: ARMORS.map((a) => ({ ...a, checked: a.value === "none" })),
      dice: DICE.map((die) => ({ value: die, label: `d${die}`, checked: die === 8 })),
      damageTypes: DAMAGE_TYPES,
    };
  }

  _onRender() {
    const form = this.#form;
    // Enter inside a text field would otherwise submit (and reload) the page.
    form.addEventListener("submit", (event) => event.preventDefault());
    form.addEventListener("input", () => this.#refresh());
    form.addEventListener("change", () => this.#refresh());
    this.#syncLinked();
    this.#refresh();
  }

  get #form() {
    return this.element.querySelector("form");
  }

  /** Form values as the stat functions expect them. */
  #read() {
    const form = this.#form;
    const data = Object.fromEntries(new FormData(form).entries());
    const separate = this.mode === "standard" && !this.linked;
    data.mode = this.mode;
    data.hpLevel = separate ? data.hpLevel : data.level;
    data.dmgLevel = separate ? data.dmgLevel : data.level;
    data.minionLevel = data.level;
    data.abilityTo = "hp"; // until the abilities tab lets each ability choose its cost
    data.twoAttacks = form.elements.twoAttacks.checked;
    data.flunky = form.elements.flunky.checked;
    data.openSheet = form.elements.openSheet.checked;
    return data;
  }

  /** Show the single level picker, or the separate HP and damage pickers, and update the link button. */
  #syncLinked() {
    const form = this.#form;
    form.dataset.linked = String(this.linked);
    const button = form.querySelector(".nmb-link");
    button.setAttribute("aria-pressed", String(this.linked));
    button.querySelector("i").className = `fa-solid ${this.linked ? "fa-link" : "fa-link-slash"}`;
  }

  /** Update the stat card, the abilities note and the die hint from the form without re-rendering. */
  #refresh() {
    const el = this.element;
    const data = this.#read();
    const r = resolve(data);
    const i18n = game.i18n;
    const set = (name, text) => (el.querySelector(`[data-stat="${name}"]`).textContent = text);

    const minion = r.mode === "minion";
    set("level", r.hpLevel);
    set("hp", r.hp ?? "-");
    set("armor", minion ? "-" : i18n.localize(`NMB.Builder.ArmorLetter.${data.armor}`));
    // Standard: damage per round. Attacks are alternatives that each use this budget (see stage 4).
    set("damage", minion ? r.formula : r.dmgPerRound);
    set("saveDC", r.saveDC);
    set("cr", r.cr);

    // The note only appears when special abilities moved HP to a lower table row.
    const note = el.querySelector("[data-summary]");
    const baseHp = ROWS[Number(data.hpLevel)]?.[0];
    note.hidden = minion || r.hpLevel === baseHp;
    if (!note.hidden) {
      note.textContent = i18n.format("NMB.Builder.AbilityNote", { from: baseHp, to: r.hpLevel });
    }

    const die = `d${data.die}`;
    const dieNote = i18n.localize(`NMB.Builder.DieNote.${die}`);
    const levels = partyLevelRange(data.die);
    el.querySelector("[data-die-hint]").textContent = minion
      ? i18n.format("NMB.Builder.DieHintMinion", { levels, note: dieNote })
      : i18n.format("NMB.Builder.DieHint", { note: dieNote });
  }

  static #onSwitchMode(event, target) {
    const next = target.dataset.mode;
    if (next === this.mode) return;
    const form = this.#form;
    this.levels[this.mode] = form.elements.level.value;
    this.mode = next;
    form.dataset.mode = next;
    form.elements.level.value = this.levels[next];
    for (const btn of form.querySelectorAll(".nmb-seg-btn")) {
      const active = btn === target;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    }
    this.#refresh();
  }

  static #onSwitchTab(event, target) {
    this.tab = target.dataset.tab;
    for (const node of this.element.querySelectorAll("[data-tab]")) {
      if (node.matches(".nmb-tab, .nmb-panel")) node.classList.toggle("active", node.dataset.tab === this.tab);
    }
  }

  /** Link or unlink the HP and damage levels. Unlinking starts both at the current level. */
  static #onToggleLink() {
    const form = this.#form;
    if (this.linked) {
      form.elements.hpLevel.value = form.elements.level.value;
      form.elements.dmgLevel.value = form.elements.level.value;
    } else {
      form.elements.level.value = form.elements.hpLevel.value;
    }
    this.linked = !this.linked;
    this.#syncLinked();
    this.#refresh();
  }

  static async #onCreate(event, target) {
    const data = this.#read();
    data.name = data.name?.trim() || game.i18n.localize("NMB.Builder.DefaultName");
    target.disabled = true;
    try {
      const actor = await createMonster(data);
      ui.notifications.info(game.i18n.format("NMB.Builder.Created", { name: actor.name }));
      if (data.openSheet) actor.sheet.render(true);
      if (!event.shiftKey) await this.close();
    } finally {
      target.disabled = false;
    }
  }
}
