// Live functional children dropped into the (class-based) refreshed DM screen.
// Kept here so the verbatim DMScreen prototype stays mostly untouched.
import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import {
  useSpotify, initSpotify, connectSpotify, playMood,
  togglePlay, nextTrack, prevTrack, setVolume, MOOD_PLAYLISTS,
} from '../dm/spotify'

const FIELD = {
  background: 'var(--surface-slot)', boxShadow: 'var(--frame-slot)',
  border: '2px solid var(--ink-900)', borderRadius: 'var(--radius-sm)',
  color: 'var(--text-body)', fontFamily: 'var(--font-ui)', outline: 'none',
}

// ---- Story Notes: live, persisted, debounced to Firebase (dmNotes) ----
export function StoryNotes() {
  const live = useGameStore((s) => s.dmNotes)
  const save = useGameStore((s) => s.saveStoryNotes)
  const [text, setText] = useState(live)
  const dirty = useRef(false)
  const timer = useRef(null)

  // adopt the live value when it changes and the DM isn't mid-edit
  useEffect(() => { if (!dirty.current) setText(live) }, [live])
  useEffect(() => () => clearTimeout(timer.current), [])

  const onChange = (e) => {
    const v = e.target.value
    setText(v)
    dirty.current = true
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { save(v); dirty.current = false }, 600)
  }
  return (
    <div style={{ padding: '0 12px 12px' }}>
      <textarea value={text} onChange={onChange} rows={5}
        placeholder="Living campaign notes — saved automatically, archived on End Session."
        style={{ width: '100%', resize: 'vertical', ...FIELD, fontSize: '14px', lineHeight: 1.5, padding: '10px 12px' }} />
    </div>
  )
}

// ---- Music: live Spotify (same integration as the previous DM screen) ----
const moodBtn = (active) => ({
  fontFamily: 'var(--font-ui)', fontSize: '12px', padding: '5px 10px', cursor: 'pointer',
  borderRadius: 'var(--radius-sm)', background: 'var(--surface-slot)',
  border: `2px solid ${active ? 'var(--brass-600)' : 'var(--ink-900)'}`,
  color: active ? 'var(--brass-200)' : 'var(--text-body)',
})
const ctrlBtn = {
  fontFamily: 'var(--font-ui)', fontSize: '14px', padding: '5px 12px', cursor: 'pointer',
  borderRadius: 'var(--radius-sm)', background: 'var(--surface-slot)',
  border: '2px solid var(--ink-900)', color: 'var(--text-gold)',
}

export function SpotifyMusic() {
  const { connected, ready, nowPlaying, paused, activeMood } = useSpotify()
  useEffect(() => { initSpotify() }, [])

  return (
    <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {!connected && (
        <button style={ctrlBtn} onClick={connectSpotify}>Connect Spotify</button>
      )}
      {connected && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {Object.keys(MOOD_PLAYLISTS).map((mood) => (
              <button key={mood} style={moodBtn(activeMood === mood)} onClick={() => playMood(mood)}>{mood}</button>
            ))}
          </div>
          {ready && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button style={ctrlBtn} onClick={prevTrack}>⏮</button>
              <button style={ctrlBtn} onClick={togglePlay}>{paused ? '▶' : '⏸'}</button>
              <button style={ctrlBtn} onClick={nextTrack}>⏭</button>
              <input type="range" min={0} max={100} defaultValue={50}
                onChange={(e) => setVolume(+e.target.value)} style={{ flex: 1 }} />
            </div>
          )}
          <div style={{ fontSize: '13px', color: 'var(--text-faint)' }}>{nowPlaying || 'Connecting…'}</div>
        </>
      )}
    </div>
  )
}

// ---- Whispers: live private player<->DM messaging (whispers/{charKey}) ----
const bubbleOut = {
  background: 'var(--ink-600)', border: '2px solid var(--brass-600)', boxShadow: 'var(--frame-slot)',
  borderRadius: 'var(--radius-sm)', padding: '8px 11px', maxWidth: '88%', color: 'var(--text-strong)', fontSize: '14px', lineHeight: 1.45,
}
const bubbleIn = {
  background: 'var(--surface-slot)', borderLeft: '3px solid var(--brass-300)', boxShadow: 'var(--frame-slot)',
  borderRadius: 'var(--radius-sm)', padding: '8px 11px', maxWidth: '88%', color: 'var(--text-body)', fontSize: '14px', lineHeight: 1.45,
}
const pill = (sel, waiting) => ({
  fontFamily: 'var(--font-ui)', fontSize: '12px', padding: '5px 10px', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
  background: sel ? 'var(--brass-600)' : 'var(--surface-slot)',
  color: sel ? 'var(--ink-900)' : 'var(--text-body)',
  border: `2px solid ${sel ? 'var(--brass-600)' : waiting ? 'var(--brass-300)' : 'var(--ink-900)'}`,
})

// newest-last thread array from a whispers/{charKey} node (push keys sort by time)
const threadOf = (node) => Object.entries(node || {})
  .sort(([a], [b]) => (a < b ? -1 : 1))
  .map(([id, w]) => ({ id, ...w }))

export function Whispers() {
  const whispers = useGameStore((s) => s.whispers)
  const sheets = useGameStore((s) => s.sheets)
  const characters = useGameStore((s) => s.characters)
  const send = useGameStore((s) => s.sendWhisper)

  // Player roster — prefer character sheets (they carry names); fall back to live state.
  const roster = Object.keys(sheets || {}).length ? sheets : (characters || {})
  const keys = Object.keys(roster)
  const firstName = (k) => String(roster[k]?.name || k).split(' ')[0]

  const [sel, setSel] = useState('')
  const [draft, setDraft] = useState('')
  const scrollRef = useRef(null)

  // Effective selection: the clicked player, or the first once the roster loads.
  const to = keys.includes(sel) ? sel : (keys[0] || '')

  const thread = threadOf(whispers?.[to])
  const toName = to ? firstName(to) : ''
  const waiting = (k) => {
    const t = threadOf(whispers?.[k])
    return t.length > 0 && t[t.length - 1].from === 'player'
  }

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [thread.length, to])

  const sendIt = () => {
    const t = draft.trim()
    if (!t || !to) return
    send(to, 'dm', t)
    setDraft('')
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {keys.length === 0
          ? <span style={{ fontSize: '13px', color: 'var(--text-faint)' }}>No characters loaded.</span>
          : keys.map((k) => (
              <button key={k} onClick={() => setSel(k)} style={pill(to === k, waiting(k))}>
                {firstName(k)}{waiting(k) ? ' •' : ''}
              </button>
            ))}
      </div>

      <div ref={scrollRef} className="om-scroll" style={{ maxHeight: '210px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', padding: '2px' }}>
        {thread.length > 0
          ? thread.map((w) => {
              const out = w.from === 'dm'
              return (
                <div key={w.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: out ? 'flex-end' : 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-label)', fontSize: '8px', letterSpacing: 'var(--ls-label)', textTransform: 'uppercase', color: 'var(--text-faint)' }}>{out ? `You → ${toName}` : toName}</span>
                  <div style={out ? bubbleOut : bubbleIn}>{w.text}</div>
                </div>
              )
            })
          : (to ? null : <span style={{ fontSize: '13px', color: 'var(--text-faint)', lineHeight: 1.5 }}>Select a character to whisper.</span>)}
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendIt() } }}
          placeholder={to ? `Whisper to ${toName}…` : 'Whisper…'} disabled={!to}
          style={{ flex: 1, minWidth: 0, height: '32px', ...FIELD, fontSize: '13px', padding: '0 10px' }} />
        <button onClick={sendIt} disabled={!to || !draft.trim()} style={ctrlBtn}>Send</button>
      </div>
    </div>
  )
}
