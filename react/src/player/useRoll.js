// Dice-roll hook. Performs a roll, records it to the shared dice log (visible on
// the DM screen) and to the character's roll history (capped at 8, live-synced).
//
// Note: the original used a 3D WebGL dice animation (dice-box). For Phase 2 the
// roll result + sync logic is implemented; the 3D physics animation is a Phase 5
// visual polish item (tracked in FEATURE-CHECKLIST.md).
import { useState, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { rollDice, fmtMod } from '../shared/helpers'

export function useRoll(charKey, charName) {
  const pushDiceLog = useGameStore((s) => s.pushDiceLog)
  const persistRollHistory = useGameStore((s) => s.persistRollHistory)
  const [result, setResult] = useState(null) // transient {label, total, suffix, breakdown}

  const roll = useCallback(
    ({ count = 1, sides = 20, modifier = 0, type }) => {
      const { rolls, total: raw } = rollDice(count, sides)
      const total = raw + modifier
      const isD20Single = count === 1 && sides === 20
      const isCrit = isD20Single && rolls[0] === 20
      const isFail = isD20Single && rolls[0] === 1
      const label = `${count}d${sides}${modifier ? fmtMod(modifier) : ''}`
      const suffix = isCrit ? ' CRIT!' : isFail ? ' FAIL' : ''
      const breakdown = `${rolls.map((r) => r).join(' + ')}${modifier ? ` ${fmtMod(modifier)}` : ''} = ${total}`

      const entry = { label, total, type, suffix, isTotalCrit: isCrit, isTotalFail: isFail }

      // 1) shared dice log (DM sees it)
      pushDiceLog({ character: charName, charKey, label, result: total, type, modifier })

      // 2) per-character roll history (cap 8, newest first)
      const history = useGameStore.getState().characters[charKey]?.rollHistory || []
      persistRollHistory(charKey, [entry, ...history].slice(0, 8))

      setResult({ label, total, suffix, breakdown, isCrit, isFail, type })
      return entry
    },
    [charKey, charName, pushDiceLog, persistRollHistory],
  )

  return { roll, result, clearResult: () => setResult(null) }
}
