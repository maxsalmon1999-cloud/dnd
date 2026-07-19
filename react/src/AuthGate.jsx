// Wraps a route and requires the right identity before rendering it.
//   <AuthGate require="dm">   — only the DM
//   <AuthGate require="player"> — only a rostered player
//   <AuthGate require="any">  — any signed-in, rostered user
// Shows a sign-in screen when signed out, and a "no access" screen when the
// signed-in account isn't on the roster (or lacks the required role).
import { useEffect, useState } from 'react'
import { useAuth } from './auth'

const wrap = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c0908', color: '#ece0c6', fontFamily: 'system-ui, sans-serif', padding: 24 }
const card = { width: '100%', maxWidth: 380, background: '#161010', border: '2px solid #473628', borderRadius: 16, padding: 28, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }
const btn = { width: '100%', padding: '12px 16px', borderRadius: 10, border: '2px solid #dcb968', background: '#dcb968', color: '#241a0e', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 12 }
const ghost = { ...btn, background: 'transparent', color: '#dcb968' }
const input = { width: '100%', padding: '11px 12px', borderRadius: 10, border: '2px solid #473628', background: '#0c0908', color: '#ece0c6', fontSize: 14, outline: 'none' }

export default function AuthGate({ require = 'any', children }) {
  const { user, role, error, init, signInGoogle, sendEmailLink, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [linkSent, setLinkSent] = useState(false)

  useEffect(() => { init() }, [init])

  // Still checking the session.
  if (user === undefined) {
    return <div style={wrap}><div style={{ opacity: 0.6 }}>Loading…</div></div>
  }

  // Signed out → sign-in screen.
  if (user === null) {
    return (
      <div style={wrap}>
        <div style={card}>
          <h1 style={{ color: '#dcb968', fontSize: 22, marginBottom: 4 }}>D&D Session Manager</h1>
          <p style={{ opacity: 0.6, fontSize: 13, marginBottom: 20 }}>Sign in to continue</p>
          <button style={btn} onClick={signInGoogle}>Continue with Google</button>
          <div style={{ opacity: 0.4, fontSize: 12, margin: '16px 0 8px' }}>or use an email link</div>
          <input style={input} type="email" placeholder="you@example.com" value={email}
            onChange={(e) => setEmail(e.target.value)} />
          <button style={ghost} disabled={!email.trim()} onClick={() => { sendEmailLink(email); setLinkSent(true) }}>
            Email me a sign-in link
          </button>
          {linkSent && <p style={{ color: '#8ab38a', fontSize: 13, marginTop: 12 }}>Check your inbox for the link.</p>}
          {error && <p style={{ color: '#bb3b32', fontSize: 13, marginTop: 12 }}>{error}</p>}
        </div>
      </div>
    )
  }

  // Signed in but not authorized for this screen.
  const allowed = require === 'any' ? role === 'dm' || role === 'player' : role === require
  if (!allowed) {
    const msg = role === 'none'
      ? "You're signed in, but this account isn't on the game roster yet. Ask your DM to add you."
      : `This screen is for the ${require}. You're signed in as a ${role}.`
    return (
      <div style={wrap}>
        <div style={card}>
          <h1 style={{ color: '#dcb968', fontSize: 20, marginBottom: 10 }}>No access</h1>
          <p style={{ opacity: 0.8, fontSize: 14, lineHeight: 1.5 }}>{msg}</p>
          <p style={{ opacity: 0.5, fontSize: 12, marginTop: 10 }}>{user.email}</p>
          <button style={ghost} onClick={signOut}>Sign out</button>
        </div>
      </div>
    )
  }

  return children
}
