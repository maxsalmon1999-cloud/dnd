// Build script: transforms raw 5e SRD JSON (tools/srd-2014/, from
// github.com/5e-bits/5e-database, CC-BY-4.0) into the compact app-format
// files in src/data/srd/. Re-run after updating the source data:
//   node tools/build-srd.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const SRC = join(root, 'srd-2014')
const OUT = join(root, '..', 'src', 'data', 'srd')
mkdirSync(OUT, { recursive: true })

const load = (f) => JSON.parse(readFileSync(join(SRC, `${f}.json`), 'utf8'))
const save = (f, data) => {
  const json = JSON.stringify(data)
  writeFileSync(join(OUT, `${f}.json`), json)
  console.log(`  src/data/srd/${f}.json  ${(json.length / 1024).toFixed(0)} KB`)
}
// Lookup key: lowercase, no punctuation, collapsed spaces ("Lars' Rapier" -> "lars rapier")
const norm = (s) => String(s || '').toLowerCase().replace(/[’'".,()\-–—]/g, ' ').replace(/\s+/g, ' ').trim()
const joinDesc = (d) => (Array.isArray(d) ? d.join('\n\n') : d || '')

// ---------- spells ----------
const spells = {}
for (const s of load('Spells')) {
  const dmgType = s.damage?.damage_type?.name || ''
  // base damage dice: lowest slot level for levelled spells, character level 1 for cantrips
  const slotDmg = s.damage?.damage_at_slot_level
  const charDmg = s.damage?.damage_at_character_level
  const baseDice = slotDmg ? slotDmg[Math.min(...Object.keys(slotDmg).map(Number))] : charDmg ? charDmg[Math.min(...Object.keys(charDmg).map(Number))] : ''
  spells[norm(s.name)] = {
    name: s.name,
    lvl: s.level, // 0 = cantrip
    school: s.school?.name || '',
    classes: (s.classes || []).map((c) => c.name),
    time: s.casting_time,
    range: s.range,
    comp: (s.components || []).join(', ') + (s.material ? ` (${s.material.replace(/\.$/, '')})` : ''),
    dur: s.duration,
    conc: !!s.concentration,
    ritual: !!s.ritual,
    desc: joinDesc(s.desc),
    higher: joinDesc(s.higher_level),
    dmg: baseDice ? `${baseDice}${dmgType ? ' ' + dmgType.toLowerCase() : ''}` : '',
    dmgScale: charDmg || slotDmg || null, // per-character-level (cantrips) or per-slot-level dice
    save: s.dc ? `${s.dc.dc_type?.name || ''} save${s.dc.dc_success === 'half' ? ' (half on success)' : ''}` : '',
    atk: s.attack_type ? `${s.attack_type} spell attack` : '',
  }
}
save('spells', spells)

// ---------- class/subclass features (+ the lone SRD feat) ----------
// Keyed by normalized name -> ARRAY (names like "Expertise" repeat across classes)
const features = {}
// Index under the full name AND the parenthetical-stripped base name, so
// "Bardic Inspiration" finds "Bardic Inspiration (d6)" etc. Base-name buckets
// collect every variant; lookup picks the lowest-level (base) one.
const pushFeature = (entry) => {
  ;(features[norm(entry.name)] ||= []).push(entry)
  const base = norm(String(entry.name).replace(/\s*\(.*?\)\s*/g, ' '))
  if (base && base !== norm(entry.name)) (features[base] ||= []).push(entry)
}
for (const f of load('Features')) {
  if (/^(ability score improvement|spellcasting:)/i.test(f.name) && f.level > 1 && features[norm(f.name)]) continue // ASI repeats identically per level; keep one
  pushFeature({
    name: f.name,
    cls: f.class?.name || '',
    sub: f.subclass?.name || '',
    lvl: f.level,
    desc: joinDesc(f.desc),
  })
}
for (const f of load('Feats')) pushFeature({ name: f.name, cls: '', sub: '', lvl: 0, desc: joinDesc(f.desc) })
save('features', features)

// ---------- racial traits ----------
const traits = {}
for (const t of load('Traits')) {
  traits[norm(t.name)] = {
    name: t.name,
    races: [...(t.races || []).map((r) => r.name), ...(t.subraces || []).map((r) => r.name)],
    desc: joinDesc(t.desc),
  }
}
save('traits', traits)

// ---------- class progression (slots, prof, features, counters, per level) ----------
const classes = {}
for (const c of load('Classes')) {
  classes[c.index] = {
    name: c.name,
    hitDie: c.hit_die,
    saves: (c.saving_throws || []).map((s) => s.name),
    spellAbility: c.spellcasting?.spellcasting_ability?.name || '',
    levels: {},
    subclasses: {},
  }
}
for (const sc of load('Subclasses')) {
  const cls = classes[sc.class.index]
  if (cls) cls.subclasses[sc.name] = { flavor: sc.subclass_flavor, desc: joinDesc(sc.desc), levels: {} }
}
const subNameByIndex = Object.fromEntries(load('Subclasses').map((s) => [s.index, s.name]))
for (const l of load('Levels')) {
  const cls = classes[l.class.index]
  if (!cls) continue
  const featureNames = (l.features || []).map((f) => f.name)
  if (l.subclass) {
    const sub = cls.subclasses[subNameByIndex[l.subclass.index]]
    if (sub && featureNames.length) sub.levels[l.level] = { features: featureNames }
    continue
  }
  const sc = l.spellcasting
  const slots = sc ? [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => sc[`spell_slots_level_${n}`] || 0) : null
  cls.levels[l.level] = {
    prof: l.prof_bonus,
    features: featureNames,
    ...(sc ? { cantrips: sc.cantrips_known || 0, known: sc.spells_known || 0, slots } : {}),
    ...(l.class_specific && Object.keys(l.class_specific).length ? { counters: l.class_specific } : {}),
  }
}
save('classes', classes)

// ---------- conditions (full SRD text) ----------
const conditions = {}
for (const c of load('Conditions')) conditions[norm(c.name)] = { name: c.name, desc: joinDesc(c.desc) }
save('conditions', conditions)

// ---------- magic items ----------
const magicItems = {}
for (const m of load('Magic-Items')) {
  magicItems[norm(m.name)] = {
    name: m.name,
    rarity: m.rarity?.name || '',
    category: m.equipment_category?.name || '',
    desc: joinDesc(m.desc),
  }
}
save('magic-items', magicItems)

// ---------- mundane gear (weapons: dice/properties; armour: AC; packs/gear: desc) ----------
const propDescs = Object.fromEntries(load('Weapon-Properties').map((p) => [p.name, joinDesc(p.desc)]))
const gear = {}
for (const e of load('Equipment')) {
  const g = { name: e.name, category: e.equipment_category?.name || '' }
  if (e.damage) g.dmg = `${e.damage.damage_dice} ${e.damage.damage_type?.name?.toLowerCase() || ''}`.trim()
  if (e.two_handed_damage) g.dmg2h = `${e.two_handed_damage.damage_dice} ${e.two_handed_damage.damage_type?.name?.toLowerCase() || ''}`.trim()
  if (e.range?.normal) g.range = e.range.long ? `${e.range.normal}/${e.range.long} ft` : `${e.range.normal} ft`
  if (e.properties?.length) g.props = e.properties.map((p) => p.name)
  if (e.armor_class) g.ac = `${e.armor_class.base}${e.armor_class.dex_bonus ? ' + DEX' + (e.armor_class.max_bonus ? ` (max ${e.armor_class.max_bonus})` : '') : ''}`
  if (e.armor_category) g.armorType = e.armor_category
  if (e.str_minimum) g.strMin = e.str_minimum
  if (e.stealth_disadvantage) g.stealthDis = true
  const desc = joinDesc(e.desc)
  if (desc) g.desc = desc
  gear[norm(e.name)] = g
}
save('gear', gear)
save('weapon-properties', propDescs)

console.log('Done.')
