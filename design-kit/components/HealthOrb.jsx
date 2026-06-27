// HealthOrb — liquid-filled HP orb.
// Requires: design-kit/theme.css + ornate-ui.css imported once at app root.
//
//   <HealthOrb cur={hp} max={maxHp} size={72} />
//
import React from 'react'

export default function HealthOrb({ cur = 0, max = 1, size = 56 }) {
  const frac = Math.max(0, Math.min(1, max ? cur / max : 0))
  return (
    <div className="oui-orb" style={{ width: size, height: size }} title={`${cur} / ${max} HP`}>
      <div className="liquid" style={{ '--fill': frac * 100 + '%' }} />
      <div className="gloss" />
      <span className="orb-num">{cur}</span>
    </div>
  )
}
