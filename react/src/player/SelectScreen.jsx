import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { classIcon } from './helpers'

export default function SelectScreen() {
  const sheets = useGameStore((s) => s.sheets)
  const navigate = useNavigate()
  const keys = Object.keys(sheets)

  return (
    <div className="pl">
      <h1 style={{ textAlign: 'center' }}>⚔ Choose Your Character ⚔</h1>
      <p className="muted" style={{ textAlign: 'center' }}>Tap your character to open your screen</p>

      {keys.length === 0 ? (
        <p className="muted" style={{ textAlign: 'center', marginTop: 20 }}>
          No characters configured. Use DM Setup to add character sheets.
        </p>
      ) : (
        <div className="select-grid">
          {keys.map((key) => {
            const c = sheets[key]
            return (
              <button
                key={key}
                className="select-card"
                onClick={() => navigate(`/play?char=${key}`)}
              >
                <div>
                  <div className="select-name">
                    {classIcon(c.cls)} {c.name}
                  </div>
                  <div className="select-class">{c.cls}</div>
                </div>
                <span style={{ color: '#c4a44e' }}>▶</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
