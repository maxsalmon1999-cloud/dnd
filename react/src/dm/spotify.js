// Spotify integration (PKCE auth + Web Playback SDK), ported from the original.
//
// NOTE: requires the redirect URI `<app-origin>/callback` to be registered in
// the Spotify app dashboard, and Spotify Premium for playback. Cannot be
// verified in this environment — see DEPLOY/notes.
import { create } from 'zustand'

const CLIENT_ID = '0ea5b2463294464f882a3b3c9798352e'
const SCOPES = 'streaming user-read-email user-read-private user-modify-playback-state playlist-read-private'
export const REDIRECT_URI = typeof window !== 'undefined' ? window.location.origin + '/callback' : ''

export const MOOD_PLAYLISTS = {
  Tavern: '4hc98N2WURWgeCLM3oyQh0',
  Battle: '5itc0hInJaDGosUvmwVwxC',
  Suspense: '1BHuBw7Z9NjuviCLe5qtAp',
  Forest: '1Ur6SjYinD2Zns1VmQmjlU',
  Feast: '6XtharnXyMJVgmCx1ycyKL',
  Walking: '6TS7188IVB9InS1Wz9yuJE',
}

export const useSpotify = create((set) => ({
  connected: false,
  ready: false,
  nowPlaying: '',
  paused: true,
  activeMood: null,
  set,
}))

let player = null
let deviceId = null

// --- PKCE helpers ---
function randomString(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const arr = new Uint8Array(len)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => chars[b % chars.length]).join('')
}
async function codeChallenge(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function connectSpotify() {
  const verifier = randomString(64)
  const challenge = await codeChallenge(verifier)
  localStorage.setItem('spotify_code_verifier', verifier)
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: SCOPES,
  })
  window.location.href = 'https://accounts.spotify.com/authorize?' + params
}

// Exchange the auth code for tokens (used by the /callback route).
export async function exchangeCode(code) {
  const verifier = localStorage.getItem('spotify_code_verifier')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI, code_verifier: verifier }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error(data.error_description || 'Token exchange failed')
  localStorage.setItem('spotify_access_token', data.access_token)
  localStorage.setItem('spotify_refresh_token', data.refresh_token || '')
  localStorage.setItem('spotify_token_expiry', String(Date.now() + data.expires_in * 1000))
  localStorage.removeItem('spotify_code_verifier')
}

async function refreshToken() {
  const rt = localStorage.getItem('spotify_refresh_token')
  if (!rt) return false
  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: CLIENT_ID, grant_type: 'refresh_token', refresh_token: rt }),
    })
    const data = await res.json()
    if (data.access_token) {
      localStorage.setItem('spotify_access_token', data.access_token)
      if (data.refresh_token) localStorage.setItem('spotify_refresh_token', data.refresh_token)
      localStorage.setItem('spotify_token_expiry', String(Date.now() + data.expires_in * 1000))
      return true
    }
  } catch { /* ignore */ }
  return false
}

async function getValidToken() {
  const expiry = parseInt(localStorage.getItem('spotify_token_expiry') || '0')
  if (Date.now() > expiry - 60000) await refreshToken()
  return localStorage.getItem('spotify_access_token')
}

// Load the SDK + create the player. Call once on mount.
export function initSpotify() {
  const token = localStorage.getItem('spotify_access_token')
  if (!token) return
  useSpotify.getState().set({ connected: true })

  window.onSpotifyWebPlaybackSDKReady = () => {
    player = new window.Spotify.Player({
      name: 'DnD Session Manager',
      getOAuthToken: async (cb) => cb(await getValidToken()),
      volume: 0.5,
    })
    player.addListener('ready', ({ device_id }) => {
      deviceId = device_id
      useSpotify.getState().set({ ready: true, nowPlaying: 'Connected — choose a mood' })
    })
    player.addListener('not_ready', () => {
      deviceId = null
      useSpotify.getState().set({ ready: false, nowPlaying: 'Device went offline' })
    })
    player.addListener('player_state_changed', (state) => {
      if (!state) return
      const track = state.track_window?.current_track
      const np = track ? `${track.name} — ${track.artists.map((a) => a.name).join(', ')}` : ''
      useSpotify.getState().set({ nowPlaying: np, paused: state.paused })
    })
    player.addListener('authentication_error', () => useSpotify.getState().set({ connected: false, nowPlaying: 'Auth expired — reconnect' }))
    player.connect()
  }

  if (!document.getElementById('spotify-sdk-script')) {
    const s = document.createElement('script')
    s.id = 'spotify-sdk-script'
    s.src = 'https://sdk.scdn.co/spotify-player.js'
    document.body.appendChild(s)
  }
}

export const togglePlay = () => player?.togglePlay()
export const nextTrack = () => player?.nextTrack()
export const prevTrack = () => player?.previousTrack()
export const setVolume = (v) => player?.setVolume(v / 100)

export async function playMood(mood) {
  const playlistId = MOOD_PLAYLISTS[mood]
  const st = useSpotify.getState()
  if (!deviceId) { st.set({ nowPlaying: 'Connect Spotify first' }); return }
  if (!playlistId) { st.set({ nowPlaying: `${mood} — no playlist linked` }); return }
  if (st.activeMood === mood) { st.set({ activeMood: null }); player?.pause(); return }
  st.set({ activeMood: mood, nowPlaying: `Loading ${mood}…` })
  const token = await getValidToken()
  let trackCount = 30
  try {
    const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}?fields=tracks.total`, { headers: { Authorization: 'Bearer ' + token } })
    if (res.ok) trackCount = (await res.json()).tracks?.total || 30
  } catch { /* ignore */ }
  const offset = Math.floor(Math.random() * trackCount)
  try {
    await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=true&device_id=${deviceId}`, { method: 'PUT', headers: { Authorization: 'Bearer ' + token } })
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ context_uri: `spotify:playlist:${playlistId}`, offset: { position: offset } }),
    })
  } catch (err) {
    st.set({ nowPlaying: 'Error: ' + err.message })
  }
}
