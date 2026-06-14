// DM screen. Core session loop built on the shared store. Remaining DM features
// (game-setup modal, dice automation, undo/redo, session end, music/timer) are
// later Phase 3 chunks — see MIGRATION-PLAN.md.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import CharacterSidebar from './CharacterSidebar'
import Storyboard from './Storyboard'
import RequestQueues from './RequestQueues'
import DiceLog from './DiceLog'
import RestButtons from './RestButtons'
import SetupModal from './SetupModal'
import { MetaPanel, NotesPanel } from './SidePanels'
import '../player/player.css'
import './dm.css'

export default function DmApp() {
  const subscribe = useGameStore((s) => s.subscribe)
  const loading = useGameStore((s) => s.loading)
  const campaign = useGameStore((s) => s.campaign)
  const [showSetup, setShowSetup] = useState(false)

  useEffect(() => {
    subscribe()
  }, [subscribe])

  if (loading) return <div className="pl"><p>Loading game…</p></div>

  return (
    <div className="pl dm">
      <div className="dm-top">
        <span className="dm-campaign">{campaign?.meta?.name || 'No campaign loaded'}</span>
        <button className="btn" onClick={() => setShowSetup(true)}>⚙ Setup</button>
        <RestButtons />
        <Link to="/" className="btn" style={{ textDecoration: 'none' }}>← home</Link>
      </div>

      <div className="dm-grid">
        <div>
          <CharacterSidebar />
          <DiceLog />
        </div>
        <Storyboard />
        <div>
          <RequestQueues />
          <MetaPanel />
          <NotesPanel />
        </div>
      </div>

      {showSetup && <SetupModal onClose={() => setShowSetup(false)} />}
    </div>
  )
}
