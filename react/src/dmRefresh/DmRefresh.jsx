// Live-data wrapper for the refreshed DM screen ("Book of the Raven").
// TRIAL: only the character-sheet tracker (the Party panel) is wired to live
// Firebase — the party roster and the HP +/- stepper. Everything else on the
// screen is still the prototype's mock data, to be wired feature-by-feature.
import { useEffect } from 'react'
import DMScreen from './DMScreen'
import { adaptDmParty } from './dmParty'
import { useGameStore } from '../store/gameStore'

export default function DmRefresh() {
  const subscribe = useGameStore((s) => s.subscribe)
  useEffect(() => { subscribe() }, [subscribe])
  const sheets = useGameStore((s) => s.sheets)
  const characters = useGameStore((s) => s.characters)
  const changeHp = useGameStore((s) => s.changeHp)

  const keys = Object.keys(sheets || {})
  // Until the sheets load, let the prototype show its own mock party.
  const liveCharacters = keys.length ? adaptDmParty(sheets, characters) : undefined

  return (
    <DMScreen
      liveCharacters={liveCharacters}
      onAdjustHp={(id, delta) => changeHp(id, delta)}
    />
  )
}
