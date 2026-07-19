// Player-side private messaging to the DM. A ✉ button that opens a bottom-sheet
// thread; reads/writes the shared whispers/{charKey} node via the game store, so
// messages sync live with the DM screen in both directions.
import { useState, useRef, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

// newest-last thread from a whispers/{charKey} node (push keys sort by time)
const threadOf = (node) => Object.entries(node || {})
  .sort(([a], [b]) => (a < b ? -1 : 1))
  .map(([id, w]) => ({ id, ...w }))

export default function PlayerWhisper({ charKey }) {
  const node = useGameStore((s) => s.whispers?.[charKey])
  const send = useGameStore((s) => s.sendWhisper)
  const thread = threadOf(node)

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [seen, setSeen] = useState(() => {
    try { return localStorage.getItem(`${charKey}_whisper_seen`) || '' } catch { return '' }
  })
  const scrollRef = useRef(null)

  const last = thread[thread.length - 1]
  const lastId = last ? last.id : ''
  const unread = !!last && last.from === 'dm' && lastId !== seen

  // Mark the newest message seen (clears the unread dot + persists across reloads).
  const markSeen = (id) => {
    if (!id) return
    setSeen(id)
    try { localStorage.setItem(`${charKey}_whisper_seen`, id) } catch { /* ignore */ }
  }
  const openSheet = () => { markSeen(lastId); setOpen(true) }
  const closeSheet = () => { markSeen(thread[thread.length - 1]?.id); setOpen(false) }

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
