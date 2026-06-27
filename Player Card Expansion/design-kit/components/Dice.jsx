// Dice — die-shape glyphs + a roll hook + a ready-made roller.
// Requires: design-kit/theme.css + ornate-ui.css imported once at app root.
//
//   import { DiceRoller } from '../design-kit/components/Dice'
//   <DiceRoller onResult={(r) => roll(r)} />     // r = { sides, label, value }
//
// Or build your own with the hook:
//   const { last, roll } = useDiceRoller(onResult)
//   <button onClick={() => roll(DICE[5])}>roll d20</button>
//
import React, { useState, useRef, useEffect, useCallback } from 'react'

export const DICE = [
  { label: 'd4',  sides: 4,   poly: '12,3 21,20 3,20' },
  { label: 'd6',  sides: 6,   poly: '4.5,4.5 19.5,4.5 19.5,19.5 4.5,19.5' },
  { label: 'd8',  sides: 8,   poly: '12,2 21,12 12,22 3,12' },
  { label: 'd10', sides: 10,  poly: '12,2 19,10 12,22 5,10' },
  { label: 'd12', sides: 12,  poly: '12,2.5 20.5,9 17,20.5 7,20.5 3.5,9' },
  { label: 'd20', sides: 20,  poly: '6,4.5 18,4.5 22,12 18,19.5 6,19.5 2,12' },
  { label: 'd%',  sides: 100, poly: '12,2 20,7 20,17 12,22 4,17 4,7' },
]

export function DieShape({ poly, size = 26 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <polygon points={poly} />
    </svg>
  )
}

// Shuffle-then-settle roll. onResult fires once, with the final value.
export function useDiceRoller(onResult) {
  const [last, setLast] = useState(null)
  const spin = useRef(null)
  useEffect(() => () => clearInterval(spin.current), [])

  const roll = useCallback((die) => {
    clearInterval(spin.current)
    const final = 1 + Math.floor(Math.random() * die.sides)
    let ticks = 0
    spin.current = setInterval(() => {
      ticks++
      if (ticks > 8) {
        clearInterval(spin.current)
        const crit = die.sides === 20 ? (final === 20 ? 'max' : final === 1 ? 'min' : null) : null
        setLast({ label: die.label, sides: die.sides, value: final, crit, rolling: false })
        onResult?.({ sides: die.sides, label: die.label, value: final })
      } else {
        setLast({ label: die.label, sides: die.sides, value: 1 + Math.floor(Math.random() * die.sides), rolling: true })
      }
    }, 55)
  }, [onResult])

  return { last, roll }
}

export function DiceRoller({ onResult }) {
  const { last, roll } = useDiceRoller(onResult)
  const critCls = last && !last.rolling && last.crit ? ' crit-' + last.crit : ''
  return (
    <div>
      <div className="oui-die-row">
        {DICE.map((d) => (
          <button className="oui-die" key={d.label} onClick={() => roll(d)}>
            <DieShape poly={d.poly} size={26} />
            <span className="dl">{d.label}</span>
          </button>
        ))}
      </div>
      <div className={'oui-readout' + critCls} key={last ? last.value + '-' + Math.random() : 'none'}>
        {last && !last.rolling && last.crit === 'max' && <span className="crit-tag" style={{ color: 'var(--gold)' }}>★ CRITICAL ★</span>}
        {last && !last.rolling && last.crit === 'min' && <span className="crit-tag" style={{ color: 'var(--blood)' }}>FUMBLE</span>}
        <span className={'rv' + (last && !last.rolling ? ' pop' : '')}>{last ? last.value : '—'}</span>
        <span className="rl">{last ? (last.rolling ? 'rolling ' + last.label + '…' : 'rolled ' + last.label) : 'tap a die to roll'}</span>
      </div>
    </div>
  )
}
