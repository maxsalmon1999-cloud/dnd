import { Link } from 'react-router-dom'

// Placeholder. Phase 3 rebuilds the full DM screen here.
export default function DmScreen() {
  return (
    <div style={{ padding: '48px 20px', textAlign: 'center' }}>
      <h2 style={{ color: '#c4a44e' }}>DM screen</h2>
      <p style={{ opacity: 0.7 }}>Placeholder — to be built in Phase 3.</p>
      <Link to="/" style={{ color: '#b8860b' }}>← back</Link>
    </div>
  )
}
