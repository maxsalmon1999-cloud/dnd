import { useState } from 'react'
import { useDmSession } from './dmSession'
import { rollDice, fmtMod } from '../player/helpers'

// Renders the AI's dice_request, rolls it, resolves hit/miss + on-hit
// conditionals, and injects a result summary back into the prompt for the DM
// to send. (Visual pixel/3D dice are a Phase 5 polish item.)
export default function DiceTable() {
  const request = useDmSession((s) => s.diceRequest)
  const setDiceRequest = useDmSession((s) => s.setDiceRequest)
  const setPromptDraft = useDmSession((s) => s.setPromptDraft)
  const [results, setResults] = useState(null)

  if (!request?.participants?.length) return null

  const rollAll = () => {
    const res = {}
    request.participants.forEach((p) =>
      p.rolls.forEach((r) => {
        const [c, s] = r.dice.split('d')
        const { rolls, total: rawSum } = rollDice(parseInt(c) || 1, parseInt(s))
        const modifier = r.modifier || 0
        const total = rawSum + modifier
        const hit = r.target_value != null ? total >= r.target_value : null
        res[r.id] = { values: rolls, rawSum, modifier, total, hit, r }
      }),
    )
    // Resolve on-hit conditionals against their parent roll.
    Object.values(res).forEach((rv) => {
      if (rv.r.conditional === 'on_hit' && rv.r.depends_on) {
        const parent = res[rv.r.depends_on]
        rv.skipped = !!parent && parent.hit === false
      }
    })
    setResults(res)
    setPromptDraft(formatSummary(request.participants, res))
  }

  const clear = () => { setResults(null); setDiceRequest(null) }

  return (
    <div className="card" style={{ marginTop: 10 }}>
      <div className="row spread">
        <strong style={{ color: '#c4a44e' }}>🎲 Dice Table</strong>
        <span className="row" style={{ gap: 6 }}>
          <button className="btn" onClick={rollAll}>Roll All</button>
          <button className="btn" onClick={clear}>Clear</button>
        </span>
      </div>
      {request.participants.map((p, pi) => (
        <div key={pi} style={{ marginTop: 8 }}>
          <div style={{ color: '#c4a44e', fontSize: 13 }}>{p.name}</div>
          {p.rolls.map((r) => {
            const rv = results?.[r.id]
            return (
              <div className="row spread" key={r.id} style={{ padding: '2px 0', fontSize: 13 }}>
                <span>{r.label || 'Roll'} <span className="muted">{r.dice}{r.modifier ? fmtMod(r.modifier) : ''}{r.target_value != null ? ` vs ${r.target_label || 'AC ' + r.target_value}` : ''}</span></span>
                {rv && (
                  <span className={rv.skipped ? 'muted' : rv.hit === true ? 'crit' : rv.hit === false ? 'fail' : ''}>
                    {rv.skipped ? 'skipped' : `${rv.total}${rv.hit === true ? ' HIT' : rv.hit === false ? ' MISS' : ''}`}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      ))}
      {results && <p className="muted" style={{ fontSize: 11, marginTop: 8 }}>Result summary injected into the prompt — review and send it back.</p>}
    </div>
  )
}

function formatSummary(participants, res) {
  return participants
    .map((p) => {
      const parts = p.rolls.map((r) => {
        const rv = res[r.id]
        const label = r.label || 'Roll'
        const diceStr = rv.values.length > 1 ? rv.values.join('+') : String(rv.rawSum)
        const modStr = rv.modifier ? fmtMod(rv.modifier) : ''
        if (rv.skipped) return `${label}: [skipped — miss]`
        if (rv.hit === true) return `${label}: ${diceStr}${modStr}=${rv.total} (HIT vs ${r.target_label || 'AC ' + r.target_value})`
        if (rv.hit === false) return `${label}: ${diceStr}${modStr}=${rv.total} (MISS vs ${r.target_label || 'AC ' + r.target_value})`
        const typeStr = r.damage_type ? ' ' + r.damage_type : ''
        return `${label}: ${diceStr}${modStr}=${rv.total}${typeStr}`
      })
      return `${p.name}: ${parts.join('. ')}.`
    })
    .join('\n')
}
