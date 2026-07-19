// ---------------------------------------------------------------------------
// Firebase initialisation.
// One place that connects to the Realtime Database. Everything else imports
// `db` from here; the live game-state store (store/gameStore.js) builds on it.
// ---------------------------------------------------------------------------
import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { FIREBASE_CONFIG } from './config'

const app = initializeApp(FIREBASE_CONFIG)
export const db = getDatabase(app)

// Auth (Google + email-link sign-in). Persist the session in the browser so
// players/DM stay logged in across reloads.
export const auth = getAuth(app)
setPersistence(auth, browserLocalPersistence).catch(() => {})
