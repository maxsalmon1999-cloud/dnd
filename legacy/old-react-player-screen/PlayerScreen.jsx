import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { Modal } from '../shared/ui'
import { useRoll } from './useRoll'
import { XP_THRESHOLDS } from '../data/gameData'
import StatsTab from './StatsTab'
import CharacterTab from './CharacterTab'
import DiceTab from './DiceTab'

export default function PlayerScreen({ charKey }) {
  const sheet = useGameStore((s) => s.sheets[charKey])
  const live = useGameStore((s) => s.characters[charKey]) || {}
  const navigate = useNavigate()
  const [tab, setTab] = useState('stats')
  const [showXp, setShowXp] = useState(false)
  const { roll, result, clearResult } = useRoll(charKey, sheet.name)

  const level = sheet.level || 1

  return (
    <div className="pl">
      <div className="pl-header">
        <button className="pl-close" onClick={() => navigate('/play')} title="Back">✝</button>
        <div style={{ flex: 1 }}>
          <div className="pl-title" onClick={() => setShowXp(true)}>{sheet.name}</div>
          <span className="pl-sub" onClick={() => setShowXp(true)}>
            {sheet.cls} · Level {level}
          </span>
        </div>
      </div>

      <div className="tabbar">
        <button className={tab === 'stats' ? 'active' : ''} onClick={() => setTab('stats')}>⚔ Stats</button>
        <button className={tab === 'character' ? 'active' : ''} onClick={() => setTab('character')}>⊞ Character</button>
        <button className={tab === 'dice' ? 'active' : ''} onClick={() => setTab('dice')}>☴ Dice</button>
      </div>

      <div className="panels">
        <div className={`panel ${tab === 'stats' ? 'active' : ''}`}>
          <h3 className="desktop-title">⚔ Stats</h3>
          <StatsTab charKey={charKey} sheet={sheet} live={live} roll={roll} />
        </div>
        <div className={`panel ${tab === 'character' ? 'active' : ''}`}>
          <h3 className="desktop-title">⊞ Character</h3>
          <CharacterTab charKey={charKey} sheet={sheet} live={live} roll={roll} />
        </div>
        <div className={`panel ${tab === 'dice' ? 'active' : ''}`}>
          <h3 className="desktop-title">☴ Dice</h3>
          <DiceTab charKey={charKey} sheet={sheet} live={live} roll={roll} />
        </div>
      </div>

      {result && <RollToast result={result} onDone={clearResult} />}
      {showXp && <XpModal sheet={sheet} level={level} onClose={() => setShowXp(false)} />}
    </div>
  )
}

// Transient banner showing the most recent roll result.
function RollToast({ result, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500)
    return () => clearTimeout(t)
  }, [result, onDone])
  return (
    <div
      className="modal"
      style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 70, textAlign: 'center', padding: '12px 20px' }}
    >
      <div className="muted" style={{ fontSize: 12 }}>{result.type}</div>
      <div style={{ fontSize: 28, fontWeight: 'bold' }} className={result.isCrit ? 'crit' : result.isFail ? 'fail' : ''}>
        {result.total}{result.suffix}
      </div>
      <div className="muted" style={{ fontSize: 12 }}>{result.breakdown}</div>
    </div>
  )
}

function XpModal({ sheet, level, onClose }) {
  const xp = parseInt(String(sheet.xp ?? '').replace(/,/g, ''), 10)
  const hasXp = !Number.isNaN(xp)
  const cur = XP_THRESHOLDS[level - 1] ?? 0
  const next = XP_THRESHOLDS[level] ?? null
  let bar = 0
  let note = ''
  if (hasXp) {
    if (level >= 20 || next == null) {
      bar = 1
      note = 'Max level reached'
    } else {
      bar = Math.max(0, Math.min(1, (xp - cur) / (next - cur)))
      note = `${next - xp} XP to level ${level + 1}`
    }
  }
  return (
    <Modal onClose={onClose}>
      <h2>Level {level}</h2>
      {!hasXp ? (
        <p className="muted" style={{ marginTop: 8 }}>XP not recorded for this character.</p>
      ) : (
        <>
          <p style={{ margin: '8px 0' }}>
            XP: {xp.toLocaleString()}{next != null ? ` / ${next.toLocaleString()}` : ''}
          </p>
          <div className="hp-bar-track"><div className="hp-bar-fill" style={{ width: `${bar * 100}%` }} /></div>
          <p className="muted" style={{ marginTop: 8 }}>{note}</p>
        </>
      )}
      <button className="btn" style={{ marginTop: 12 }} onClick={onClose}>Close</button>
    </Modal>
  )
}
