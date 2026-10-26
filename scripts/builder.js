/**
 * Stat resolution and Nimble actor construction.
 * Everything that touches Nimble's data schema lives here (field names taken from
 * Nimble system 0.10.0), so a system update only needs fixes in this file.
 */
import { FOLDER_NAME } from "./constants.js";
import { TOKEN_SIZE, buildDescription, resolve } from "./lib/index.js";

function attackItem({ name, formula, damageType, attackType, canCrit, notes }) {
  const rid = () => foundry.utils.randomID(16);
  const dmgId = rid();
  return {
    _id: rid(),
    name,
    type: "monsterFeature",
    img: "icons/svg/sword.svg",
    system: {
      macro: "",
      identifier: "",
      rules: [],
      activation: {
        acquireTargetsFromTemplate: false,
        cost: { details: "", quantity: 1, type: "none", isReaction: false },
        duration: { details: "", quantity: 1, type: "action" },
        effects: [
          {
            id: dmgId,
            type: "damage",
            damageType,
            formula,
            parentContext: null,
            parentNode: null,
            canCrit,
            canMiss: true,
            on: {
              hit: [
                { id: rid(), type: "damageOutcome", outcome: "fullDamage", parentContext: "hit", parentNode: dmgId },
              ],
            },
          },
        ],
        showDescription: true,
        targets: {
          count: 1,
          restrictions: "",
          attackType: attackType === "range" ? "range" : "",
          distance: attackType === "range" ? 6 : 1,
        },
        template: { length: 1, radius: 1, shape: "", width: 1 },
      },
      description: notes ? `<p>${notes}</p>` : "",
      subtype: "action",
      parentItemId: "",
    },
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
  };
}

async function getFolder(name) {
  return game.folders.find((f) => f.type === "Actor" && f.name === name) ?? Folder.create({ name, type: "Actor" });
}

/** Create a Nimble actor from the builder form data. Returns the new actor. */
export async function createMonster(data) {
  const r = resolve(data);
  const folder = await getFolder(FOLDER_NAME);
  const isMinion = r.mode === "minion";
  const actorType = isMinion ? "minion" : "npc";
  const size = TOKEN_SIZE[data.size];
  // Minions have no HP to track; keep a single point so the sheet and token bar stay valid.
  const hp = r.hp ?? 1;

  return Actor.create({
    name: data.name,
    type: actorType,
    img: "icons/svg/mystery-man.svg",
    folder: folder.id,
    system: {
      attributes: {
        armor: isMinion ? "none" : data.armor,
        damageResistances: [],
        damageVulnerabilities: [],
        damageImmunities: [],
        hp: { max: hp, value: hp, temp: 0 },
        sizeCategory: data.size,
      },
      description: buildDescription(r, data),
      details: {
        creatureType: data.creatureType,
        level: r.hpLevel,
        ...(actorType === "npc" && { isFlunky: !r.canCrit }),
      },
    },
    prototypeToken: {
      name: data.name,
      displayName: 50,
      actorLink: false,
      width: size,
      height: size,
      lockRotation: true,
      disposition: -1,
      displayBars: 0,
      bar1: { attribute: "attributes.hp" },
    },
    items: [
      attackItem({
        name: `${data.attackName || "Attack"}${r.twice ? " (2×)" : ""}`,
        formula: r.formula,
        damageType: data.damageType,
        attackType: data.attackType,
        canCrit: r.canCrit,
        notes: [
          isMinion ? "Follows minion rules." : "",
          r.twice ? "Make two attacks, each dealing this damage." : "",
          r.alt ? `${r.alt}.` : "",
        ]
          .filter(Boolean)
          .join(" "),
      }),
    ],
  });
}
