// Shared helpers for the live screens.

// Format an ability modifier as a signed string, e.g. 3 -> "+3", -1 -> "-1".
export const fmtMod = (n) => (n >= 0 ? `+${n}` : `${n}`)

// 5e proficiency bonus from level: ceil(level/4)+1.
export const profFromLevel = (level) => Math.ceil((level || 1) / 4) + 1

// Spell-slot helpers. Slot definition: { count, key, label, shortLabel }.
// Numeric level is parsed from `key` (digit) or the label.
export function slotLevel(slot) {
  const fromKey = parseInt(slot.key, 10)
  if (!Number.isNaN(fromKey)) return fromKey
  const m = (slot.label || slot.shortLabel || '').match(/\d+/)
  return m ? parseInt(m[0], 10) : 1
}

// A whispers/{charKey} node → newest-last thread array (push keys sort by time).
export const threadOf = (node) => Object.entries(node || {})
  .sort(([a], [b]) => (a < b ? -1 : 1))
  .map(([id, w]) => ({ id, ...w }))
