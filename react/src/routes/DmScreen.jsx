import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

// Phase 1 proof of the live data layer. The full DM screen is built in Phase 3.
// This renders the real roster pulled through the Zustand store + Firebase, with
// working HP controls (transaction-backed) to prove read AND write live-sync.
export default function DmScreen() {
  const subscribe = useGameStore((s) => s.subscribe)
  const loading = useGameStore((s) => s.loading)
  const sheets = useGameStore((s) => s.sheets)
  const characters = useGameStore((s) => s.characters)
  const changeHp = useGameStore((s) => s.changeHp)

  useEffect(() => {
    subscribe()
  }, [subscribe])

  const keys = Object.keys(sheets)

  return (
    <div style={{ padding: '40px 20px', maxWidth: 640, margin: '0 auto' }}>
      <h2 style={{ color: '#c4a44e' }}>DM screen</h2>
      <p style={{ opacity: 0.6, marginBottom: 24 }}>
        Phase 1 — live data layer proof (full screen built in Phase 3).
      </p>

      {loading && <p>Loading live game state…</p>}
      {!loading && keys.length === 0 && <p>No characters found.</p>}

      {keys.map((key) => {
        const sheet = sheets[key]
        const live = characters[key] || {}
        const hp = live.hp ?? sheet.maxHp
        const maxHp = live.maxHp ?? sheet.maxHp
        return (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              border: '1px solid #4a2030',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 8,
              background: 'rgba(20,14,18,0.6)',
            }}
          >
            <strong style={{ flex: 1 }}>{sheet.name}</strong>
            <span style={{ opacity: 0.7 }}>{sheet.cls}</span>
            <button onClick={() => changeHp(key, -1)} style={hpBtn}>
              −
            </button>
            <span style={{ width: 70, textAlign: 'center' }}>
              {hp} / {maxHp} HP
            </span>
            <button onClick={() => changeHp(key, +1)} style={hpBtn}>
              +
            </button>
          </div>
        )
      })}

      <p style={{ marginTop: 24 }}>
        <Link to="/">← back</Link>
      </p>
    </div>
  )
}

const hpBtn = {
  width: 28,
  height: 28,
  border: '1px solid #4a2030',
  borderRadius: 6,
  background: 'linear-gradient(180deg,#1a1018,#120c10)',
  color: '#c4a44e',
  cursor: 'pointer',
  fontWeight: 'bold',
}
