import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { fmtMod, profFromLevel, normalizeName, slotLevel, slotPipId } from './helpers'
import { Section, Modal } from './ui'
import { useDescPopup } from './useDescPopup'
import { ABILITY_DESCRIPTIONS, SPELL_DESCRIPTIONS, SKILLS, INV_CATEGORIES } from '../data/gameData'

export default function CharacterTab({ charKey, sheet, live, roll }) {
  return (
    <>
      <Abilities charKey={charKey} sheet={sheet} live={live} />
      <Spells charKey={charKey} sheet={sheet} live={live} />
      <Skills charKey={charKey} sheet={sheet} live={live} roll={roll} />
      <Inventory charKey={charKey} live={live} />
      <Gold charKey={charKey} sheet={sheet} live={live} />
    </>
  )
}

const descFor = (table, name, fallback) =>
  table[name] || table[normalizeName(name)] || fallback || 'No description available.'

/* -------------------- Abilities -------------------- */
function Abilities({ charKey, sheet, live }) {
  const setAbilityUsed = useGameStore((s) => s.setAbilityUsed)
  const { show, node } = useDescPopup()
  const abilities = sheet.abilities || []
  const active = abilities.filter((a) => !a.passive)
  const passive = abilities.filter((a) => a.passive)
  const used = live.abilities || {}

  return (
    <>
      {active.length > 0 && (
        <Section title="⚔ Abilities" defaultOpen>
          {active.map((a) => {
            const u = used[a.key] ?? 0
            const max = a.max ?? 1
            return (
              <div className="row spread" key={a.key} style={{ padding: '4px 0' }}>
                <span style={{ cursor: 'pointer' }} onClick={(e) => show(e, a.name, descFor(ABILITY_DESCRIPTIONS, a.name, a.desc))}>
                  {a.name} <span className="muted">({max - u}/{max})</span>
                </span>
                <button className="btn" disabled={u >= max} onClick={() => setAbilityUsed(charKey, a.key, u + 1)}>Cast</button>
              </div>
            )
          })}
        </Section>
      )}
      {passive.length > 0 && (
        <Section title="◉ Features">
          {passive.map((a, i) => (
            <span key={i} className="chip passive" onClick={(e) => show(e, a.name, descFor(ABILITY_DESCRIPTIONS, a.name, a.desc))}>{a.name}</span>
          ))}
        </Section>
      )}
      {node}
    </>
  )
}

/* -------------------- Spells & slots -------------------- */
const spellLevelNum = (lvl) => {
  if (/cantrip/i.test(lvl)) return 0
  const m = String(lvl).match(/\d+/)
  return m ? parseInt(m[0], 10) : 0
}

function Spells({ charKey, sheet, live }) {
  const setSlotSpent = useGameStore((s) => s.setSlotSpent)
  const { show, node } = useDescPopup()
  const [castPick, setCastPick] = useState(null) // {spell, options}
  const spells = sheet.spells || []
  const slots = sheet.spellSlots || []
  const spent = live.slots || {}
  if (!spells.length && !slots.length) return null

  // free pips per slot definition
  const freeOf = (slot) => {
    let free = 0
    for (let i = 0; i < slot.count; i++) if (!spent[slotPipId(slot, i)]) free++
    return free
  }
  const consume = (slot) => {
    for (let i = 0; i < slot.count; i++) {
      const id = slotPipId(slot, i)
      if (!spent[id]) return setSlotSpent(charKey, id, true)
    }
  }
  const cast = (minLevel) => {
    const options = slots.filter((s) => slotLevel(s) >= minLevel && freeOf(s) > 0)
    if (options.length === 0) return
    if (options.length === 1) return consume(options[0])
    setCastPick({ options })
  }

  const cantrips = spells.filter((s) => spellLevelNum(s.level) === 0)
  const levelled = spells.filter((s) => spellLevelNum(s.level) > 0)
  const byLevel = {}
  levelled.forEach((s) => {
    const n = spellLevelNum(s.level)
    ;(byLevel[n] = byLevel[n] || []).push(s)
  })

  const canCast = (lvl) => slots.some((s) => slotLevel(s) >= lvl && freeOf(s) > 0)

  return (
    <Section title="✧ Spells" defaultOpen>
      {/* slot pips */}
      {slots.map((slot) => (
        <div className="row spread" key={slot.key} style={{ padding: '3px 0' }}>
          <span className="muted">{slot.label || slot.shortLabel}</span>
          <span>
            {Array.from({ length: slot.count }).map((_, i) => {
              const id = slotPipId(slot, i)
              return <span key={i} className={`pip ${spent[id] ? 'spent' : ''}`} onClick={() => setSlotSpent(charKey, id, !spent[id])} />
            })}
          </span>
        </div>
      ))}

      {cantrips.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div className="muted" style={{ fontSize: 11 }}>Cantrips</div>
          {cantrips.map((s, i) => (
            <span key={i} className="chip" onClick={(e) => show(e, s.name, descFor(SPELL_DESCRIPTIONS, s.name))}>{s.name}</span>
          ))}
        </div>
      )}

      {Object.keys(byLevel).map(Number).sort((a, b) => a - b).map((lvl) => (
        <div key={lvl} style={{ marginTop: 8 }}>
          <div className="muted" style={{ fontSize: 11 }}>Level {lvl}</div>
          {byLevel[lvl].map((s, i) => (
            <div className="row spread" key={i} style={{ padding: '3px 0' }}>
              <span style={{ cursor: 'pointer' }} onClick={(e) => show(e, s.name, descFor(SPELL_DESCRIPTIONS, s.name))}>{s.name}</span>
              <button className="btn" disabled={!canCast(lvl)} onClick={() => cast(lvl)}>Cast</button>
            </div>
          ))}
        </div>
      ))}

      {castPick && (
        <Modal onClose={() => setCastPick(null)}>
          <h3>Use which slot?</h3>
          <div style={{ marginTop: 10 }}>
            {castPick.options.map((slot) => (
              <button key={slot.key} className="btn" style={{ display: 'block', width: '100%', marginBottom: 6 }}
                onClick={() => { consume(slot); setCastPick(null) }}>
                {slot.label || slot.shortLabel} — {freeOf(slot)} left
              </button>
            ))}
          </div>
        </Modal>
      )}
      {node}
    </Section>
  )
}

/* -------------------- Skills -------------------- */
function Skills({ charKey, sheet, live, roll }) {
  const setProf = useGameStore((s) => s.setProficiencies)
  const prof = profFromLevel(sheet.level)
  const stats = sheet.stats || {}
  const active = live.skillProficiencies || []
  const toggle = (name) => {
    const has = active.includes(name)
    if (!has && active.length >= 4) return
    setProf(charKey, 'skillProficiencies', has ? active.filter((x) => x !== name) : [...active, name])
  }
  return (
    <Section title={`◈ Skills  (${active.length}/4)`}>
      {SKILLS.map((sk) => {
        const isProf = active.includes(sk.name)
        const mod = (stats[sk.stat] || 0) + (isProf ? prof : 0)
        return (
          <div className="row spread" key={sk.name} style={{ padding: '3px 0' }}>
            <button className="btn iconbtn" style={{ color: isProf ? '#c4a44e' : '#555' }}
              disabled={!isProf && active.length >= 4} onClick={() => toggle(sk.name)} title="Proficiency">◆</button>
            <span className="muted" style={{ width: 32 }}>{sk.stat}</span>
            <strong style={{ width: 36, textAlign: 'center' }}>{fmtMod(mod)}</strong>
            <span style={{ flex: 1 }}>{sk.name}</span>
            <button className="btn" onClick={() => roll({ count: 1, sides: 20, modifier: mod, type: sk.name })}>Roll</button>
          </div>
        )
      })}
    </Section>
  )
}

/* -------------------- Inventory -------------------- */
function Inventory({ charKey, live }) {
  const addItem = useGameStore((s) => s.addInventoryItem)
  const removeItem = useGameStore((s) => s.removeInventoryItem)
  const adjustReq = useGameStore((s) => s.adjustInventoryRequest)
  const reqs = useGameStore((s) => s.inventoryRequests[charKey]) || {}
  const inv = live.inventory || {}

  const [name, setName] = useState('')
  const [qty, setQty] = useState(1)
  const [cat, setCat] = useState('consumables')
  const [statsModal, setStatsModal] = useState(null) // {name, qty, cat}

  const pendingFor = (itemKey) => Object.values(reqs).find((r) => r.itemKey === itemKey)

  const submitAdd = () => {
    const n = name.trim()
    if (!n) return
    if (cat === 'weapons' || cat === 'armour') {
      setStatsModal({ name: n, qty, cat })
      return
    }
    addItem(charKey, { name: n, amount: qty, category: cat })
    setName(''); setQty(1)
  }

  const itemsByCat = {}
  Object.entries(inv).forEach(([k, it]) => {
    const item = typeof it === 'string' ? { name: it, amount: 1, category: 'other' } : it
    ;(itemsByCat[item.category || 'other'] = itemsByCat[item.category || 'other'] || []).push([k, item])
  })

  return (
    <Section title="🎒 Inventory" defaultOpen>
      {Object.keys(inv).length === 0 && <p className="muted">⚔ Your pack is empty ⚔</p>}

      {INV_CATEGORIES.map((c) => {
        const items = itemsByCat[c.key]
        if (!items || !items.length) return null
        return (
          <div key={c.key} style={{ marginTop: 6 }}>
            <div className="muted" style={{ fontSize: 11 }}>{c.label}</div>
            {items.map(([k, item]) => {
              const pend = pendingFor(k)
              const badge = item.damageDice ? `${item.damageDice} ${item.damageType || ''}` : item.ac ? `AC ${item.ac}` : ''
              return (
                <div className="row spread" key={k} style={{ padding: '3px 0' }}>
                  <span style={{ flex: 1 }}>
                    ◆ {item.name} {badge && <span className="muted">[{badge}]</span>}
                  </span>
                  {pend ? (
                    <span className="pending">({item.amount}) {fmtMod(pend.delta)}</span>
                  ) : (
                    <span className="row" style={{ gap: 4 }}>
                      <button className="btn iconbtn" onClick={() => adjustReq(charKey, item, k, -1)}>−</button>
                      <span style={{ width: 20, textAlign: 'center' }}>{item.amount ?? 1}</span>
                      <button className="btn iconbtn" onClick={() => adjustReq(charKey, item, k, +1)}>+</button>
                      <button className="btn iconbtn" title="Remove" onClick={() => removeItem(charKey, k)}>×</button>
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      <div className="row" style={{ gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        <input className="input" style={{ flex: 1, minWidth: 120 }} placeholder="Item name" maxLength={60}
          value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitAdd()} />
        <input className="input" style={{ width: 56 }} type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value))} />
        <select className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
          {INV_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <button className="btn" onClick={submitAdd}>+</button>
      </div>

      {statsModal && (
        <ItemStatsModal
          data={statsModal}
          onCancel={() => setStatsModal(null)}
          onConfirm={(item) => { addItem(charKey, item); setStatsModal(null); setName(''); setQty(1) }}
        />
      )}
    </Section>
  )
}

function ItemStatsModal({ data, onCancel, onConfirm }) {
  const isWeapon = data.cat === 'weapons'
  const [diceCount, setDiceCount] = useState(1)
  const [die, setDie] = useState('d6')
  const [dmgType, setDmgType] = useState('slashing')
  const [ac, setAc] = useState(10)
  const [notes, setNotes] = useState('')
  const DMG = ['slashing', 'piercing', 'bludgeoning', 'fire', 'cold', 'lightning', 'acid', 'poison', 'necrotic', 'radiant', 'psychic', 'thunder', 'force']

  const confirm = () => {
    const base = { name: data.name, amount: data.qty, category: data.cat }
    if (notes.trim()) base.notes = notes.trim()
    if (isWeapon) { base.damageDice = `${diceCount}${die}`; base.damageType = dmgType }
    else base.ac = ac
    onConfirm(base)
  }
  return (
    <Modal onClose={onCancel} closeOnEsc={false}>
      <h3>✦ {data.name}</h3>
      {isWeapon ? (
        <>
          <div className="row" style={{ gap: 6, marginTop: 10 }}>
            <span style={{ width: 70 }}>Damage</span>
            <input className="input" style={{ width: 56 }} type="number" min={1} max={20} value={diceCount} onChange={(e) => setDiceCount(+e.target.value)} />
            <select className="input" value={die} onChange={(e) => setDie(e.target.value)}>
              {['d4', 'd6', 'd8', 'd10', 'd12', 'd20'].map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="row" style={{ gap: 6, marginTop: 6 }}>
            <span style={{ width: 70 }}>Type</span>
            <select className="input" value={dmgType} onChange={(e) => setDmgType(e.target.value)}>
              {DMG.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
        </>
      ) : (
        <div className="row" style={{ gap: 6, marginTop: 10 }}>
          <span style={{ width: 70 }}>AC</span>
          <input className="input" style={{ width: 70 }} type="number" min={1} max={30} value={ac} onChange={(e) => setAc(+e.target.value)} />
        </div>
      )}
      <textarea className="input" style={{ width: '100%', marginTop: 8, minHeight: 50 }} placeholder="Other info…" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="row" style={{ gap: 8, marginTop: 10 }}>
        <button className="btn" onClick={confirm}>Add</button>
        <button className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </Modal>
  )
}

/* -------------------- Gold -------------------- */
function Gold({ charKey, sheet, live }) {
  const requestGold = useGameStore((s) => s.requestGoldChange)
  const reqs = useGameStore((s) => s.goldRequests[charKey]) || {}
  const gold = live.gold ?? 0
  const [open, setOpen] = useState(null) // 'add' | 'sub' | null
  const [amt, setAmt] = useState(1)
  const pendingDelta = Object.values(reqs).reduce((sum, r) => sum + (r.delta || 0), 0)

  const submit = () => {
    const delta = (open === 'sub' ? -1 : 1) * Math.max(1, amt)
    requestGold(charKey, sheet.name, gold, delta)
    setOpen(null); setAmt(1)
  }

  return (
    <div className="card row spread">
      <strong style={{ color: '#c4a44e' }}>◎ Gold</strong>
      <span className="row" style={{ gap: 6 }}>
        <span>{gold} gp {pendingDelta !== 0 && <span className="pending">({fmtMod(pendingDelta)})</span>}</span>
        {open ? (
          <>
            <input className="input" style={{ width: 60 }} type="number" min={1} value={amt}
              onChange={(e) => setAmt(+e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(null) }} autoFocus />
            <button className="btn iconbtn" onClick={submit}>✔</button>
            <button className="btn iconbtn" onClick={() => setOpen(null)}>×</button>
          </>
        ) : (
          <>
            <button className="btn iconbtn" onClick={() => setOpen('sub')}>−</button>
            <button className="btn iconbtn" onClick={() => setOpen('add')}>+</button>
          </>
        )}
      </span>
    </div>
  )
}
