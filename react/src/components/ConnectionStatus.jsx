// ---------------------------------------------------------------------------
// Phase 0 proof: live-tests that the React app can reach BOTH backends.
//  1. Firebase  — reads the `characterSheets` node once and reports the count.
//  2. AI worker — sends a free reachability ping.
// This component exists only to validate the foundation; it will be removed
// once real screens are built.
// ---------------------------------------------------------------------------
import { useEffect, useState } from 'react'
import { ref, get } from 'firebase/database'
import { db } from '../firebase'
import { pingWorker } from '../lib/worker'

function Row({ label, state, detail }) {
  const color = state === 'ok' ? '#3fa34d' : state === 'error' ? '#c0392b' : '#b8860b'
  const icon = state === 'ok' ? '✓' : state === 'error' ? '✕' : '…'
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '4px 0' }}>
      <span style={{ color, fontWeight: 'bold', width: 16 }}>{icon}</span>
      <strong style={{ width: 160 }}>{label}</strong>
      <span style={{ color, opacity: 0.9 }}>{detail}</span>
    </div>
  )
}

export default function ConnectionStatus() {
  const [firebase, setFirebase] = useState({ state: 'pending', detail: 'connecting…' })
  const [worker, setWorker] = useState({ state: 'pending', detail: 'pinging…' })

  useEffect(() => {
    // Firebase: read the real character sheets once.
    get(ref(db, 'characterSheets'))
      .then((snap) => {
        const val = snap.val() || {}
        const count = Object.keys(val).length
        setFirebase({ state: 'ok', detail: `connected — ${count} character sheet(s) found` })
      })
      .catch((err) => setFirebase({ state: 'error', detail: err.message }))

    // Worker: free reachability ping.
    pingWorker()
      .then(() => setWorker({ state: 'ok', detail: 'reachable (AI proxy responding)' }))
      .catch((err) => setWorker({ state: 'error', detail: err.message }))
  }, [])

  return (
    <div
      style={{
        border: '1px solid #4a2030',
        borderRadius: 8,
        padding: '14px 18px',
        background: 'rgba(20,14,18,0.6)',
        fontFamily: 'monospace',
        fontSize: 13,
        maxWidth: 520,
        margin: '0 auto',
      }}
    >
      <div style={{ marginBottom: 8, color: '#c4a44e', fontWeight: 'bold' }}>
        Backend connection check
      </div>
      <Row label="Firebase DB" state={firebase.state} detail={firebase.detail} />
      <Row label="AI worker" state={worker.state} detail={worker.detail} />
    </div>
  )
}
