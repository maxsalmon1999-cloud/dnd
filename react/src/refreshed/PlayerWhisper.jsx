// Player-side private messaging to the DM. A ✉ button that opens a bottom-sheet
// thread; reads/writes the shared whispers/{charKey} node via the game store, so
// messages sync live with the DM screen in both directions.
import { useState, useRef, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

// newest-last thread from a whispers/{charKey} node (push keys sort by time)
const threadOf = (node) => Object.entries(node || {})
  .sort(([a], [b]) => (a < b ? -1 : 1))
  .map(([id, w]) => ({ id, ...w }))

// Full-screen "shhhh…" alert when the DM whispers. Blocks until the player drags
// the knob to the far end (same slide mechanic as slide-to-delete elsewhere).
function ShushAlert({ onDismiss }) {
  const trackRef = useRef(null)
  const [x, setX] = useState(0)
  const [done, setDone] = useState(false)
  const KNOB = 46
  const move = (clientX) => {
    if (done || !trackRef.current) return
    const r = trackRef.current.getBoundingClientRect()
    const max = r.width - KNOB
    const nx = Math.max(0, Math.min(max, clientX - r.left - KNOB / 2))
    setX(nx)
    if (nx >= max - 2) { setDone(true); setX(max); onDismiss() }
  }
  return (
    <div className="shush-backdrop">
      <div className="shush">
        <div className="shush-emoji">🤫</div>
        <div className="shush-title">Shhhh…</div>
        <div className="shush-body">the DM sent you a message</div>
        <div className="shush-track" ref={trackRef} onPointerMove={(e) => { if (e.buttons === 1) move(e.clientX) }}>
          <span className="shush-hint">slide to dismiss →</span>
          <div className="shush-knob" style={{ left: x }}
            onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
            onPointerMove={(e) => move(e.clientX)}
            onPointerUp={() => { if (!done) setX(0) }}>›</div>
        </div>
      </div>
    </div>
  )
}

export default function PlayerWhisper({ charKey }) {
  const node = useGameStore((s) => s.whispers?.[charKey])
  const send = useGameStore((s) => s.sendWhisper)
  const thread = threadOf(node)

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [seen, setSeen] = useState(() => {
    try { return localStorage.getItem(`${charKey}_whisper_seen`) || '' } catch { return '' }
  })
  // Last DM message the "shhhh" alert has already been shown for (separate from
  // `seen`: dismissing the alert doesn't count as having read the message).
  const [notified, setNotified] = useState(() => {
    try { return localStorage.getItem(`${charKey}_whisper_notified`) || '' } catch { return '' }
  })
  const scrollRef = useRef(null)

  const last = thread[thread.length - 1]
  const lastId = last ? last.id : ''
  const fromDm = !!last && last.from === 'dm'
  const unread = fromDm && lastId !== seen
  // Fire the alert for a new DM whisper, unless the thread is already open.
  const showShush = fromDm && lastId !== notified && !open

  const persist = (key, id, setter) => {
    if (!id) return
    setter(id)
    try { localStorage.setItem(`${charKey}_${key}`, id) } catch { /* ignore */ }
  }
  const markSeen = (id) => persist('whisper_seen', id, setSeen)
  const markNotified = (id) => persist('whisper_notified', id, setNotified)
  const openSheet = () => { markSeen(lastId); markNotified(lastId); setOpen(true) }
  const closeSheet = () => { const id = thread[thread.length - 1]?.id; markSeen(id); markNotified(id); setOpen(false) }
  const dismissShush = () => markNotified(lastId)

  // Keep the thread pinned to the newest message.
  useEffect(() => {
    if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [open, thread.length])

  const sendIt = () => {
    const t = draft.trim()
    if (!t) return
    send(charKey, 'player', t)
    setDraft('')
  }

  return (
    <>
      <button className={`wmsg-open${unread ? ' unread' : ''}`} onClick={openSheet} aria-label="Message the DM">
        <span className="wmsg-ico">✉</span>
        <span>Message the DM</span>
        {unread && <span className="wmsg-dot" />}
      </button>

      {showShush && <ShushAlert onDismiss={dismissShush} />}

      {open && (
        <div className="wmsg-scrim" onClick={closeSheet}>
          <div className="wmsg-panel" onClick={(e) => e.stopPropagation()}>
            <div className="wmsg-head">
              <span>✉ MESSAGE THE DM</span>
              <button className="wmsg-x" onClick={closeSheet} aria-label="Close">✕</button>
            </div>
            <div className="wmsg-thread" ref={scrollRef}>
              {thread.length === 0
                ? <div className="wmsg-empty">No messages yet. Send the DM a private note.</div>
                : thread.map((w) => (
                    <div key={w.id} className={`wmsg-row ${w.from === 'player' ? 'me' : 'dm'}`}>
                      <span className="wmsg-who">{w.from === 'player' ? 'You' : 'DM'}</span>
                      <div className="wmsg-bubble">{w.text}</div>
                    </div>
                  ))}
            </div>
            <div className="wmsg-input">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendIt() } }}
                placeholder="Message the DM…"
                autoFocus
              />
              <button onClick={sendIt} disabled={!draft.trim()}>Send</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
