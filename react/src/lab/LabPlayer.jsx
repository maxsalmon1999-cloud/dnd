// ISOLATED redesign sandbox — the new "Player Card Expansion" look, wired to our
// real data ONE feature at a time. Lives entirely under /lab and .lab-root so it
// can't affect the main app. First feature wired: HP (live + changeHp → Firebase).
// Everything else here is static scaffold until we wire it, feature by feature.
import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import './lab.css'

const CHAR_KEY = 'akwan-akusian' // experimenting with Akwan's sheet

function HealthOrb({ cur, max }) {
  const frac = Math.max(0, Math.min(1, max ? cur / max : 0))
  return (
    <div className="orb" title={`${cur} / ${max} HP`}>
      <div className="liquid" style={{ '--fill': frac * 100 + '%' }} />
      <div className="gloss" />
      <span className="orb-num">{cur}</span>
    </div>
  )
}

export default function LabPlayer() {
  const subscribe = useGameStore((s) => s.subscribe)
  const loading = useGameStore((s) => s.loading)
  const sheet = useGameStore((s) => s.sheets[CHAR_KEY])
  const live = useGameStore((s) => s.characters[CHAR_KEY]) || {}
  const changeHp = useGameStore((s) => s.changeHp)

  useEffect(() => { subscribe() }, [subscribe])

  if (loading || !sheet) {
    return <div className="lab-root"><div className="phone" /></div>
  }

  const maxHp = live.maxHp ?? sheet.maxHp ?? 0
  const hp = live.hp ?? maxHp
  const stats = sheet.stats || {}

  return (
    <div className="lab-root">
      <div className="phone">
        <div className="statusbar"><span>9:41</span><div className="dots"><i /><i /><i /></div></div>

        <div className="topbar">
          {/* WIRED: live HP */}
          <div className="cluster">
            <HealthOrb cur={hp} max={maxHp} />
            <div className="glyph angel" title="Saving Throws (soon)">✦</div>
          </div>
          {/* scaffold: nav tabs */}
          <div className="navset">
            <div className="tab active" title="Stats">⚔</div>
            <div className="tab" title="Character">◈</div>
            <div className="tab" title="Inventory">🜍</div>
            <div className="tab" title="Journal">✎</div>
          </div>
          {/* scaffold: conditions + spell wheel */}
          <div className="cluster">
            <div className="glyph demon" title="Conditions (soon)">☠</div>
            <div style={{ width: 56, height: 56 }} />
          </div>
        </div>

        {/* charline — real sheet data */}
        <div className="charline">
          <span className="cn">{sheet.name}</span>
          <span className="cc">{sheet.cls}</span>
          <div className="charstats">
            <span className="cbadge"><span className="bk">AC</span><span className="bv">{sheet.ac}</span></span>
            <span className="cbadge"><span className="bk">Level</span><span className="bv">{sheet.level}</span></span>
            <span className="cbadge"><span className="bk">HP</span><span className="bv">{hp}/{maxHp}</span></span>
          </div>
        </div>

        {/* WIRED: HP damage / heal → Firebase transaction */}
        <div className="hpctl">
          <button className="hpbtn" onClick={() => changeHp(CHAR_KEY, -1)}>−</button>
          <span className="lbl">DAMAGE / HEAL</span>
          <button className="hpbtn" onClick={() => changeHp(CHAR_KEY, +1)}>+</button>
        </div>

        {/* scaffold: ability scores (display only — real mods, not yet interactive) */}
        <div className="body">
          <div className="stat-grid">
            {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map((k) => (
              <div className="stat" key={k}>
                <span className="mod">{(stats[k] ?? 0) >= 0 ? `+${stats[k] ?? 0}` : stats[k]}</span>
                <span className="k">{k}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lab-note">SANDBOX · HP is live-wired · everything else is scaffold</div>
      </div>
    </div>
  )
}
