/** The builder window (ApplicationV2). */
import { MODES, MODULE_ID } from "../constants.js";
import { createMonster } from "../builder.js";
import { ABILITIES, DAMAGE_TYPE_GROUPS, DICE, MAX_ATTACK_COUNT, ROWS, SIZES, partyLevelRange, resolve } from "../lib/index.js";

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
const DEFAULT_DAMAGE_TYPE = "slashing";
const DEFAULT_DIE = 8;

const DEFAULT_LEVEL = { standard: 3, minion: 0 };

// A group of up to this many chips sits on one line; bigger groups are split into even rows.
const SINGLE_ROW_MAX = 4;
const MAX_CHIP_COLUMNS = 3;

/** Columns for a group that needs several rows, at most three, so no row is left with a lone chip (5 chips: 3+2). */
const balancedColumns = (n) => Math.ceil(n / Math.ceil(n / MAX_CHIP_COLUMNS));

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
      addAttack: MonsterBuilder.#onAddAttack,
      removeAttack: MonsterBuilder.#onRemoveAttack,
      addCustomAbility: MonsterBuilder.#onAddCustomAbility,
      removeCustomAbility: MonsterBuilder.#onRemoveCustomAbility,
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
  /** Counter that makes each attack card's radio group names unique. */
  #attackSeq = 0;
  #customSeq = 0;

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
        badge: id === "abilities",
      })),
      abilities: ABILITIES.map((a) => ({ ...a, search: `${a.name} ${a.text}`.toLowerCase() })),
      defaultName: game.i18n.localize("NMB.Builder.DefaultName"),
      levels: ROWS.map((r, i) => ({
        value: i,
        label: game.i18n.format("NMB.Builder.Level", { level: r[0] }),
        selectedStandard: i === DEFAULT_LEVEL.standard,
      })),
      sizes: SIZES.map((s) => ({ value: s, label: s, selected: s === "medium" })),
      armors: ARMORS.map((a) => ({ ...a, checked: a.value === "none" })),
      dice: DICE.map((die) => ({ value: die, label: `d${die}`, checked: die === DEFAULT_DIE })),
      counts: Array.from({ length: MAX_ATTACK_COUNT }, (_, i) => i + 1),
      damageGroups: DAMAGE_TYPE_GROUPS.map((group) => ({
        label: `NMB.Builder.DamageGroups.${group.id}`,
        singleRow: group.types.length <= SINGLE_ROW_MAX,
        cols: balancedColumns(group.types.length),
        types: group.types.map((t) => ({
          id: t.id,
          icon: t.icon,
          label: `NMB.Builder.DamageTypes.${t.id}`,
          checked: t.id === DEFAULT_DAMAGE_TYPE,
        })),
      })),
    };
  }

  _onRender() {
    const form = this.#form;
    // Enter inside a text field would otherwise submit (and reload) the page.
    form.addEventListener("submit", (event) => event.preventDefault());
    form.addEventListener("input", () => this.#refresh());
    form.addEventListener("change", (event) => {
      const target = event.target;
      if (target.matches('[data-field="damageType"]')) {
        this.#applyAutoName(target.closest(".nmb-attack"), target.value);
      } else if (target.matches('[data-field="enabled"]')) {
        target.closest(".nmb-ability-row").classList.toggle("is-on", target.checked);
        this.#filterAbilities();
      } else if (target.matches("[data-ability-selected-only]")) {
        this.#filterAbilities();
      }
      this.#refresh();
    });
    form.querySelector("[data-ability-search]").addEventListener("input", () => this.#filterAbilities());
    this.#syncLinked();
    if (!form.querySelector(".nmb-attack")) this.#appendAttack();
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
    data.abilities = this.#readAbilities();
    data.attacks = this.#readAttacks();
    data.flunky = form.elements.flunky.checked;
    data.openSheet = form.elements.openSheet.checked;
    return data;
  }

  get #cards() {
    return [...this.#form.querySelectorAll(".nmb-attack")];
  }

  /** The attack cards as attack objects. A minion has a single attack, so only the first card counts. */
  #readAttacks() {
    const attacks = this.#cards.map((card) => {
      const field = (name) => card.querySelector(`[data-field="${name}"]`);
      const checked = (name) => card.querySelector(`[data-field="${name}"]:checked`)?.value;
      return {
        name: field("name").value.trim() || "Attack",
        die: Number(checked("die")) || DEFAULT_DIE,
        count: Number(checked("count")) || 1,
        damageType: checked("damageType") ?? DEFAULT_DAMAGE_TYPE,
        attackType: checked("attackType") ?? "melee",
        notes: field("notes").value,
      };
    });
    return this.mode === "minion" ? attacks.slice(0, 1) : attacks;
  }

  /** Add an attack card from the template. Radio group names get a unique id so cards do not share a group. */
  #appendAttack() {
    const form = this.#form;
    const id = ++this.#attackSeq;
    const html = form.querySelector("[data-attack-template]").innerHTML.replaceAll("__ID__", id);
    form.querySelector("[data-attacks]").insertAdjacentHTML("beforeend", html);
    const cards = this.#cards;
    const card = cards.at(-1);
    this.#applyAutoName(card, DEFAULT_DAMAGE_TYPE);
    if (id > 1) {
      // A new attack starts with the die of the one before it.
      const die = cards.at(-2).querySelector('[data-field="die"]:checked')?.value;
      const radio = card.querySelector(`[data-field="die"][value="${die}"]`);
      if (radio) radio.checked = true;
    }
  }

  /** Ticked GMG abilities plus the custom ones that have a name, each with its chosen cost (or null). */
  #readAbilities() {
    const cost = (row) => row.querySelector('[data-field="cost"]:checked')?.value ?? null;
    const listed = [...this.#form.querySelectorAll(".nmb-ability-row")]
      .filter((row) => row.querySelector('[data-field="enabled"]').checked)
      .map((row) => {
        const ability = ABILITIES.find((a) => a.id === row.dataset.abilityId);
        return { name: ability.name, text: ability.text, cost: cost(row) };
      });
    const custom = [...this.#form.querySelectorAll(".nmb-custom-ability")].map((row) => ({
      name: row.querySelector('[data-field="name"]').value,
      text: row.querySelector('[data-field="text"]').value,
      cost: cost(row),
    }));
    return [...listed, ...custom];
  }

  /** Hide abilities that do not match the search, or that are not ticked when "selected only" is on. */
  #filterAbilities() {
    const form = this.#form;
    const term = form.querySelector("[data-ability-search]").value.trim().toLowerCase();
    const selectedOnly = form.querySelector("[data-ability-selected-only]").checked;
    for (const row of form.querySelectorAll(".nmb-ability-row")) {
      const matches = !term || row.dataset.search.includes(term);
      const ticked = row.querySelector('[data-field="enabled"]').checked;
      row.hidden = !(matches && (!selectedOnly || ticked));
    }
  }

  /**
   * Name an attack after its damage type ("Fire Attack") while the GM has not renamed it. The last generated
   * name is remembered on the card; the name only follows the damage type while it still matches that.
   */
  #applyAutoName(card, type) {
    const input = card.querySelector('[data-field="name"]');
    const next = game.i18n.format("NMB.Builder.Attack.DefaultName", {
      type: game.i18n.localize(`NMB.Builder.DamageTypes.${type}`),
    });
    if (!input.value || input.value === card.dataset.autoName) input.value = next;
    card.dataset.autoName = next;
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
    set("damage", minion ? r.attacks[0].avg : r.dmgPerRound);
    set("saveDC", r.saveDC);
    set("cr", r.cr);

    // The note only appears when special abilities moved a table row.
    const note = el.querySelector("[data-summary]");
    const lines = [];
    if (!minion) {
      const changes = [];
      const baseHp = ROWS[Number(data.hpLevel)]?.[0];
      const baseDmg = ROWS[Number(data.dmgLevel)]?.[0];
      if (r.hpLevel !== baseHp) changes.push(i18n.format("NMB.Builder.Summary.AbilityHp", { from: baseHp, to: r.hpLevel }));
      if (r.dmgLevel !== baseDmg) {
        changes.push(i18n.format("NMB.Builder.Summary.AbilityDmg", { from: baseDmg, to: r.dmgLevel }));
      }
      if (changes.length) lines.push(i18n.format("NMB.Builder.Summary.AbilityNote", { changes: changes.join(", ") }));
    }
    note.hidden = !lines.length;
    note.textContent = lines.join(" ");

    const badge = el.querySelector("[data-ability-count]");
    badge.hidden = !r.abilities.length;
    badge.textContent = r.abilities.length;

    this.#refreshAttacks(r);
  }

  /** Update each attack card's summary, formula line and overshoot warning from the resolved attacks. */
  #refreshAttacks(r) {
    const i18n = game.i18n;
    const cards = this.#cards;
    this.element.querySelector("[data-attacks]").toggleAttribute("data-single", cards.length === 1);
    cards.forEach((card, i) => {
      const attack = r.attacks[i];
      if (!attack) return; // a minion only resolves its first attack
      const avg = Number.isInteger(attack.avg) ? attack.avg : attack.avg.toFixed(1);
      card.querySelector("[data-attack-title]").textContent = attack.name;
      card.querySelector("[data-attack-sub]").textContent = i18n.format("NMB.Builder.Attack.Sub", {
        count: attack.count > 1 ? `${attack.count}× ` : "",
        formula: attack.formula,
        avg,
        type: i18n.localize(`NMB.Builder.DamageTypes.${attack.damageType}`),
      });

      // The GMG's thematic note for this die, worded as a suggestion. Minions also show suggested party levels.
      const note = i18n.localize(`NMB.Builder.DieNote.d${attack.die}`);
      card.querySelector("[data-die-hint]").textContent =
        r.mode === "minion"
          ? i18n.format("NMB.Builder.DieHintMinion", { levels: partyLevelRange(attack.die), note })
          : i18n.format("NMB.Builder.DieHint", { note });
      const warn = card.querySelector("[data-attack-warn]");
      warn.hidden = !attack.overshoot;
      warn.textContent = attack.overshoot ? i18n.format("NMB.Builder.Attack.Overshoot", { die: `d${attack.die}` }) : "";
    });
  }

  static #onAddCustomAbility() {
    const form = this.#form;
    const id = ++this.#customSeq;
    const html = form.querySelector("[data-custom-ability-template]").innerHTML.replaceAll("__ID__", id);
    form.querySelector("[data-custom-abilities]").insertAdjacentHTML("beforeend", html);
    form.querySelector("[data-custom-abilities]").lastElementChild.querySelector('[data-field="name"]').focus();
    this.#refresh();
  }

  static #onRemoveCustomAbility(event, target) {
    target.closest(".nmb-custom-ability").remove();
    this.#refresh();
  }

  static #onAddAttack() {
    this.#appendAttack();
    this.#refresh();
  }

  static #onRemoveAttack(event, target) {
    event.preventDefault(); // the button sits inside the card's <summary>; do not also toggle the card
    if (this.#cards.length < 2) return;
    target.closest(".nmb-attack").remove();
    this.#refresh();
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
