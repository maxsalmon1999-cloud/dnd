// SpellWheel — radial spell-slot tracker. Each chunk = one slot.
// Darker gold = higher spell level. Center shows slots remaining.
// Requires: design-kit/theme.css + ornate-ui.css imported once at app root.
//
// Wired to YOUR data shape:
//   slots  = sheet.spellSlots      → [{ count, key, label }]
//   spent  = live.slots            → { "1_0": true, "w_0": true }   (`${key}_${index}`)
//   onToggle(key, index)           → flip one slot in your store
//
//   <SpellWheel
//     slots={sheet.spellSlots}
//     spent={live.slots ?? {}}
//     onToggle={(key, i) => toggleSlot(charKey, `${key}_${i}`)}
//     size={64}
//   />
//
import React from 'react'

// 9-step ramp, light (level 1) → dark (level 9)
const SHADE = ['#efd089', '#e3bd6a', '#d0a44b', '#ba8d37', '#a37828', '#8a631d', '#704f15', '#583e10', '#422f0b']
const shadeFor = (lvl) => SHADE[Math.max(0, Math.min(8, lvl - 1))]

export default function SpellWheel({ slots = [], spent = {}, onToggle, size = 56 }) {
  // flatten groups into individual chunks
  const flat = []
  slots.forEach((group, gi) => {
    // level priority: explicit group.level → numeric key ("1","2") → array position
    const lvl = Number.isFinite(group.level) ? group.level
      : (Number.isFinite(+group.key) && group.key !== '' ? +group.key : gi + 1)
    for (let i = 0; i < group.count; i++) {
      const id = `${group.key}_${i}`
      flat.push({ id, key: group.key, index: i, lvl, isSpent: !!spent[id] })
    }
  })

  const N = flat.length
  const cx = 29, cy = 29, rOut = 27, rIn = 14.5
  const gap = N > 1 ? 6 : 0
  const seg = N ? (360 - N * gap) / N : 0
  const remaining = flat.filter((f) => !f.isSpent).length

  const rad = (d) => (d - 90) * Math.PI / 180
  const pt = (r, d) => [cx + r * Math.cos(rad(d)), cy + r * Math.sin(rad(d))]
  const arc = (a0, a1) => {
    const [x0, y0] = pt(rOut, a0), [x1, y1] = pt(rOut, a1)
    const [x2, y2] = pt(rIn, a1), [x3, y3] = pt(rIn, a0)
    const big = a1 - a0 > 180 ? 1 : 0
    return `M${x0} ${y0} A${rOut} ${rOut} 0 ${big} 1 ${x1} ${y1} L${x2} ${y2} A${rIn} ${rIn} 0 ${big} 0 ${x3} ${y3} Z`
  }

  return (
    <svg className="oui-wheel" viewBox="0 0 58 58" width={size} height={size}
         role="img" aria-label={`${remaining} spell slots remaining`}>
      {N === 1 ? (
        // single slot → full ring
        <circle cx={cx} cy={cy} r={(rOut + rIn) / 2} fill="none"
          stroke={flat[0].isSpent ? '#241a12' : shadeFor(flat[0].lvl)} strokeWidth={rOut - rIn}
          style={{ cursor: 'pointer' }} onClick={() => onToggle?.(flat[0].key, flat[0].index)} />
      ) : (
        flat.map((f, i) => {
          const a0 = i * (seg + gap) + gap / 2, a1 = a0 + seg
          return (
            <path key={f.id} d={arc(a0, a1)}
              fill={f.isSpent ? '#241a12' : shadeFor(f.lvl)}
              stroke={f.isSpent ? 'var(--line-strong)' : 'none'} strokeWidth="1.4"
              style={{ cursor: 'pointer' }} onClick={() => onToggle?.(f.key, f.index)} />
          )
        })
      )}
      <circle cx={cx} cy={cy} r="11.5" fill="#120d0a" stroke="var(--gold-2)" strokeWidth="1.4" />
      <text x={cx} y={cy + 0.5} textAnchor="middle" dominantBaseline="central"
        fill="var(--gold)" fontFamily="var(--mono)" fontSize="13" fontWeight="700">{remaining}</text>
    </svg>
  )
}
