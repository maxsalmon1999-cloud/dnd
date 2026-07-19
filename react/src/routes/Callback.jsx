// Spotify OAuth redirect handler. Exchanges the auth code for tokens, then
// returns to the DM screen. Registered as the redirect URI: <origin>/callback.
import { useEffect, useState } from 'react'
import { exchangeCode } from '../dm/spotify'

const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
const CODE = params.get('code')
const ERROR = params.get('error')

export default function Callback() {
  const [status, setStatus] = useState(
    ERROR ? 'Spotify authorisation denied: ' + ERROR : !CODE ? 'Missing auth code.' : 'Connecting to Spotify…',
  )

  useEffect(() => {
    if (ERROR || !CODE) return
    exchangeCode(CODE)
      .then(() => { window.location.href = '/dm-refresh' })
      .catch((err) => setStatus('Error: ' + err.message))
  }, [])

  return (
    <div className="pl" style={{ padding: 40, textAlign: 'center' }}>
      <p>{status}</p>
    </div>
  )
}
