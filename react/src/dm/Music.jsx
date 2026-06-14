import { useEffect } from 'react'
import { Section } from '../player/ui'
import { useSpotify, initSpotify, connectSpotify, playMood, togglePlay, nextTrack, prevTrack, setVolume, MOOD_PLAYLISTS } from './spotify'

export default function Music() {
  const { connected, ready, nowPlaying, paused, activeMood } = useSpotify()

  useEffect(() => {
    initSpotify()
  }, [])

  return (
    <Section title="♫ Music">
      {!connected && <button className="btn" onClick={connectSpotify}>Connect Spotify</button>}
      {connected && (
        <>
          <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
            {Object.keys(MOOD_PLAYLISTS).map((mood) => (
              <button key={mood} className={`btn ${activeMood === mood ? 'active-mood' : ''}`} style={activeMood === mood ? { borderColor: '#c4a44e', color: '#c4a44e' } : undefined} onClick={() => playMood(mood)}>{mood}</button>
            ))}
          </div>
          {ready && (
            <div className="row" style={{ gap: 6, marginTop: 8 }}>
              <button className="btn" onClick={prevTrack}>⏮</button>
              <button className="btn" onClick={togglePlay}>{paused ? '▶' : '⏸'}</button>
              <button className="btn" onClick={nextTrack}>⏭</button>
              <input type="range" min={0} max={100} defaultValue={50} onChange={(e) => setVolume(+e.target.value)} style={{ flex: 1 }} />
            </div>
          )}
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{nowPlaying || 'Connecting…'}</div>
        </>
      )}
    </Section>
  )
}
