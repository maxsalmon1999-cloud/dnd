import { Link } from 'react-router-dom'
import ConnectionStatus from '../components/ConnectionStatus'

export default function Home() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px' }}>
      <h1 style={{ color: '#c4a44e', letterSpacing: 1 }}>D&D Session Manager</h1>
      <p style={{ opacity: 0.7, marginBottom: 28 }}>
        React rebuild · Phase 0 foundation
      </p>

      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 36 }}>
        <Link to="/dm" style={btn}>DM screen →</Link>
        <Link to="/play" style={btn}>Player screen →</Link>
      </div>

      <ConnectionStatus />
    </div>
  )
}

const btn = {
  display: 'inline-block',
  padding: '12px 22px',
  border: '1px solid #4a2030',
  borderRadius: 8,
  background: 'linear-gradient(180deg,#1a1018,#120c10)',
  color: '#c4a44e',
  textDecoration: 'none',
  fontWeight: 'bold',
}
