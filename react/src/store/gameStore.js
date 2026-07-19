// ---------------------------------------------------------------------------
// The live game state, in React.
//
// This is the heart of the migration: one place that mirrors the Firebase
// database into React and writes changes back. Every screen reads from here, so
// the UI stays automatically in sync with whatever the DM, the players, or the
// AI change — which is the whole reason for moving to a framework.
//
// See DATA-MODEL.md for the exact shapes of each node.
// ---------------------------------------------------------------------------
import { create } from 'zustand'
import {
  ref,
  onValue,
  query,
  limitToLast,
  runTransaction,
  push,
  set as fbSet,
  update,
  remove,
  serverTimestamp,
} from 'firebase/database'
import { db } from '../firebase'

export const useGameStore = create((store, get) => ({
  // ---- live data (mirrors Firebase) ----
  sheets: {}, // characterSheets/{key} — static definitions
  characters: {}, // characters/{key} — live runtime state
  campaign: null, // campaign
  inventoryRequests: {}, // inventoryRequests/{charKey}/{id}
  goldRequests: {}, // goldRequests/{charKey}/{id}
  diceLog: {}, // diceLog/{id} — player rolls
  dmNotes: '', // dmNotes — the DM's live story-notes scratchpad
  loading: true,
  _unsubs: [],

  // Wire up all Firebase listeners. Call once when the app mounts.
  subscribe() {
    if (get()._unsubs.length) return // already subscribed
    const unsubs = [
      onValue(ref(db, 'characterSheets'), (s) => store({ sheets: s.val() || {} })),
      onValue(ref(db, 'characters'), (s) =>
        store({ characters: s.val() || {}, loading: false }),
      ),
      onValue(ref(db, 'campaign'), (s) => store({ campaign: s.val() || null })),
      onValue(ref(db, 'inventoryRequests'), (s) =>
        store({ inventoryRequests: s.val() || {} }),
      ),
      onValue(ref(db, 'goldRequests'), (s) => store({ goldRequests: s.val() || {} })),
      onValue(query(ref(db, 'diceLog'), limitToLast(50)), (s) => store({ diceLog: s.val() || {} })),
      onValue(ref(db, 'dmNotes'), (s) => store({ dmNotes: s.val() || '' })),
    ]
    store({ _unsubs: unsubs })
  },

  // Tear down listeners (e.g. on full app unmount).
  unsubscribe() {
    get()._unsubs.forEach((u) => u())
    store({ _unsubs: [] })
  },

  // ---- write helpers (foundational set; more added per phase) ----

  // HP change as a transaction, clamped to [0, maxHp]. Safe against races
  // between the DM and the player both editing at once.
  changeHp(key, delta) {
    const maxHp = get().characters[key]?.maxHp ?? 0
    return runTransaction(ref(db, `characters/${key}/hp`), (hp) => {
      const current = hp ?? maxHp
      return Math.max(0, Math.min(maxHp, current + delta))
    })
  },

  // Append a roll to the shared dice log (shows on the DM screen).
  pushDiceLog(entry) {
    return push(ref(db, 'diceLog'), { ...entry, timestamp: serverTimestamp() })
  },

  // Generic helpers used by later phases.
  writeCharacterField(key, field, value) {
    return fbSet(ref(db, `characters/${key}/${field}`), value)
  },
  updateCharacter(key, partial) {
    return update(ref(db, `characters/${key}`), partial)
  },
  removeAt(path) {
    return remove(ref(db, path))
  },
  setAt(path, value) {
    return fbSet(ref(db, path), value)
  },
  batchUpdate(updates) {
    return update(ref(db), updates)
  },

  // ---- player-screen write helpers ----

  // Active conditions: stored as characters/{key}/conditions/{Name_with_underscores} = true.
  setCondition(key, name, on) {
    const nodeKey = name.replace(/ /g, '_')
    const path = `characters/${key}/conditions/${nodeKey}`
    return on ? fbSet(ref(db, path), true) : remove(ref(db, path))
  },

  // Proficiency arrays (saving throws / skills). Stored as null when empty.
  setProficiencies(key, field, arr) {
    return fbSet(ref(db, `characters/${key}/${field}`), arr.length ? arr : null)
  },

  // Active ability "used" count.
  setAbilityUsed(key, abilityKey, used) {
    return fbSet(ref(db, `characters/${key}/abilities/${abilityKey}`), used)
  },

  // Spell-slot pip toggle. slotId is like "w_0" or "1_2".
  setSlotSpent(key, slotId, spent) {
    return fbSet(ref(db, `characters/${key}/slots/${slotId}`), spent)
  },

  // Notes (player calls this debounced).
  saveNotes(key, text) {
    return fbSet(ref(db, `characters/${key}/notes`), text || null)
  },

  // DM story notes — live scratchpad, persisted (DM calls this debounced).
  saveStoryNotes(text) {
    return fbSet(ref(db, 'dmNotes'), text || null)
  },

  // End of session: hard-save the current story notes under an immutable
  // session record, so each session's notes are preserved.
  endSession() {
    return push(ref(db, 'sessions'), {
      endedAt: serverTimestamp(),
      storyNotes: get().dmNotes || '',
    })
  },

  // Roll history (capped, newest first).
  persistRollHistory(key, entries) {
    return fbSet(ref(db, `characters/${key}/rollHistory`), entries)
  },

  // Inventory: add / remove items.
  addInventoryItem(key, item) {
    return push(ref(db, `characters/${key}/inventory`), item)
  },
  removeInventoryItem(key, itemKey) {
    // Also clear any pending requests for this item.
    const reqs = get().inventoryRequests[key] || {}
    Object.entries(reqs).forEach(([rid, r]) => {
      if (r.itemKey === itemKey) remove(ref(db, `inventoryRequests/${key}/${rid}`))
    })
    return remove(ref(db, `characters/${key}/inventory/${itemKey}`))
  },

  // Inventory quantity request (player -> DM). Accumulates onto an existing
  // pending request for the same item; removes it if the net delta hits 0.
  adjustInventoryRequest(key, item, itemKey, deltaStep) {
    const reqs = get().inventoryRequests[key] || {}
    const existing = Object.entries(reqs).find(([, r]) => r.itemKey === itemKey)
    if (existing) {
      const [rid, r] = existing
      const newDelta = (r.delta || 0) + deltaStep
      if (newDelta === 0) return remove(ref(db, `inventoryRequests/${key}/${rid}`))
      return update(ref(db, `inventoryRequests/${key}/${rid}`), { delta: newDelta })
    }
    return push(ref(db, `inventoryRequests/${key}`), {
      itemKey,
      itemName: item.name,
      currentAmount: item.amount ?? 1,
      delta: deltaStep,
      timestamp: serverTimestamp(),
    })
  },

  // Gold change request (player -> DM).
  requestGoldChange(key, charName, currentGold, delta) {
    return push(ref(db, `goldRequests/${key}`), {
      charKey: key,
      charName,
      currentGold: currentGold ?? 0,
      delta,
      timestamp: serverTimestamp(),
    })
  },

  // ---- DM-side approvals (resolve player requests) ----
  approveInventoryRequest(charKey, reqId) {
    const req = get().inventoryRequests[charKey]?.[reqId]
    if (!req) return
    const newAmount = Math.max(0, (req.currentAmount ?? 0) + (req.delta || 0))
    return fbSet(ref(db, `characters/${charKey}/inventory/${req.itemKey}/amount`), newAmount).then(() =>
      remove(ref(db, `inventoryRequests/${charKey}/${reqId}`)),
    )
  },
  rejectInventoryRequest(charKey, reqId) {
    return remove(ref(db, `inventoryRequests/${charKey}/${reqId}`))
  },
  approveGoldRequest(charKey, reqId) {
    const req = get().goldRequests[charKey]?.[reqId]
    if (!req) return
    const newGold = Math.max(0, (req.currentGold ?? 0) + (req.delta || 0))
    return fbSet(ref(db, `characters/${charKey}/gold`), newGold).then(() =>
      remove(ref(db, `goldRequests/${charKey}/${reqId}`)),
    )
  },
  rejectGoldRequest(charKey, reqId) {
    return remove(ref(db, `goldRequests/${charKey}/${reqId}`))
  },

  // Short/long rest: reset ability uses and spell slots across the party.
  // Short rest resets short-rest abilities + warlock (key 'w') slots; long rest resets all.
  doRest(type) {
    const { sheets } = get()
    const updates = {}
    Object.keys(sheets).forEach((key) => {
      const sheet = sheets[key]
      ;(sheet.abilities || []).filter((a) => !a.passive && a.key).forEach((a) => {
        if (type === 'long' || a.rest === 'Short') updates[`characters/${key}/abilities/${a.key}`] = 0
      })
      ;(sheet.spellSlots || []).forEach((slot) => {
        if (type === 'long' || slot.key === 'w') {
          for (let i = 0; i < slot.count; i++) updates[`characters/${key}/slots/${slot.key}_${i}`] = false
        }
      })
    })
    if (Object.keys(updates).length) return update(ref(db), updates)
  },
}))
