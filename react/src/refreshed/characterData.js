// Single-player character data for the D&D player screen prototype.
export const CHARACTER = {
  name: "Akwan Akusian",
  klass: "Bard",
  domain: "College of Lore",
  race: "Human",
  level: 3,
  ac: 15,
  speed: 30,
  init: "+3",
  prof: "+2",
  spellDC: 13,
  spellAtk: "+5",
  hp: { cur: 21, max: 21, temp: 0 },
  hitDice: { cur: 3, max: 3, die: "d8" },

  // Bard is proficient in DEX and CHA saving throws
  saveProf: ["DEX", "CHA"],

  // STR DEX CON INT WIS CHA  (scores derived from the given modifiers)
  stats: [
    { key: "STR", score: 8,  mod: "-1" },
    { key: "DEX", score: 16, mod: "+3" },
    { key: "CON", score: 12, mod: "+1" },
    { key: "INT", score: 12, mod: "+1" },
    { key: "WIS", score: 10, mod: "+0" },
    { key: "CHA", score: 16, mod: "+3" },
  ],

  spellSlots: [
    { level: 1, total: 4, used: 0 },
    { level: 2, total: 2, used: 0 },
  ],

  // proficient: Acrobatics, Deception, Performance, Persuasion
  // non-proficient checks get +1 from Jack of All Trades
  skills: [
    { n: "Acrobatics",      a: "DEX", m: "+5", p: true  },
    { n: "Animal Handling", a: "WIS", m: "+1", p: false },
    { n: "Arcana",          a: "INT", m: "+2", p: false },
    { n: "Athletics",       a: "STR", m: "+0", p: false },
    { n: "Deception",       a: "CHA", m: "+5", p: true  },
    { n: "History",         a: "INT", m: "+2", p: false },
    { n: "Insight",         a: "WIS", m: "+1", p: false },
    { n: "Intimidation",    a: "CHA", m: "+4", p: false },
    { n: "Investigation",   a: "INT", m: "+2", p: false },
    { n: "Medicine",        a: "WIS", m: "+1", p: false },
    { n: "Nature",          a: "INT", m: "+2", p: false },
    { n: "Perception",      a: "WIS", m: "+1", p: false },
    { n: "Performance",     a: "CHA", m: "+5", p: true  },
    { n: "Persuasion",      a: "CHA", m: "+5", p: true  },
    { n: "Religion",        a: "INT", m: "+2", p: false },
    { n: "Sleight of Hand", a: "DEX", m: "+4", p: false },
    { n: "Stealth",         a: "DEX", m: "+4", p: false },
    { n: "Survival",        a: "WIS", m: "+1", p: false },
  ],

  weapons: [
    { n: "Lar's Rapier",   meta: "Melee · 5 ft · finesse",  hit: "+5", dmg: "1d6+3", type: "piercing" },
    { n: "Hammer",         meta: "Melee · 5 ft",            hit: "+1", dmg: "1d6",   type: "bludgeoning" },
    { n: "Arrows ×15",     meta: "Ammunition",              hit: "+5", dmg: "1d6",   type: "piercing" },
  ],
  cantrips: [
    { n: "Vicious Mockery", meta: "WIS save · 60 ft",   tag: "1d4 psychic" },
    { n: "Fire Bolt",       meta: "Spell atk · 120 ft", tag: "1d10 fire" },
  ],

  abilities: [
    { n: "Bardic Inspiration", meta: "Bonus · ally +1d6 within 60 ft",  tag: "2/3 · long" },
    { n: "Cutting Words",      meta: "Reaction · −1d6 to enemy's roll",  tag: "uses insp." },
    { n: "Jack of All Trades", meta: "+1 to non-proficient checks",      tag: "passive" },
    { n: "Song of Rest",       meta: "Short rest · ally regains +1d6 HP",tag: "passive" },
    { n: "Fey Ancestry",       meta: "Adv. vs charm · no magic sleep",   tag: "passive" },
  ],
  spells: {
    1: [
      { n: "Faerie Fire",        tag: "Evocation · conc." },
      { n: "Healing Word",       tag: "Evocation · bonus" },
      { n: "Dissonant Whispers", tag: "Enchantment · 3d6" },
      { n: "Charm Person",       tag: "Enchantment" },
    ],
    2: [
      { n: "Suggestion",  tag: "Enchantment · conc." },
      { n: "Hold Person", tag: "Enchantment · conc." },
    ],
  },
  consumables: [
    { n: "Potion of Healing", qty: 3, meta: "2d4+2 HP · bonus action" },
  ],

  // ---- inventory ----
  armour: [
    { n: "Iron Buckle Shield", slot: "Off-hand", ac: "+1 AC", note: "Lars' gift · homebrew" },
  ],
  coins: { pp: 0, gp: 15, sp: 0, cp: 5 },
  misc: [
    { n: "Rat Tooth Necklace", qty: 1, meta: "Trinket · keepsake" },
  ],
};
