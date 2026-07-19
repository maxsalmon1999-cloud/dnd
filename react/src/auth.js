// ---------------------------------------------------------------------------
// Authentication + role resolution.
//
// Sign-in is Google or a passwordless email link. Once signed in, the user's
// role is resolved from a DM-managed config node:
//   config/dmEmail        -> the DM's email (full access)
//   config/roster/{charKey} = "<owner email>"  (that player owns that character)
// The same config drives the Firebase security rules, so the client view and the
// server enforcement stay in agreement.
//
// role: 'dm'   -> sees/controls everything (DM screen)
//       'player'-> bound to one charKey (their sheet + their whispers only)
//       'none'  -> signed in but not on the roster (shown a "no access" screen)
// ---------------------------------------------------------------------------
import { create } from 'zustand'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth'
import { ref, get, set as fbSet } from 'firebase/database'
import { auth, db } from './firebase'

const EMAIL_KEY = 'auth_email_for_link'
let started = false // guards init() so the auth listener attaches only once

async function resolveRole(user) {
  const email = (user.email || '').toLowerCase()
  if (!email) return { role: 'none', charKey: null }
  const [dmSnap, rosterSnap] = await Promise.all([
    get(ref(db, 'config/dmEmail')),
    get(ref(db, 'config/roster')),
  ])
  const dmEmail = String(dmSnap.val() || '').toLowerCase()
  if (email === dmEmail) return { role: 'dm', charKey: null }
  const roster = rosterSnap.val() || {}
  const owned = Object.entries(roster).find(
    ([, e]) => String(e).toLowerCase() === email,
  )
  return owned ? { role: 'player', charKey: owned[0] } : { role: 'none', charKey: null }
}

export const useAuth = create((set, getState) => ({
  user: undefined, // undefined = still checking, null = signed out, object = signed in
  role: null, // 'dm' | 'player' | 'none'
  charKey: null,
  error: null,

  // Call once on app mount. Watches auth state and completes email-link returns.
  // Safe to call from multiple gates / StrictMode — only attaches once.
  init() {
    if (started) return
    started = true
    // If the user is returning via a sign-in email link, finish that first.
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const email = window.localStorage.getItem(EMAIL_KEY) || window.prompt('Confirm your email to finish signing in')
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => window.localStorage.removeItem(EMAIL_KEY))
          .catch((e) => set({ error: e.message }))
      }
    }

    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        set({ user: null, role: null, charKey: null })
        return
      }
      try {
        const { role, charKey } = await resolveRole(user)
        set({ user, role, charKey, error: null })
      } catch (e) {
        set({ user, role: 'none', charKey: null, error: e.message })
      }
    })
  },

  signInGoogle() {
    set({ error: null })
    return signInWithPopup(auth, new GoogleAuthProvider()).catch((e) => set({ error: e.message }))
  },

  // Passwordless email link: sends the link, then the user returns to the app URL.
  sendEmailLink(email) {
    set({ error: null })
    const clean = (email || '').trim()
    if (!clean) return Promise.resolve(set({ error: 'Enter an email address.' }))
    window.localStorage.setItem(EMAIL_KEY, clean)
    return sendSignInLinkToEmail(auth, clean, {
      url: window.location.origin + window.location.pathname,
      handleCodeInApp: true,
    }).catch((e) => set({ error: e.message }))
  },

  signOut() {
    return fbSignOut(auth)
  },

  // Player self-claim: bind the signed-in account to an (unclaimed) character.
  // Writes config/roster/{charKey} = my email, then promotes to the player role.
  // The security rules will only allow claiming a slot that's currently empty.
  async claimCharacter(charKey) {
    const user = getState().user
    if (!user || !charKey) return
    await fbSet(ref(db, `config/roster/${charKey}`), user.email)
    set({ role: 'player', charKey })
  },
}))
