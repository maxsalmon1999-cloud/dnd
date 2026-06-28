// Adapter: build the refreshed screen's `C` shape from the live Firebase data.
//   sheets/<key>      — static sheet (stats, spells, abilities, ac, level…)
//   characters/<key>  — live state (hp, gold, inventory, slots, proficiencies)
// This replaces the hardcoded characterData.js placeholder, so the refreshed
// screen works for ANY character. The transform mirrors the (archived) old
// React player screen, reusing the same SKILLS map + helpers.
import { SKILLS } from '../data/gameData'
import { fmtMod, profFromLevel, slotLevel } from '../shared/helpers'

const STAT_ORDER = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
const titleCase = (s) => String(s || '').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())

// "human bard" -> {race:"Human", klass:"Bard"}; "changeling warlock" -> Changeling/Warlock;
// single word ("bard") -> race "", klass "Bard".
function splitClass(cls) {
  const parts = String(cls || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return { race: '', klass: titleCase(cls) }
  return { race: titleCase(parts[0]), klass: titleCase(parts.slice(1).join(' ')) }
}

// "1st Level" -> 1, "2nd Level" -> 2, 3 -> 3
function parseLevelNum(lv) {
  if (typeof lv === 'number') return lv
  const m = String(lv || '').match(/\d+/)
  return m ? parseInt(m[0], 10) : null
}

export function adaptCharacter(sheet, live) {
  sheet = sheet || {}
  live = live || {}
  const statsObj = sheet.stats || {}
  const charLevel = sheet.level || 1
  const profNum = sheet.proficiency != null ? sheet.proficiency : profFromLevel(charLevel)
  const split = splitClass(sheet.cls)
  const race = sheet.race || split.race // prefer the stored field; fall back to parsing cls
  const klass = split.klass
  const statMod = (k) => statsObj[k] || 0

  // ability scores (we only have modifiers; derive a plausible score for display)
  const stats = STAT_ORDER.map((key) => {
    const mod = statMod(key)
    return { key, score: 10 + 2 * mod, mod: fmtMod(mod) }
  })

  // skills: standard 5e list, mod = ability mod (+ proficiency if proficient)
  const skillProf = live.skillProficiencies || []
  const skills = SKILLS.map((sk) => {
    const isProf = skillProf.includes(sk.name)
    return { n: sk.name, a: sk.stat, m: fmtMod(statMod(sk.stat) + (isProf ? profNum : 0)), p: isProf }
  }).sort((a, b) => a.n.localeCompare(b.n))

  // spell slots: {level, total, used} — used derived from the live pip map
  const liveSlots = live.slots || {}
  const spellSlots = (sheet.spellSlots || []).map((s) => {
    const lvl = slotLevel(s)
    const total = s.count || 0
    let used = 0
    for (let i = 0; i < total; i++) if (liveSlots[`${s.key}_${i}`] === true) used++
    return { level: lvl, total, used }
  })

  // spells grouped by level + cantrips split out (no dice in the data → no roll tag)
  const cantrips = []
  const spells = {}
  ;(sheet.spells || []).forEach((sp) => {
    if (/cantrip/i.test(sp.level)) {
      // damaging cantrips carry damage/damageType in the sheet → roll tag like "1d10 fire"
      const tag = sp.damage ? `${sp.damage}${sp.damageType ? ' ' + sp.damageType : ''}` : ''
      cantrips.push({ n: sp.name, meta: 'Cantrip', tag })
      return
    }
    const ln = parseLevelNum(sp.level)
    if (ln == null) return
    ;(spells[ln] = spells[ln] || []).push({ n: sp.name, tag: '' })
  })

  // abilities: tag encodes uses ("x/y · rest") or "passive" (parsed by the screen)
  const abilities = (sheet.abilities || []).map((a) => {
    let tag = ''
    if (a.passive) tag = 'passive'
    else if (a.max) tag = `${a.max}/${a.max}${a.rest ? ' · ' + String(a.rest).toLowerCase() : ''}`
    return { n: a.name, meta: a.desc || '', tag }
  })

  // inventory-derived lists (weapons / armour / consumables)
  const invList = Object.values(live.inventory || {})
  const bestPhysical = Math.max(statMod('STR'), statMod('DEX'))
  const weapons = invList.filter((it) => it && it.category === 'weapons').map((it) => {
    const abilKey = it.damageAbility && statsObj[it.damageAbility] != null ? it.damageAbility : null
    const aMod = abilKey ? statMod(abilKey) : bestPhysical
    const dice = it.damageDice || ''
    return {
      n: it.name + (it.amount > 1 ? ` ×${it.amount}` : ''),
      meta: 'Weapon',
      hit: fmtMod(aMod + profNum),
      dmg: dice ? dice + (aMod ? fmtMod(aMod) : '') : '',
      type: it.damageType || '',
    }
  })
  const armour = invList.filter((it) => it && it.category === 'armour').map((it) => ({
    n: it.name, slot: '', ac: it.ac != null ? `${it.ac}` : '', note: it.notes || '',
  }))
  const consumables = invList.filter((it) => it && it.category === 'consumables').map((it) => ({
    n: it.name, qty: it.amount || 1, meta: it.notes || '',
  }))

  // coins: live.gold is stored as a single gp number
  const gold = typeof live.gold === 'number' ? live.gold : 0

  return {
    name: titleCase(sheet.name || 'Adventurer'),
    klass, race, level: charLevel,
    ac: sheet.ac != null ? sheet.ac : 10,
    prof: fmtMod(profNum),
    spellDC: sheet.spellSaveDC != null ? sheet.spellSaveDC : '—',
    spellAtk: sheet.spellAttack || '—',
    hp: {
      cur: live.hp != null ? live.hp : (sheet.maxHp || 0),
      max: live.maxHp != null ? live.maxHp : (sheet.maxHp || 0),
      temp: 0,
    },
    saveProf: live.saveProficiencies || [],
    stats, skills, spellSlots, spells, cantrips, abilities,
    weapons, armour, consumables,
    coins: { pp: 0, gp: gold, sp: 0, cp: 0 },
    misc: [],
  }
}
