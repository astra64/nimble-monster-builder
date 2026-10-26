/**
 * The GM Guide's "Flavorful Monster Abilities" (p.30). Text is the book's own, lightly tidied.
 * Add an ability to a monster and, for a standard monster, lower HP or damage by one table row for each.
 */
export const ABILITIES = [
  { id: "acid-blood", name: "Acid Blood", text: "Melee attackers take half the HP lost in return as acid damage." },
  { id: "aggressive", name: "Aggressive", text: "+X speed if moving toward enemies." },
  {
    id: "blinding-spit",
    name: "Blinding Spit",
    text: "Spits a blinding substance at a target within range. The target must make a save or be blinded for 1 round.",
  },
  { id: "bloodthirsty", name: "Bloodthirsty", text: "Has advantage on attacks against Bloodied targets." },
  { id: "brute", name: "Brute", text: "Attacks also knockback a number of spaces equal to the primary die rolled." },
  { id: "brawler", name: "Brawler", text: "Extra damage, can only attack in melee." },
  {
    id: "burning-aura",
    name: "Burning Aura",
    text: "Creatures that start their turn adjacent to this monster take 1d6 fire damage.",
  },
  { id: "climbing", name: "Climbing", text: "Can traverse walls or ceilings normally." },
  { id: "controlling", name: "Controlling", text: "Creates/immune to difficult terrain." },
  { id: "daze-blows", name: "Disgusting/Venomous/Heavy Blows", text: "Attacks also Daze the target." },
  {
    id: "disintegrating-armor",
    name: "Disintegrating Armor",
    text: "Starts with Heavy Armor, on crit degrades to Medium, then to none.",
  },
  { id: "doom", name: "Doom", text: "Attacks also Wound the target." },
  {
    id: "explosive-death",
    name: "Explosive Death",
    text: "Explode on death, dealing 2d6 damage to creatures within reach.",
  },
  { id: "fast", name: "FAST", text: "Reaction: 1/round. Force a reroll with disadvantage on an attack." },
  { id: "fearsome", name: "Fearsome", text: "Frighten enemies within Range on a failed WIL save. 1/encounter." },
  {
    id: "flying",
    name: "Flying",
    text: "Flying speed and immune to Opportunity Attacks. May FALL when crit (1d6 damage/10 ft. fallen, and lands Prone).",
  },
  { id: "formation", name: "Formation", text: "Armor increases 1 step for each adjacent ally (None, Med, Heavy)." },
  { id: "frenzied", name: "Frenzied", text: "Deals extra damage or has faster speed while damaged." },
  { id: "grappler", name: "Grappler", text: "On hit: Grapples." },
  { id: "gravity-manipulator", name: "Gravity Manipulator", text: "Can pull or push enemies within reach." },
  { id: "hates-the-light", name: "Hates the Light", text: "Attacks the hero holding light." },
  { id: "hypnotic-gaze", name: "Hypnotic Gaze", text: "Forces enemies to make a WIL save or be confused for 1 round." },
  { id: "invulnerable", name: "Invulnerable", text: "Immune to damage until crit." },
  { id: "mounted", name: "Mounted", text: "Faster movement and deals extra damage after moving toward an enemy." },
  {
    id: "obstinate",
    name: "Obstinate",
    text: "When attacking a target with disadvantage, treat the roll as if it had advantage instead.",
  },
  { id: "pack-tactics", name: "Pack Tactics", text: "Advantage on attacks when an ally is adjacent to the target." },
  { id: "parry", name: "Parry", text: "Attacks against them miss on a 1 and 2." },
  { id: "ranged", name: "Ranged", text: "Extra damage; can only attack at range." },
  { id: "retaliate", name: "Retaliate", text: "Attacks the first creature who attacks them in melee each round." },
  { id: "savage", name: "Savage", text: "Always crits Grappled creatures." },
  { id: "shifty", name: "Shifty", text: "Can move after being attacked." },
  {
    id: "silencer",
    name: "Silencer",
    text: "Attacks silence enemies (making them unable to cast spells or perform other actions that requires the voice).",
  },
  { id: "sneak", name: "Sneak", text: "Invisible until they attack." },
  {
    id: "spiked",
    name: "Spiked",
    text: "When hit by a melee attack, the attacker takes 1d4 piercing damage in return.",
  },
  {
    id: "standard-bearer",
    name: "Standard Bearer",
    text: "Buffs nearby allies, reducing the damage they take or increasing the damage they do (see Kobold Clanger or Doomsayer Cultist).",
  },
  { id: "sturdy", name: "Sturdy/Undying", text: "The first time the monster would die, they have 1 HP instead." },
  { id: "summoner", name: "Summoner", text: "Calls minions to their aid each round." },
  { id: "tricky", name: "Tricky", text: "Can swap places with allies or enemies." },
  { id: "vicious", name: "Vicious", text: "Crits are Vicious (roll 1 additional die)." },
  { id: "warping-touch", name: "Warping Touch", text: "On hit: teleport target X spaces." },
  { id: "webslinger", name: "Webslinger", text: "Can immobilize a target with webs when hit or crit." },
];

/** What an ability costs a standard monster: one table row off HP or damage, or nothing. */
export const ABILITY_COSTS = ["hp", "damage", "free"];
