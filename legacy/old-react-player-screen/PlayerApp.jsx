// Player entry point. Shows the character-select screen when there's no ?char=
// param, otherwise the full player screen for that character.
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import SelectScreen from './SelectScreen'
import PlayerScreen from './PlayerScreen'
import { installClickSounds } from '../lib/sounds'
import '../shared/styles.css'

export default function PlayerApp() {
  const [params] = useSearchParams()
  const charKey = (params.get('char') || '').toLowerCase()
  const subscribe = useGameStore((s) => s.subscribe)
  const loading = useGameStore((s) => s.loading)
  const sheets = useGameStore((s) => s.sheets)

  useEffect(() => {
    subscribe()
    installClickSounds()
  }, [subscribe])

  if (loading) return <div className="pl"><p>Loading…</p></div>

  if (charKey && sheets[charKey]) {
    return <PlayerScreen charKey={charKey} />
  }
  return <SelectScreen />
}
