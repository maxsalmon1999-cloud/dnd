import { useState, useRef, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { Section } from '../shared/ui'

export default function DiceTab({ charKey, live, roll }) {
  return (
    <>
      <ManualRoller roll={roll} />
      <Notes charKey={charKey} live={live} />
      <RollHistory charKey={charKey} live={live} />
    </>
  )
}

function ManualRoller({ roll }) {
  const [count, setCount] = useState(1)
  const [sides, setSides] = useState(20)
  return (
    <div className="card">
      <strong style={{ color: '#c4a44e' }}>☴ Manual Roller</strong>
      <div className="row" style={{ gap: 6, marginTop: 8 }}>
        <select className="input" value={count} onChange={(e) => setCount(+e.target.value)}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 20].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select className="input" value={sides} onChange={(e) => setSides(+e.target.value)}>
          {[4, 6, 8, 10, 12, 20, 100].map((n) => <option key={n} value={n}>d{n}</option>)}
        </select>
        <button className="btn" onClick={() => roll({ count, sides, type: 'Manual Roll' })}>Roll</button>
      </div>
    </div>
  )
}

function Notes({ charKey, live }) {
  const saveNotes = useGameStore((s) => s.saveNotes)
  const [text, setText] = useState(live.notes || '')
  const focused = useRef(false)
  const timer = useRef(null)

  // Live update from Firebase, but only when the user isn't typing.
  useEffect(() => {
    if (!focused.current) setText(live.notes || '')
  }, [live.notes])

  const onChange = (v) => {
    setText(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => saveNotes(charKey, v), 800) // debounce
  }

  return (
    <Section title="✎ Notes">
      <textarea
        className="input"
        style={{ width: '100%', minHeight: 120 }}
        placeholder="Track clues, names, plans…"
        value={text}
        onFocus={() => (focused.current = true)}
        onBlur={() => (focused.current = false)}
        onChange={(e) => onChange(e.target.value)}
      />
    </Section>
  )
}

function RollHistory({ charKey, live }) {
  const persist = useGameStore((s) => s.persistRollHistory)
  const history = live.rollHistory || []
  if (!history.length) return null
  return (
    <div className="card">
      <div className="row spread">
        <strong style={{ color: '#c4a44e' }}>✦ History</strong>
        <button className="btn" onClick={() => persist(charKey, [])}>clear</button>
      </div>
      {history.map((h, i) => (
        <div className="row spread" key={i} style={{ padding: '3px 0' }}>
          <span className="muted" style={{ fontSize: 11 }}>{h.type} · {h.label}</span>
          <strong className={h.isTotalCrit ? 'crit' : h.isTotalFail ? 'fail' : ''}>{h.total}{h.suffix}</strong>
        </div>
      ))}
    </div>
  )
}
