// Live functional children dropped into the (class-based) refreshed DM screen.
// Kept here so the verbatim DMScreen prototype stays mostly untouched.
import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { fmtMod } from '../shared/helpers'
import { rollDmDice } from './dmDice'
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

// ---- Requests: live inventory + gold requests with approve/deny ----
// Flatten {charKey: {reqId: req}} into rows, oldest first.
export function flattenRequests(byChar) {
  const out = []
  Object.entries(byChar || {}).forEach(([charKey, reqs]) => {
    Object.entries(reqs || {}).forEach(([reqId, req]) => out.push({ charKey, reqId, ...req }))
  })
  return out.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
}

const reqBadge = (kind) => ({
  display: 'inline-flex', alignItems: 'center', height: '20px', padding: '0 8px',
  fontFamily: 'var(--font-label)', fontSize: '9px', letterSpacing: 'var(--ls-label)',
  textTransform: 'uppercase', borderRadius: 'var(--radius-sm)', lineHeight: 1,
  background: kind === 'gold' ? 'var(--c-brass)' : 'var(--c-arcane)',
  color: kind === 'gold' ? 'var(--ink-900)' : 'var(--ink-100)',
})
const reqBtn = (danger) => ({
  fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: 'var(--ls-label)',
  textTransform: 'uppercase', padding: '6px 12px', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
  background: danger ? 'var(--c-blood)' : 'var(--c-brass)',
  color: danger ? 'var(--ink-100)' : 'var(--ink-900)',
  border: `2px solid ${danger ? '#C8254C' : 'var(--brass-200)'}`, boxShadow: 'var(--shadow-pixel)',
})

export function RequestsPanel() {
  const sheets = useGameStore((s) => s.sheets)
  const invReqs = flattenRequests(useGameStore((s) => s.inventoryRequests))
  const goldReqs = flattenRequests(useGameStore((s) => s.goldRequests))
  const approveInv = useGameStore((s) => s.approveInventoryRequest)
  const rejectInv = useGameStore((s) => s.rejectInventoryRequest)
  const approveGold = useGameStore((s) => s.approveGoldRequest)
  const rejectGold = useGameStore((s) => s.rejectGoldRequest)
  const firstName = (k) => String(sheets?.[k]?.name || k).split(' ')[0]

  const rows = [
    ...invReqs.map((r) => ({
      ...r, kind: 'item',
      label: `${r.itemName} ${fmtMod(r.delta)} (has ${r.currentAmount ?? 0})`,
      approve: () => approveInv(r.charKey, r.reqId), deny: () => rejectInv(r.charKey, r.reqId),
    })),
    ...goldReqs.map((r) => ({
      ...r, kind: 'gold',
      label: `${r.currentGold ?? 0} gp ${fmtMod(r.delta)} → ${Math.max(0, (r.currentGold || 0) + (r.delta || 0))} gp`,
      approve: () => approveGold(r.charKey, r.reqId), deny: () => rejectGold(r.charKey, r.reqId),
    })),
  ]

  if (rows.length === 0) return null
  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {rows.map((r) => (
        <div key={r.kind + r.reqId} style={{
          background: 'var(--surface-slot)', boxShadow: 'var(--frame-slot)', border: '2px solid var(--ink-900)',
          borderRadius: 'var(--radius-sm)', padding: '11px 12px', display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={reqBadge(r.kind)}>{r.kind}</span>
            <span style={{ fontFamily: 'var(--font-name)', fontWeight: 700, fontSize: '15px', color: 'var(--text-strong)' }}>{firstName(r.charKey)}</span>
          </div>
          <span style={{ fontSize: '14px', color: 'var(--text-body)' }}>{r.label}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={reqBtn(false)} onClick={r.approve}>Approve</button>
            <button style={reqBtn(true)} onClick={r.deny}>Deny</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---- Dice Roller: DM rolls with the same 3D dice as the player screen ----
const DM_DICE = [
  { label: 'd4',  sides: 4,   poly: '12,3 21,20 3,20' },
  { label: 'd6',  sides: 6,   poly: '4.5,4.5 19.5,4.5 19.5,19.5 4.5,19.5' },
  { label: 'd8',  sides: 8,   poly: '12,2 21,12 12,22 3,12' },
  { label: 'd10', sides: 10,  poly: '12,2 19,10 12,22 5,10' },
  { label: 'd12', sides: 12,  poly: '12,2.5 20.5,9 17,20.5 7,20.5 3.5,9' },
  { label: 'd20', sides: 20,  poly: '6,4.5 18,4.5 22,12 18,19.5 6,19.5 2,12' },
  { label: 'd%',  sides: 100, poly: '12,2 20,7 20,17 12,22 4,17 4,7' },
]
const dieBtn = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
  padding: '7px 6px', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
  background: 'var(--surface-slot)', border: '2px solid var(--ink-900)', boxShadow: 'var(--frame-slot)',
  color: 'var(--text-gold)', flex: '1 1 0', minWidth: 0,
}
const stepBtn = {
  width: '32px', height: '32px', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
  background: 'var(--surface-slot)', border: '2px solid var(--ink-900)', color: 'var(--text-gold)',
  fontFamily: 'var(--font-mono)', fontSize: '15px', lineHeight: 1,
}

export function DiceRoller() {
  const [count, setCount] = useState(1)
  const [last, setLast] = useState(null) // {label, values, total, rolling}

  const roll = async (die) => {
    const n = Math.max(1, Math.min(12, count))
    const label = `${n}${die.label === 'd%' ? 'd100' : die.label}`
    setLast({ label, rolling: true })
    let values
    try {
      values = await rollDmDice(`${n}d${die.sides}`)
    } catch {
      values = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * die.sides))
    }
    const total = values.reduce((a, b) => a + b, 0)
    setLast({ label, values, total, rolling: false })
    // Log to the shared dice log so DM rolls show alongside player rolls.
    try {
      useGameStore.getState().pushDiceLog({ character: 'DM', charKey: 'dm', label, result: total, type: 'DM Roll' })
    } catch { /* ignore */ }
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontFamily: 'var(--font-label)', fontSize: '9px', letterSpacing: 'var(--ls-label)', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Number of dice</span>
        <div style={{ flex: 1 }} />
        <button style={stepBtn} onClick={() => setCount((c) => Math.max(1, c - 1))}>−</button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--brass-200)', minWidth: '26px', textAlign: 'center' }}>{count}</span>
        <button style={stepBtn} onClick={() => setCount((c) => Math.min(12, c + 1))}>+</button>
      </div>
      <div style={{ display: 'flex', gap: '5px' }}>
        {DM_DICE.map((d) => (
          <button key={d.label} style={dieBtn} onClick={() => roll(d)} title={`Roll ${count}${d.label}`}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
              <polygon points={d.poly} />
            </svg>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: '8px', letterSpacing: '0.06em' }}>{d.label}</span>
          </button>
        ))}
      </div>
      {last && (
        <div style={{
          background: 'var(--surface-slot)', boxShadow: 'var(--frame-slot)', border: '2px solid var(--ink-900)',
          borderRadius: 'var(--radius-sm)', padding: '10px 12px', display: 'flex', alignItems: 'baseline', gap: '10px',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', color: 'var(--brass-200)' }}>{last.rolling ? '…' : last.total}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-faint)' }}>
            {last.label}{!last.rolling && last.values && last.values.length > 1 ? ` = ${last.values.join(' + ')}` : ''}
          </span>
        </div>
      )}
    </div>
  )
}
