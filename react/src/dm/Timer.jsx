import { useState, useRef, useEffect } from 'react'
import { playWarHorn } from '../lib/sounds'

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const PRESETS = [30, 60, 120, 300]

export default function Timer() {
  const [seconds, setSeconds] = useState(0) // configured duration
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)
  const [custom, setCustom] = useState('')
  const intervalRef = useRef(null)

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const set = (secs) => {
    clearInterval(intervalRef.current)
    setSeconds(secs)
    setRemaining(secs)
    setRunning(false)
  }

  const setCustomTimer = () => {
    let secs
    if (custom.includes(':')) {
      const [m, s] = custom.split(':')
      secs = (parseInt(m) || 0) * 60 + (parseInt(s) || 0)
    } else secs = parseInt(custom) || 0
    if (secs > 0) set(secs)
  }

  const start = () => {
    let r = remaining <= 0 && seconds > 0 ? seconds : remaining
    if (r <= 0) return
    setRemaining(r)
    setRunning(true)
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1
        if (next <= 0) {
          clearInterval(intervalRef.current)
          setRunning(false)
          playWarHorn()
          return 0
        }
        return next
      })
    }, 1000)
  }

  const pause = () => {
    clearInterval(intervalRef.current)
    setRunning(false)
  }

  const reset = () => {
    clearInterval(intervalRef.current)
    setRemaining(seconds)
    setRunning(false)
  }

  const warning = remaining <= 10 && remaining > 0
  const done = remaining === 0 && seconds > 0 && !running

  return (
    <div className="card">
      <strong style={{ color: '#c4a44e' }}>⏱ Timer</strong>
      <div style={{ textAlign: 'center', fontSize: 30, fontWeight: 'bold', margin: '6px 0', color: warning ? '#d68a2e' : done ? '#c0392b' : '#c4a44e' }}>
        {fmt(Math.max(0, remaining))}
      </div>
      <div className="row" style={{ gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
        {PRESETS.map((p) => <button key={p} className="btn" onClick={() => set(p)}>{fmt(p)}</button>)}
      </div>
      <div className="row" style={{ gap: 4, marginTop: 6 }}>
        <input className="input" style={{ width: 60 }} placeholder="m:ss" value={custom}
          onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setCustomTimer()} />
        <button className="btn" onClick={setCustomTimer}>Set</button>
        <button className="btn" onClick={running ? pause : start}>{running ? 'Pause' : 'Start'}</button>
        <button className="btn" onClick={reset}>Reset</button>
      </div>
    </div>
  )
}
