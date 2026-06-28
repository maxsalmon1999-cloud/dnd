// ---------------------------------------------------------------------------
// Firebase initialisation.
// One place that connects to the Realtime Database. Everything else imports
// `db` from here; the live game-state store (store/gameStore.js) builds on it.
// ---------------------------------------------------------------------------
import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { FIREBASE_CONFIG } from './config'

const app = initializeApp(FIREBASE_CONFIG)
export const db = getDatabase(app)
