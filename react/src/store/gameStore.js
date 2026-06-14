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
}))
