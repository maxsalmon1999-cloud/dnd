import { useGameStore } from '../store/gameStore'
import { fmtMod, profFromLevel } from '../shared/helpers'
import { Section, Switch } from '../shared/ui'
import { useDescPopup } from '../shared/useDescPopup'
import { CONDITIONS } from '../data/gameData'

const ABILITY_KEYS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']

export default function StatsTab({ charKey, sheet, live, roll }) {
  return (
    <>
      <Hp charKey={charKey} sheet={sheet} live={live} />
      <CoreStats sheet={sheet} />
      <AbilityScores sheet={sheet} roll={roll} />
      <SavingThrows charKey={charKey} sheet={sheet} live={live} roll={roll} />
      <Conditions charKey={charKey} live={live} />
    </>
  )
}

function Hp({ charKey, sheet, live }) {
  const changeHp = useGameStore((s) => s.changeHp)
  const maxHp = live.maxHp ?? sheet.maxHp ?? 0
  const hp = live.hp ?? maxHp
  const frac = maxHp ? hp / maxHp : 0
  const state = frac <= 0.25 ? 'low' : frac <= 0.5 ? 'mid' : ''
  return (
    <div className="card">
      <div className="row spread" style={{ marginBottom: 6 }}>
        <strong style={{ color: '#c4a44e' }}>✠ Hit Points</strong>
        <span className={state}>{hp} / {maxHp}</span>
      </div>
      <div className="hp-bar-track">
        <div className={`hp-bar-fill ${state}`} style={{ width: `${Math.max(0, frac) * 100}%` }} />
      </div>
      <div className="row" style={{ gap: 10, marginTop: 8, justifyContent: 'center' }}>
        <button className="btn iconbtn" onClick={() => changeHp(charKey, -1)}>−</button>
        <span className="muted">damage / heal</span>
        <button className="btn iconbtn" onClick={() => changeHp(charKey, +1)}>+</button>
      </div>
    </div>
  )
}

function CoreStats({ sheet }) {
  const prof = profFromLevel(sheet.level)
  const cells = [
    ['AC', sheet.ac ?? '—'],
    ['Spell Save DC', sheet.spellSaveDC ?? '—'],
    ['Prof Bonus', fmtMod(prof)],
  ]
  return (
    <div className="card row" style={{ justifyContent: 'space-around' }}>
      {cells.map(([label, val]) => (
        <div key={label} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, color: '#c4a44e', fontWeight: 'bold' }}>{val}</div>
          <div className="muted" style={{ fontSize: 11 }}>{label}</div>
        </div>
      ))}
    </div>
  )
}

function AbilityScores({ sheet, roll }) {
  const stats = sheet.stats || {}
  return (
    <div className="card">
      <strong style={{ color: '#c4a44e' }}>Ability Scores</strong>
      <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {ABILITY_KEYS.map((k) => (
          <button
            key={k}
            className="btn"
            style={{ flex: '1 0 28%', textAlign: 'center' }}
            title="Roll a check"
            onClick={() => roll({ count: 1, sides: 20, modifier: stats[k] || 0, type: `${k} Check` })}
          >
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>{fmtMod(stats[k] || 0)}</div>
            <div className="muted" style={{ fontSize: 11 }}>{k}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function SavingThrows({ charKey, sheet, live, roll }) {
  const setProf = useGameStore((s) => s.setProficiencies)
  const prof = profFromLevel(sheet.level)
  const stats = sheet.stats || {}
  const active = live.saveProficiencies || []

  const toggle = (k) => {
    const has = active.includes(k)
    if (!has && active.length >= 2) return // max 2
    setProf(charKey, 'saveProficiencies', has ? active.filter((x) => x !== k) : [...active, k])
  }

  return (
    <Section title={`✦ Saving Throws  (${active.length}/2)`}>
      {ABILITY_KEYS.map((k) => {
        const isProf = active.includes(k)
        const mod = (stats[k] || 0) + (isProf ? prof : 0)
        return (
          <div className="row spread" key={k} style={{ padding: '4px 0' }}>
            <button
              className="btn iconbtn"
              style={{ color: isProf ? '#c4a44e' : '#555' }}
              disabled={!isProf && active.length >= 2}
              onClick={() => toggle(k)}
              title="Proficiency"
            >◆</button>
            <span style={{ width: 40 }}>{k}</span>
            <strong style={{ width: 40, textAlign: 'center' }}>{fmtMod(mod)}</strong>
            <button className="btn" onClick={() => roll({ count: 1, sides: 20, modifier: mod, type: `${k} Save` })}>Roll</button>
          </div>
        )
      })}
    </Section>
  )
}

function Conditions({ charKey, live }) {
  const setCondition = useGameStore((s) => s.setCondition)
  const { show, node } = useDescPopup()
  const active = live.conditions || {}
  const isOn = (name) => !!active[name.replace(/ /g, '_')]
  const activeNames = CONDITIONS.filter((c) => isOn(c.name))

  return (
    <Section title="◎ Conditions">
      {activeNames.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {activeNames.map((c) => (
            <span key={c.name} className="chip cond" onClick={(e) => show(e, c.name, c.desc)}>{c.name}</span>
          ))}
        </div>
      )}
      {CONDITIONS.map((c) => (
        <div className="row spread" key={c.name} style={{ padding: '3px 0' }}>
          <span onClick={(e) => show(e, c.name, c.desc)} style={{ cursor: 'pointer' }}>{c.name}</span>
          <Switch on={isOn(c.name)} onChange={(v) => setCondition(charKey, c.name, v)} />
        </div>
      ))}
      {node}
    </Section>
  )
}
