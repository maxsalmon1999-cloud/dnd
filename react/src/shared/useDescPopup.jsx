// Hook for the shared description popup (abilities/spells/conditions).
// Returns `show(event, title, text)` and the popup `node` to render.
import { useState } from 'react'
import { Popup } from './ui'

export function useDescPopup() {
  const [pop, setPop] = useState(null)
  const show = (e, title, text) => setPop({ x: e.clientX, y: e.clientY, title, text })
  const node = pop ? (
    <Popup anchor={{ x: pop.x, y: pop.y }} onClose={() => setPop(null)}>
      <strong style={{ color: '#c4a44e' }}>{pop.title}</strong>
      <div style={{ marginTop: 4, whiteSpace: 'pre-wrap', maxHeight: '50vh', overflowY: 'auto' }}>{pop.text || 'No description available.'}</div>
    </Popup>
  ) : null
  return { show, node }
}
