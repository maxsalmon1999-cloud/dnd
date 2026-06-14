import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { fmtMod } from '../player/helpers'
import { useDescPopup } from '../player/useDescPopup'
import { ABILITY_DESCRIPTIONS, SPELL_DESCRIPTIONS } from '../data/gameData'

const descFor = (table, name, fb) => table[name] || fb || 'No description available.'

export default function CharacterSidebar() {
  const sheets = useGameStore((s) => s.sheets)
  const keys = Object.keys(sheets)
  if (!keys.length) return <div className="card muted">No characters — use Setup to add.</div>
  return (
    <div className="card">
      <strong style={{ color: '#c4a44e' }}>Characters</strong>
      <div style={{ marginTop: 8 }}>
        {keys.map((key) => <CharCard key={key} charKey={key} />)}
      </div>
    </div>
  )
}

function CharCard({ charKey }) {
  const sheet = useGameStore((s) => s.sheets[charKey])
  const live = useGameStore((s) => s.characters[charKey]) || {}
  const changeHp = useGameStore((s) => s.changeHp)
  const { show, node } = useDescPopup()
  const [open, setOpen] = useState(false)

  const maxHp = live.maxHp ?? sheet.maxHp
  const hp = live.hp ?? maxHp
  const used = live.abilities || {}
  const abilities = (sheet.abilities || []).filter((a) => !a.passive)

  return (
    <div style={{ borderTop: '1px solid var(--line)', padding: '6px 0' }}>
      <div className="row spread" style={{ cursor: 'pointer' }} onClick={() => setOpen((o) => !o)}>
        <strong>{sheet.name}</strong>
        <span className="row" style={{ gap: 6 }}>
          <span className="muted">{hp}/{maxHp} HP</span>
          <span className="muted" style={{ fontSize: 11 }}>{open ? '▾' : '▸'}</span>
        </span>
      </div>
      {open && (
        <div style={{ marginTop: 6 }}>
          <div className="row" style={{ gap: 8, marginBottom: 6 }}>
            <button className="btn iconbtn" onClick={() => changeHp(charKey, -1)}>−</button>
            <span style={{ width: 70, textAlign: 'center' }}>{hp} / {maxHp}</span>
            <button className="btn iconbtn" onClick={() => changeHp(charKey, +1)}>+</button>
          </div>
          <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
            {sheet.cls} · AC {sheet.ac}
            {sheet.spellSaveDC ? ` · DC ${sheet.spellSaveDC}` : ''}
          </div>
          <div style={{ fontSize: 12, marginBottom: 6 }}>
            {Object.entries(sheet.stats || {}).map(([k, v]) => `${k} ${fmtMod(v)}`).join('  ')}
          </div>

          {abilities.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              {abilities.map((a) => {
                const u = used[a.key] ?? 0
                const max = a.max ?? 1
                return (
                  <span key={a.key} className={`chip ${u >= max ? 'muted' : ''}`}
                    onClick={(e) => show(e, a.name, descFor(ABILITY_DESCRIPTIONS, a.name, a.desc))}>
                    {a.name} ({max - u}/{max})
                  </span>
                )
              })}
            </div>
          )}

          {(sheet.spells || []).length > 0 && (
            <div>
              {sheet.spells.map((sp, i) => (
                <span key={i} className="chip" onClick={(e) => show(e, sp.name, descFor(SPELL_DESCRIPTIONS, sp.name))}>{sp.name}</span>
              ))}
            </div>
          )}
        </div>
      )}
      {node}
    </div>
  )
}
