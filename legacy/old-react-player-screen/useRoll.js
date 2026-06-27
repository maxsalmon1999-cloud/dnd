// Dice-roll hook. Animates a 3D physics roll, uses the settled die values, then
// records the roll to the shared dice log (visible on the DM screen) and to the
// character's roll history (capped at 8, live-synced).
import { useState, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { rollDice, fmtMod } from '../shared/helpers'
import { rollDiceBox } from '../lib/dicebox'

export function useRoll(charKey, charName) {
  const pushDiceLog = useGameStore((s) => s.pushDiceLog)
  const persistRollHistory = useGameStore((s) => s.persistRollHistory)
  const [result, setResult] = useState(null) // transient {label, total, suffix, breakdown}
  const [rolling, setRolling] = useState(false)

  const roll = useCallback(
    async ({ count = 1, sides = 20, modifier = 0, type }) => {
      const notation = `${count}d${sides}`

      // Animate the 3D dice and use their settled values; fall back to a plain
      // RNG roll if the dice box fails to load.
      let rolls
      setRolling(true)
      try {
        rolls = await rollDiceBox(notation)
        if (!rolls || rolls.length !== count) rolls = rollDice(count, sides).rolls
      } catch {
        rolls = rollDice(count, sides).rolls
      } finally {
        setRolling(false)
      }

      const raw = rolls.reduce((a, b) => a + b, 0)
      const total = raw + modifier
      const isD20Single = count === 1 && sides === 20
      const isCrit = isD20Single && rolls[0] === 20
      const isFail = isD20Single && rolls[0] === 1
      const label = `${count}d${sides}${modifier ? fmtMod(modifier) : ''}`
      const suffix = isCrit ? ' CRIT!' : isFail ? ' FAIL' : ''
      const breakdown = `${rolls.join(' + ')}${modifier ? ` ${fmtMod(modifier)}` : ''} = ${total}`

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

  return { roll, result, rolling, clearResult: () => setResult(null) }
}
