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
