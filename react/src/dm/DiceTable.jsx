import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { useDmSession } from './dmSession'
import { rollDice, fmtMod } from '../player/helpers'

// Dice table: loads the AI's dice_request (when present) and also lets the DM
// build an encounter by hand (add participants from characters / campaign NPCs /
// enemies / custom, then add manual rolls). Rolls resolve hit/miss + on-hit
// conditionals and inject a result summary into the prompt.
let _uid = 0
const nextId = () => `m${_uid++}`

export default function DiceTable() {
  const request = useDmSession((s) => s.diceRequest)
  const setDiceRequest = useDmSession((s) => s.setDiceRequest)
  const setPromptDraft = useDmSession((s) => s.setPromptDraft)
  const sheets = useGameStore((s) => s.sheets)
  const campaign = useGameStore((s) => s.campaign)

  const [parts, setParts] = useState([]) // [{name, rolls:[...]}]
  const [results, setResults] = useState(null)
  const [picker, setPicker] = useState('')

  // Seed the table when the AI sends a dice request (intentional store->local sync).
  useEffect(() => {
    if (request?.participants?.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setParts(request.participants)
      setResults(null)
    }
  }, [request])

  const names = [
    ...Object.values(sheets).map((c) => c.name),
    ...Object.values(campaign?.npcs || {}).map((n) => n.name),
    ...(campaign?.encounters ? [...new Set(Object.values(campaign.encounters).flatMap((e) => e.enemies || []))] : []),
  ]

  const addParticipant = (name) => {
    if (!name) return
    setParts((p) => [...p, { name, rolls: [] }])
    setPicker('')
  }
  const addRoll = (pi, roll) => setParts((p) => p.map((part, i) => (i === pi ? { ...part, rolls: [...part.rolls, roll] } : part)))
  const clear = () => { setParts([]); setResults(null); setDiceRequest(null) }

  const rollAll = () => {
    const res = {}
    parts.forEach((p) => p.rolls.forEach((r) => {
      const [c, s] = r.dice.split('d')
      const { rolls, total: rawSum } = rollDice(parseInt(c) || 1, parseInt(s))
      const modifier = r.modifier || 0
      const total = rawSum + modifier
      const hit = r.target_value != null ? total >= r.target_value : null
      res[r.id] = { values: rolls, rawSum, modifier, total, hit, r }
    }))
    Object.values(res).forEach((rv) => {
      if (rv.r.conditional === 'on_hit' && rv.r.depends_on) {
        const parent = res[rv.r.depends_on]
        rv.skipped = !!parent && parent.hit === false
      }
    })
    setResults(res)
    setPromptDraft(formatSummary(parts, res))
  }

  if (!parts.length) {
    return (
      <div className="card" style={{ marginTop: 10 }}>
        <div className="row spread">
          <strong style={{ color: '#c4a44e' }}>🎲 Dice Table</strong>
          <AddParticipant names={names} value={picker} onChange={setPicker} onAdd={addParticipant} />
        </div>
        <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>Empty — the AI can load rolls here, or add a participant to build an encounter.</div>
      </div>
    )
  }

  return (
    <div className="card" style={{ marginTop: 10 }}>
      <div className="row spread">
        <strong style={{ color: '#c4a44e' }}>🎲 Dice Table</strong>
        <span className="row" style={{ gap: 6 }}>
          <button className="btn" onClick={rollAll}>Roll All</button>
          <button className="btn" onClick={clear}>Clear</button>
        </span>
      </div>
      {parts.map((p, pi) => (
        <div key={pi} style={{ marginTop: 8 }}>
          <div className="row spread">
            <span style={{ color: '#c4a44e', fontSize: 13 }}>{p.name}</span>
            <ManualRollAdd onAdd={(roll) => addRoll(pi, roll)} />
          </div>
          {p.rolls.map((r) => {
            const rv = results?.[r.id]
            return (
              <div className="row spread" key={r.id} style={{ padding: '2px 0', fontSize: 13 }}>
                <span>{r.label || 'Roll'} <span className="muted">{r.dice}{r.modifier ? fmtMod(r.modifier) : ''}{r.target_value != null ? ` vs ${r.target_label || 'AC ' + r.target_value}` : ''}</span></span>
                {rv && <span className={rv.skipped ? 'muted' : rv.hit === true ? 'crit' : rv.hit === false ? 'fail' : ''}>{rv.skipped ? 'skipped' : `${rv.total}${rv.hit === true ? ' HIT' : rv.hit === false ? ' MISS' : ''}`}</span>}
              </div>
            )
          })}
        </div>
      ))}
      <div className="row" style={{ marginTop: 8 }}>
        <AddParticipant names={names} value={picker} onChange={setPicker} onAdd={addParticipant} />
      </div>
      {results && <p className="muted" style={{ fontSize: 11, marginTop: 8 }}>Result summary injected into the prompt — review and send it back.</p>}
    </div>
  )
}

function AddParticipant({ names, value, onChange, onAdd }) {
  return (
    <span className="row" style={{ gap: 4 }}>
      <input className="input" list="dt-names" style={{ width: 130 }} placeholder="+ participant" value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onAdd(value.trim())} />
      <datalist id="dt-names">{names.map((n, i) => <option key={i} value={n} />)}</datalist>
      <button className="btn" onClick={() => onAdd(value.trim())}>Add</button>
    </span>
  )
}

function ManualRollAdd({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(1)
  const [sides, setSides] = useState(20)
  const [modifier, setModifier] = useState(0)
  const [label, setLabel] = useState('')
  const [target, setTarget] = useState('')
  if (!open) return <button className="btn iconbtn" title="Add roll" onClick={() => setOpen(true)}>+</button>
  return (
    <span className="row" style={{ gap: 3, flexWrap: 'wrap' }}>
      <input className="input" style={{ width: 70 }} placeholder="label" value={label} onChange={(e) => setLabel(e.target.value)} />
      <input className="input" style={{ width: 38 }} type="number" min={1} value={count} onChange={(e) => setCount(+e.target.value)} />
      <select className="input" value={sides} onChange={(e) => setSides(+e.target.value)}>{[4, 6, 8, 10, 12, 20, 100].map((n) => <option key={n} value={n}>d{n}</option>)}</select>
      <input className="input" style={{ width: 44 }} type="number" placeholder="+" value={modifier} onChange={(e) => setModifier(+e.target.value)} />
      <input className="input" style={{ width: 50 }} type="number" placeholder="AC" value={target} onChange={(e) => setTarget(e.target.value)} />
      <button className="btn iconbtn" onClick={() => {
        onAdd({ id: nextId(), dice: `${count}d${sides}`, modifier, label: label || 'Roll', ...(target ? { target_value: +target } : {}) })
        setOpen(false); setLabel(''); setModifier(0); setTarget('')
      }}>✓</button>
    </span>
  )
}

function formatSummary(participants, res) {
  return participants
    .filter((p) => p.rolls.length)
    .map((p) => {
      const parts = p.rolls.map((r) => {
        const rv = res[r.id]
        if (!rv) return ''
        const label = r.label || 'Roll'
        const diceStr = rv.values.length > 1 ? rv.values.join('+') : String(rv.rawSum)
        const modStr = rv.modifier ? fmtMod(rv.modifier) : ''
        if (rv.skipped) return `${label}: [skipped — miss]`
        if (rv.hit === true) return `${label}: ${diceStr}${modStr}=${rv.total} (HIT vs ${r.target_label || 'AC ' + r.target_value})`
        if (rv.hit === false) return `${label}: ${diceStr}${modStr}=${rv.total} (MISS vs ${r.target_label || 'AC ' + r.target_value})`
        const typeStr = r.damage_type ? ' ' + r.damage_type : ''
        return `${label}: ${diceStr}${modStr}=${rv.total}${typeStr}`
      }).filter(Boolean)
      return `${p.name}: ${parts.join('. ')}.`
    })
    .join('\n')
}
