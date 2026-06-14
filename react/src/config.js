// ---------------------------------------------------------------------------
// Shared configuration for the app.
// These values are copied verbatim from the original index.html so the React
// app talks to the EXACT same backend (same Firebase database, same AI proxy).
// ---------------------------------------------------------------------------

// Firebase Realtime Database — the live source of truth shared by DM + players.
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDdZfJ1J0VL9j0UMW5GujimRJISFaun8ls',
  authDomain: 'dnd-host.firebaseapp.com',
  databaseURL: 'https://dnd-host-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'dnd-host',
  storageBucket: 'dnd-host.firebasestorage.app',
  messagingSenderId: '89992538920',
  appId: '1:89992538920:web:06e9233db2021981f1fe1d',
}

// Cloudflare Worker that proxies to the Anthropic (Claude) API and hides the key.
export const WORKER_URL = 'https://dnd-anthropic-proxy.max-salmon1999.workers.dev'

// The Claude model the DM uses.
export const API_MODEL = 'claude-opus-4-6'

// How the AI Dungeon Master is presented to users.
export const AI_ASSISTANT_NAME = 'The abominable intelligence'
