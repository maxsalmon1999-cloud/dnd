import { Link } from 'react-router-dom'

// Placeholder. Phase 2 rebuilds the full player screen here.
export default function PlayerScreen() {
  return (
    <div style={{ padding: '48px 20px', textAlign: 'center' }}>
      <h2 style={{ color: '#c4a44e' }}>Player screen</h2>
      <p style={{ opacity: 0.7 }}>Placeholder — to be built in Phase 2.</p>
      <Link to="/" style={{ color: '#b8860b' }}>← back</Link>
    </div>
  )
}
