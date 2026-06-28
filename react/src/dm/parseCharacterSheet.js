// Character-sheet markdown parser, ported verbatim in behaviour from the
// original index.html. Turns an uploaded .md/.txt sheet into the structured
// record stored at characterSheets/{key}.

export const normalizeCharacterName = (name) => String(name || '').trim().toLowerCase()

export function slugifyCharacterKey(name) {
  const slug = String(name || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'character'
}

export function resolveCharacterKey(name, existingChars, reservedKeys) {
  const normalized = normalizeCharacterName(name)
  for (const [key, existing] of Object.entries(existingChars)) {
    if (normalizeCharacterName(existing.name) === normalized) {
      reservedKeys.add(key)
      return key
    }
  }
  const base = slugifyCharacterKey(name)
  let key = base
  let suffix = 2
  while (reservedKeys.has(key)) key = `${base}-${suffix++}`
  reservedKeys.add(key)
  return key
}

export function parseSpellsFromRawMarkdown(text) {
  const lines = String(text || '').split('\n')
  const spells = []
  let inSpells = false
  let currentSpellLevel = ''
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (/^[•*-]/.test(trimmed)) {
      if (inSpells) {
        const spellText = trimmed.replace(/^[•*-]\s*/, '').replace(/\s*\([^)]*\)\s*$/, '').trim()
        if (spellText) spells.push({ level: currentSpellLevel, name: spellText })
      }
      continue
    }
    if (/known\s+spells?|spells?\s+known/i.test(trimmed)) { inSpells = true; continue }
    if (trimmed.charCodeAt(0) > 127) { inSpells = false; continue }
    if (!inSpells) continue
    if (/^(Cantrips?|(\d+)\w*\s+Level|Prepared|At.?Will)\s*[:(]/i.test(trimmed) ||
        /^(Cantrips?|(\d+)\w*\s+Level|Prepared|At.?Will)\s*$/i.test(trimmed)) {
      const raw = trimmed.replace(/[:(].*/, '').trim()
      currentSpellLevel = /^cantrip/i.test(raw) ? 'cantrip' : raw
    }
  }
  return spells
}

export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = parseInt(n) % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function parseCharacterSheet(text) {
  const lines = text.split('\n')
  const name = lines[0].trim()
  const cls = lines[1] ? lines[1].trim() : ''
  // The sheet's 2nd line leads with race then class ("human bard"); store race
  // as its own field (first token) so it's a first-class value, not just parsed.
  const race = cls.split(/\s+/)[0] || ''

  const extract = (pattern) => {
    for (const line of lines) {
      const m = line.match(pattern)
      if (m) return m[1]
    }
    return null
  }

  const ac = parseInt(extract(/AC:\s*(\d+)/)) || 10
  const maxHp = parseInt(extract(/HP:\s*(\d+)/)) || 10
  const proficiency = parseInt(extract(/Proficiency:\s*\+?(\d+)/)) || 2
  const spellSaveDC = parseInt(extract(/Spell Save DC:\s*(\d+)/)) || null
  const spellAttack = extract(/Spell Attack:\s*(\+?\d+)/)
  const levelRaw = extract(/\(Level\s+(\d+)\)/i) || extract(/^Level\s*[:\s]\s*(\d+)/i)
  const level = parseInt(levelRaw) || 1
  const xp = extract(/XP:\s*([^\n]+)/i)

  const stats = {}
  const statPattern = /^(STR|DEX|CON|INT|WIS|CHA)\s+([+-]?\d+)/
  lines.forEach((line) => {
    const m = line.match(statPattern)
    if (m) stats[m[1]] = parseInt(m[2])
  })

  const spellSlots = []
  const slotPattern = /^(\d+)\w*\s+Level:\s*(\d+)/
  lines.forEach((line) => {
    const m = line.match(slotPattern)
    if (m) {
      const lvl = m[1]
      spellSlots.push({ label: ordinal(lvl) + ' Level', shortLabel: ordinal(lvl), count: parseInt(m[2]), key: lvl })
    }
  })
  const warlockSlot = extract(/Warlock Slots?:\s*(\d+)/i)
  if (warlockSlot) spellSlots.push({ label: '2nd (Short Rest)', shortLabel: '2nd', count: parseInt(warlockSlot), key: 'w' })

  const isSectionHeader = (line) => line.charCodeAt(0) > 127 || /^#{1,3}\s+\S/.test(line)

  const abilities = []
  const abilPattern = /^([A-Z][\w\s]+?)\s*\((\d+)x?\s*\/\s*(Short|Long)\s+Rest\)/
  lines.forEach((line) => {
    const m = line.match(abilPattern)
    if (m) {
      const abilName = m[1].trim()
      abilities.push({ name: abilName, key: abilName.toLowerCase().replace(/\s+/g, '_'), max: parseInt(m[2]), rest: m[3], passive: false })
    }
  })

  let inSpecial = false
  let featureBlock = []
  const flushFeatureBlock = () => {
    if (!featureBlock.length) return
    const [featureName, ...descLines] = featureBlock
    if (!featureName || abilities.find((a) => a.name === featureName)) { featureBlock = []; return }
    const desc = descLines.join(' ').trim()
    const usageMatch = featureName.match(abilPattern)
    if (usageMatch) {
      const existing = abilities.find((a) => a.name === usageMatch[1].trim() && !a.passive)
      if (existing && desc && !existing.desc) existing.desc = desc
    } else if (
      featureName.length > 2 && featureName.length < 60 &&
      !/^\d/.test(featureName) && !/^[•-]/.test(featureName) &&
      !/^(AC|HP|Speed|Init|Prof|Spell|XP)/i.test(featureName) &&
      !/^(STR|DEX|CON|INT|WIS|CHA)/.test(featureName)
    ) {
      abilities.push({ name: featureName, passive: true, desc })
    }
    featureBlock = []
  }
  lines.forEach((line) => {
    if (isSectionHeader(line)) {
      if (inSpecial) flushFeatureBlock()
      inSpecial = /(features?|traits?|invocations?|pact\s+boon|maneuvers?|fighting\s+style|expertise)/i.test(line) &&
        !/\b(saving|proficiency|ability\s+(mod|score))\b/i.test(line)
      return
    }
    if (!inSpecial) return
    const trimmed = line.trim()
    if (!trimmed) { flushFeatureBlock(); return }
    featureBlock.push(trimmed)
  })
  flushFeatureBlock()

  const spells = parseSpellsFromRawMarkdown(text)

  // Inventory: collect weapon stats from Combat Actions, then parse equipment.
  const weaponStatMap = {}
  let inCombatActions = false
  let pendingWeaponName = null
  lines.forEach((line) => {
    if (isSectionHeader(line)) { inCombatActions = /Combat Actions/i.test(line); pendingWeaponName = null; return }
    if (!inCombatActions) return
    const trimmed = line.trim()
    if (!trimmed) { pendingWeaponName = null; return }
    const m = trimmed.match(/^(.+?)\s*[—–-]{1,2}\s*([+-]?\d+)\s+to\s+hit/i)
    if (m) { pendingWeaponName = m[1].trim().toLowerCase(); weaponStatMap[pendingWeaponName] = m[2] + ' to hit'; return }
    if (pendingWeaponName && /\dd\d/.test(trimmed)) { weaponStatMap[pendingWeaponName] += ', ' + trimmed; pendingWeaponName = null }
  })

  const ARMOUR_KW = ['armor', 'armour', 'leather', 'chain', 'plate', 'shield', 'breastplate', 'mail', 'hide', 'padded', 'scale', 'splint', 'studded']
  const WEAPON_KW = ['sword', 'dagger', 'bow', 'crossbow', 'axe', 'mace', 'staff', 'spear', 'hammer', 'rapier', 'scimitar', 'blade', 'knife', 'club', 'flail', 'pike', 'lance', 'halberd', 'glaive', 'trident', 'javelin', 'dart', 'sling', 'whip', 'quarterstaff', 'handaxe', 'morningstar', 'maul', 'battleaxe', 'warhammer']
  const TOOL_KW = ['tool', 'kit', 'instrument', 'thieves', 'disguise', 'forgery', 'herbalism', 'poisoner', 'navigator', 'cartographer']
  const CONSUME_KW = ['potion', 'scroll', 'arrow', 'bolt', 'ration', 'torch', 'oil', 'antitoxin', 'healer']
  const catFromName = (n) => {
    const l = n.toLowerCase()
    if (ARMOUR_KW.some((k) => l.includes(k))) return 'armour'
    if (WEAPON_KW.some((k) => l.includes(k))) return 'weapons'
    if (TOOL_KW.some((k) => l.includes(k))) return 'tools'
    if (CONSUME_KW.some((k) => l.includes(k))) return 'consumables'
    return 'other'
  }

  const inventory = {}
  let inEquipment = false
  lines.forEach((line) => {
    if (isSectionHeader(line)) { inEquipment = /Equipment|Inventory/i.test(line); return }
    if (!inEquipment) return
    const trimmed = line.trim().replace(/^[•*-]\s*/, '')
    if (!trimmed || trimmed.length > 100) return
    if (/^(AC|HP|Speed|Init|Prof|Spell|XP|STR|DEX|CON|INT|WIS|CHA)/i.test(trimmed)) return
    const itemName = trimmed
    const category = catFromName(itemName)
    const nameLower = itemName.toLowerCase()
    let itemStats = null
    for (const [wKey, wStats] of Object.entries(weaponStatMap)) {
      if (nameLower.includes(wKey) || wKey.includes(nameLower)) { itemStats = wStats; break }
    }
    const baseKey = nameLower.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'item'
    let itemKey = baseKey
    let suffix = 0
    while (inventory[itemKey]) { suffix++; itemKey = baseKey + '_' + suffix }
    const entry = { name: itemName, amount: 1, category }
    if (itemStats) entry.stats = itemStats
    inventory[itemKey] = entry
  })

  return { name, cls, race, level, xp, rawMarkdown: text, maxHp, ac, proficiency, spellSaveDC, spellAttack, stats, spellSlots, abilities, spells, inventory }
}
