// ---------------------------------------------------------------------------
// Firebase initialisation.
// One place that connects to the Realtime Database. Everything else imports
// `db` from here. (Phase 1 will build the live game-state store on top of this.)
// ---------------------------------------------------------------------------
import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { FIREBASE_CONFIG } from './config'

const app = initializeApp(FIREBASE_CONFIG)
export const db = getDatabase(app)
