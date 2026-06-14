// Shared helpers for the player screen.
import { clsIconMap } from '../data/gameData'

// Format an ability modifier as a signed string, e.g. 3 -> "+3", -1 -> "-1".
export const fmtMod = (n) => (n >= 0 ? `+${n}` : `${n}`)

// 5e proficiency bonus from level: ceil(level/4)+1.
export const profFromLevel = (level) => Math.ceil((level || 1) / 4) + 1

// Pick a class icon from a class string (e.g. "changeling warlock" -> ✧).
export function classIcon(cls) {
  const lower = (cls || '').toLowerCase()
  const found = Object.entries(clsIconMap).find(([k]) => lower.includes(k))
  return found ? found[1] : '⚔'
}

// Normalise an ability name for description lookup (strip parentheticals/dice).
export function normalizeName(name) {
  return (name || '').replace(/\s*\(.*?\)\s*/g, '').trim()
}

// Roll N dice of S sides; return { total, rolls }.
export function rollDice(count, sides) {
  const rolls = []
  for (let i = 0; i < count; i++) rolls.push(1 + Math.floor(Math.random() * sides))
  return { rolls, total: rolls.reduce((a, b) => a + b, 0) }
}

// A d20 check with a modifier; flags natural crit/fail.
export function rollD20(modifier = 0) {
  const raw = 1 + Math.floor(Math.random() * 20)
  const total = raw + modifier
  return {
    raw,
    total,
    isCrit: raw === 20,
    isFail: raw === 1,
    label: `d20${modifier ? fmtMod(modifier) : ''}`,
  }
}

// Spell-slot helpers. Slot definition: { count, key, label, shortLabel }.
// Numeric level is parsed from `key` (digit) or the label.
export function slotLevel(slot) {
  const fromKey = parseInt(slot.key, 10)
  if (!Number.isNaN(fromKey)) return fromKey
  const m = (slot.label || slot.shortLabel || '').match(/\d+/)
  return m ? parseInt(m[0], 10) : 1
}

// Build the per-pip slot id used in characters/{key}/slots, e.g. "w_0", "1_2".
export const slotPipId = (slot, idx) => `${slot.key}_${idx}`
