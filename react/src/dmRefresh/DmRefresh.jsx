// Live-data wrapper for the refreshed DM screen ("Book of the Raven").
// TRIAL: only the character-sheet tracker (the Party panel) is wired to live
// Firebase — the party roster and the HP +/- stepper. Everything else on the
// screen is still the prototype's mock data, to be wired feature-by-feature.
import { useEffect } from 'react'
import DMScreen from './DMScreen'
import { adaptDmParty } from './dmParty'
import { useGameStore } from '../store/gameStore'

// Map the live diceLog map → the DM screen's { char, f, r } row shape,
// newest first (Firebase push keys sort chronologically).
function adaptDiceLog(diceLog) {
  return Object.entries(diceLog || {})
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 30)
    .map(([, e]) => ({
      char: e.character || '—',
      f: [e.label, e.type].filter(Boolean).join(' '),
      r: e.result,
    }))
}

export default function DmRefresh() {
  const subscribe = useGameStore((s) => s.subscribe)
  useEffect(() => { subscribe() }, [subscribe])
  const sheets = useGameStore((s) => s.sheets)
  const characters = useGameStore((s) => s.characters)
  const diceLog = useGameStore((s) => s.diceLog)
  const changeHp = useGameStore((s) => s.changeHp)
  const endSession = useGameStore((s) => s.endSession)

  const keys = Object.keys(sheets || {})
  // Until the sheets load, let the prototype show its own mock party.
  const liveCharacters = keys.length ? adaptDmParty(sheets, characters) : undefined

  return (
    <DMScreen
      liveCharacters={liveCharacters}
      liveDiceLog={adaptDiceLog(diceLog)}
      onAdjustHp={(id, delta) => changeHp(id, delta)}
      onEndSession={() => endSession()}
    />
  )
}
