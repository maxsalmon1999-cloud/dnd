import { useGameStore } from '../store/gameStore'

export default function DiceLog() {
  const log = useGameStore((s) => s.diceLog)
  // Firebase push keys sort chronologically; show newest first, cap 20.
  const entries = Object.entries(log || {})
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 20)
    .map(([id, e]) => ({ id, ...e }))

  const cls = (e) => {
    if (e.type?.includes('Check') || e.type?.includes('Save') || /d20/.test(e.label)) {
      if (e.result === 20 || /CRIT/.test(e.suffix || '')) return 'crit'
      if (e.result === 1 || /FAIL/.test(e.suffix || '')) return 'fail'
    }
    return ''
  }

  return (
    <div className="card">
      <strong style={{ color: '#c4a44e' }}>Player Dice Log</strong>
      {entries.length === 0 && <div className="muted" style={{ marginTop: 6 }}>No player rolls yet</div>}
      {entries.map((e) => (
        <div className="row spread" key={e.id} style={{ padding: '3px 0', fontSize: 12 }}>
          <span><strong>{(e.character || '').split(' ')[0]}</strong> <span className="muted">{e.type}</span></span>
          <strong className={cls(e)}>{e.result}</strong>
        </div>
      ))}
    </div>
  )
}
