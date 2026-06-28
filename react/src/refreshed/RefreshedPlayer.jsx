/* eslint-disable */
// ISOLATED redesign sandbox — the ORIGINAL "Player Card Expansion" prototype,
// ported verbatim (same layout, icons, spell wheel, cards). Scoped under
// .lab-root + the /lab route so it can't touch the main app.
// We swap the prototype's placeholder data for live data ONE feature at a time.
// Wired so far: HP (the orb reads Akwan's live hp/maxHp from the store).
import React from 'react'
import { CHARACTER } from './characterData'
import { adaptCharacter } from './characterAdapter'
import { useGameStore } from '../store/gameStore'
import { rollLabDice } from './refreshedDice'
import { CONDITIONS as COND_INFO, SPELL_DESCRIPTIONS, ABILITY_DESCRIPTIONS } from '../data/gameData'
import './refreshed.css'

// condition name -> description (from the ported reference data)
const CONDDESC = Object.fromEntries((COND_INFO || []).map((c) => [c.name, c.desc]))
// parse a dice string like "1d6+3", "3d6", "2d8-1" -> {count, sides, modifier}
function parseDice(str) {
  const m = String(str || '').match(/(\d+)\s*d\s*(\d+)\s*([+-]\s*\d+)?/i)
  if (!m) return null
  return { count: parseInt(m[1], 10) || 1, sides: parseInt(m[2], 10), modifier: m[3] ? parseInt(m[3].replace(/\s/g, ''), 10) : 0 }
}
// description lookup (reference data), falling back to the prototype's shorthand
const descOf = (table, name, fb) => (table && table[name]) || fb || 'No description available.'

// slide-to-confirm delete (drag the knob to the far end to delete)
function SlideToDelete({ name, onConfirm, onCancel }) {
  const trackRef = useRef(null)
  const [x, setX] = useState(0)
  const [done, setDone] = useState(false)
  const KNOB = 46
  const move = (clientX) => {
    if (done || !trackRef.current) return
    const r = trackRef.current.getBoundingClientRect()
    const max = r.width - KNOB
    const nx = Math.max(0, Math.min(max, clientX - r.left - KNOB / 2))
    setX(nx)
    if (nx >= max - 2) { setDone(true); setX(max); onConfirm() }
  }
  return (
    <div className="lab-pop-backdrop" onClick={onCancel}>
      <div className="lab-pop" onClick={(e) => e.stopPropagation()}>
        <div className="lab-pop-title">Delete {name}?</div>
        <div className="lab-pop-body">This can&rsquo;t be undone.</div>
        <div className="slide-track" ref={trackRef} onPointerMove={(e) => { if (e.buttons === 1) move(e.clientX) }}>
          <span className="slide-hint">slide to delete →</span>
          <div className="slide-knob" style={{ left: x }}
            onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
            onPointerMove={(e) => move(e.clientX)}
            onPointerUp={() => { if (!done) setX(0) }}><S><path d="M6 6l12 12M18 6L6 18"/></S></div>
        </div>
        <button className="lab-pop-x" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

const { useState, useRef, useCallback, useEffect } = React;
// Per-character data + key. Reassigned by <RefreshedPlayer> (the only renderer)
// before <App> renders, so every child reads the active character. <App> is
// keyed by charKey, so its once-per-mount state re-initialises on a switch.
let C = CHARACTER;
let LAB_CHAR_KEY = 'akwan-akusian';
const CARD_W = 152, CARD_H = 190;

/* ---------- icons (thin Lucide-style placeholders) ---------- */
const S = ({ children }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
const TABS = [
  { id:1, label:"Character", el:<S><circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.6 3.1-6.4 7-6.4s7 2.8 7 6.4"/></S> },
  { id:2, label:"Inventory", el:<S><path d="M6.5 8h11l-1 11.4a1.6 1.6 0 0 1-1.6 1.5H9.1a1.6 1.6 0 0 1-1.6-1.5L6.5 8z"/><path d="M9 8V6.4a3 3 0 0 1 6 0V8"/></S> },
  { id:3, label:"Journal", el:<S><path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3V4z"/><path d="M5 17a3 3 0 013-3h11"/><path d="M9 8h6M9 11h4"/></S> },
];

const ICON = {
  skills: <S><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.4"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/></S>,
  combat: <S><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" y1="14" x2="9" y2="18"/><line x1="7" y1="17" x2="4" y2="20"/><line x1="3" y1="19" x2="5" y2="21"/></S>,
  magic:  <S><path d="M12 2.5l2.3 6.2 6.2 2.3-6.2 2.3L12 19.5l-2.3-6.2L3.5 11l6.2-2.3L12 2.5z"/></S>,
  // inventory
  weapons: <S><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" y1="14" x2="9" y2="18"/><line x1="7" y1="17" x2="4" y2="20"/><line x1="3" y1="19" x2="5" y2="21"/></S>,
  armour: <S><path d="M5 12a7 7 0 0 1 14 0v3a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M5 13.6h14"/><path d="M12 6.2v7.4"/></S>,
  cash:   <S><ellipse cx="12" cy="6.5" rx="7" ry="3"/><path d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/><path d="M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/></S>,
  misc:   <S><circle cx="8" cy="8" r="3.4"/><path d="M10.4 10.4L20 20M16.5 16.5l2-2M14 14l1.6-1.6"/></S>,
  consumables: <S><path d="M9.5 3h5M11 3v4.2L7.6 15a3.2 3.2 0 0 0 2.9 4.7h3a3.2 3.2 0 0 0 2.9-4.7L13 7.2V3"/><path d="M8.2 13.5h7.6"/></S>,
  add:    <S><path d="M12 5v14M5 12h14"/></S>,
};

const SACK = (
  <svg viewBox="0 0 120 132" fill="none" stroke="#b89140" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
    <path d="M44 26c-4-3-6-8-3-12 3 4 9 5 14 5h10c5 0 11-1 14-5 3 4 1 9-3 12" fill="#33271c"/>
    <path d="M30 40c8-7 19-9 30-9s22 2 30 9c10 17 9 42-3 58-7 9-17 14-27 14s-20-5-27-14C21 82 20 57 30 40Z" fill="#2a1f17"/>
    <path d="M34 38c8 5 17 7 26 7s18-2 26-7" stroke="#dcb968" />
    <path d="M48 66c4 4 8 6 12 6s8-2 12-6" stroke="#6e5a40" strokeWidth="2.4"/>
    <path d="M52 92c3 2 5 3 8 3s5-1 8-3" stroke="#5a4630" strokeWidth="2.2"/>
  </svg>
);

// little angel (saving throws) + demon (conditions) — placeholder glyphs
const GLYPH = {
  angel: <S><ellipse cx="12" cy="3.6" rx="3" ry="1"/><circle cx="12" cy="7.6" r="2"/><path d="M12 10c-1.7 0-3 1.4-3 3.2V19h6v-5.8c0-1.8-1.3-3.2-3-3.2z"/><path d="M9 12.6c-2.8.2-4.6 2.2-4.6 4.7 2.2.2 4-.9 4.9-2.7M15 12.6c2.8.2 4.6 2.2 4.6 4.7-2.2.2-4-.9-4.9-2.7"/></S>,
  demon: <S><path d="M8 6.6C6.6 4.7 4.8 4.3 4.8 4.3c.2 1.7 1 3 2.2 3.8"/><path d="M16 6.6c1.4-1.9 3.2-2.3 3.2-2.3-.2 1.7-1 3-2.2 3.8"/><path d="M5.6 12.6a6.4 6.4 0 0 1 12.8 0c0 3.5-2.9 6.4-6.4 6.4s-6.4-2.9-6.4-6.4z"/><circle cx="9.6" cy="12" r=".95" fill="currentColor"/><circle cx="14.4" cy="12" r=".95" fill="currentColor"/><path d="M9.7 15c.7.7 1.5 1 2.3 1s1.6-.3 2.3-1"/></S>,
};

const STAT_NAMES = { STR:"Strength", DEX:"Dexterity", CON:"Constitution", INT:"Intelligence", WIS:"Wisdom", CHA:"Charisma" };
const CONDITIONS = ["Blinded","Charmed","Deafened","Exhaustion","Frightened","Grappled","Incapacitated","Invisible","Paralyzed","Petrified","Poisoned","Prone","Restrained","Stunned","Unconscious"];
const PANELS = {
  saves:      { title:"Saving Throws", color:"#6f5320", glyph:"angel" },
  conditions: { title:"Conditions",    color:"var(--cond)", glyph:"demon" },
};

const cardsFor = (C) => [
  { id:"skills", color:"var(--skills)", title:"Skills",
    sub:`${C.skills.filter(s=>s.p).length} proficient · ${C.skills.length} total` },
  { id:"combat", color:"var(--combat)", title:"Weapons &\nCantrips",
    sub:`${C.weapons.length} weapons · ${C.cantrips.length} cantrips` },
  { id:"magic", color:"var(--magic)", title:"Spells &\nItems",
    sub:`prepared · abilities · gear` },
];
const FAN = [
  { left:0,   bottom:2,  rot:-12, z:1 },
  { left:84,  bottom:16, rot:0,   z:3 },
  { left:168, bottom:2,  rot:12,  z:2 },
];

/* ---------- inventory layout (sword center, 5 around) ---------- */
const INV_CENTER = { id:"weapons", color:"var(--combat)", title:"Weapons" };
const INV_RING = [
  { id:"armour",      color:"var(--armour)",      title:"Armour",         angle:-90 },
  { id:"consumables", color:"var(--consumables)", title:"Consumables",    angle:-18 },
  { id:"cash",        color:"#7a5a24",      title:"Coins & Cash",   angle:54  },
  { id:"misc",        color:"var(--misc)",        title:"Misc & Tools",   angle:126 },
  { id:"add",         color:"#1c1510",            title:"Add Item",       angle:198 },
];
const ringPos = (angle, R, size) => {
  const a = angle * Math.PI / 180;
  return { left: 150 + R * Math.cos(a) - size / 2, top: 150 + R * Math.sin(a) - size / 2 };
};

/* ---------- expanded content per category ---------- */
function SkillsView({ ctx }) {
  return (
    <div className="sec">
      <div className="sec-h"><span>Ability Checks</span><span style={{textTransform:"none",letterSpacing:".02em",fontWeight:600}}>● proficient</span></div>
      {C.skills.map((s) => (
        <div className="skill" key={s.n}>
          <div className={"dot" + (s.p ? " on" : "")} />
          <span className="sn">{s.n}</span>
          <span className="sa">{s.a}</span>
          <span className="sm">{s.m}</span>
          <button className="row-roll" onClick={() => ctx.roll({ count: 1, sides: 20, modifier: parseInt(s.m, 10) || 0, label: "1d20" + (s.m || ""), type: s.n })}>ROLL</button>
        </div>
      ))}
    </div>
  );
}
// A weapon row: tap (or its button) to roll its damage dice.
function WeaponRow({ w, ctx }) {
  const dmg = parseDice(w.dmg);
  const hitMod = parseInt(w.hit, 10) || 0;
  return (
    <div className="item" key={w.n}>
      <div className="main"><div className="in">{w.n}</div><div className="im">{w.meta} · {w.type}</div></div>
      <div className="stats" style={{ gap: 6 }}>
        <button className="wpn-roll" title="Attack roll" onClick={() => ctx.roll({ count: 1, sides: 20, modifier: hitMod, label: "1d20" + (w.hit || ""), type: w.n + " attack" })}>{w.hit}</button>
        {dmg && <button className="wpn-roll" title="Damage roll" onClick={() => ctx.roll({ ...dmg, label: w.dmg, type: w.n + " damage" })}>{w.dmg}</button>}
      </div>
    </div>
  );
}
function CombatView({ ctx }) {
  return (
    <>
      <div className="sec">
        <div className="sec-h"><span>Weapons</span></div>
        {C.weapons.map((w) => <WeaponRow key={w.n} w={w} ctx={ctx} />)}
      </div>
      <div className="sec">
        <div className="sec-h"><span>Cantrips</span><span style={{letterSpacing:".02em",textTransform:"none",fontWeight:600}}>at will</span></div>
        {C.cantrips.map((c) => {
          const dice = parseDice(c.tag);
          const doRoll = () => dice && ctx.roll({ ...dice, label: dice.count + "d" + dice.sides, type: c.n });
          return (
            <div className="item tappable" key={c.n} onClick={doRoll}>
              <div className="main"><div className="in">{c.n}</div><div className="im">{c.meta}</div></div>
              <div className="stats">{c.tag && <button className="tag roll ghost" onClick={(e) => { e.stopPropagation(); doRoll(); }}>{c.tag}</button>}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
function MagicView({ ctx }) {
  return (
    <>
      <div className="sec">
        <div className="sec-h"><span>Abilities</span><span style={{letterSpacing:".02em"}}>DC {C.spellDC} · ATK {C.spellAtk}</span></div>
        {C.abilities.map((a) => {
          const maxM = String(a.tag || "").match(/(\d+)\s*\/\s*(\d+)/);
          const max = maxM ? parseInt(maxM[2], 10) : null;
          const used = ctx.abilUses[a.n] || 0;
          const left = max != null ? max - used : null;
          const passive = /passive/i.test(a.tag || "");
          return (
            <div className="item" key={a.n}>
              <div className="main">
                <div className="in tappable" onClick={() => ctx.info(a.n, descOf(ABILITY_DESCRIPTIONS, a.n, a.meta))}>{a.n} <span className="qmark">?</span></div>
                {left != null && <div className="im">{left}/{max} uses left</div>}
              </div>
              {!passive && (
                <button className="row-roll" disabled={left != null && left <= 0} onClick={() => ctx.useAbility(a)}>
                  {parseDice(a.meta) || parseDice(a.tag) ? "ROLL" : "USE"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {Object.keys(C.spells).map((lv) => (
        <div className="sec" key={lv}>
          <div className="sec-h"><span>Level {lv} Spells</span></div>
          {C.spells[lv].map((sp) => (
            <div className="item" key={sp.n}>
              <div className="main"><div className="in tappable" onClick={() => ctx.info(sp.n, descOf(SPELL_DESCRIPTIONS, sp.n, sp.tag))}>{sp.n} <span className="qmark">?</span></div></div>
              <button className="row-roll" onClick={() => ctx.openCast(sp, parseInt(lv, 10))}>CAST</button>
            </div>
          ))}
        </div>
      ))}
      <div className="sec">
        <div className="sec-h"><span>Consumables</span></div>
        {C.consumables.map((c) => {
          const left = (c.qty || 0) - (ctx.consumed[c.n] || 0);
          return (
            <div className="item" key={c.n}>
              <div className="qty">×{left}</div>
              <div className="main"><div className="in">{c.n}</div><div className="im">{c.meta}</div></div>
              <button className="row-roll" disabled={left <= 0} onClick={() => ctx.consumeItem(c)}>CONSUME</button>
            </div>
          );
        })}
      </div>
    </>
  );
}
// ---- live inventory (real Firebase data) ----
function useLiveInv() {
  return useGameStore((s) => s.characters[LAB_CHAR_KEY]?.inventory) || {};
}
const invAdd = (item) => { try { useGameStore.getState().addInventoryItem(LAB_CHAR_KEY, item); } catch (e) { /* ignore */ } };
const invRemove = (itemKey) => { try { useGameStore.getState().removeInventoryItem(LAB_CHAR_KEY, itemKey); } catch (e) { /* ignore */ } };
const invConsume = (itemKey, item) => {
  const amt = item.amount ?? 1;
  if (amt <= 1) useGameStore.getState().removeInventoryItem(LAB_CHAR_KEY, itemKey);
  else useGameStore.getState().setAt(`characters/${LAB_CHAR_KEY}/inventory/${itemKey}/amount`, amt - 1);
};

// one live inventory row: optional damage roll, amount, consume, slide-to-delete
function InvRow({ itemKey, item, ctx, kind }) {
  const dice = parseDice(item.damageDice);
  const sub = item.damageDice ? `${item.damageDice}${item.damageType ? " " + item.damageType : ""}` : item.ac ? `AC ${item.ac}` : item.notes || "";
  return (
    <div className="item">
      {item.amount > 1 && <div className="qty">×{item.amount}</div>}
      <div className="main"><div className="in">{item.name}</div>{sub && <div className="im">{sub}</div>}</div>
      <div className="stats" style={{ gap: 4 }}>
        {dice && <button className="tag roll" onClick={() => ctx.roll({ ...dice, label: item.damageDice, type: item.name + " damage" })}>{item.damageDice}</button>}
        {kind === "consumables" && <button className="row-roll" onClick={() => invConsume(itemKey, item)}>USE</button>}
        <button className="inv-del" title="Delete" onClick={() => ctx.requestDelete(itemKey, item.name)}><S><path d="M6 6l12 12M18 6L6 18"/></S></button>
      </div>
    </div>
  );
}
function InvList({ ctx, title, cats, kind }) {
  const inv = useLiveInv();
  const rows = Object.entries(inv).filter(([, it]) => cats.includes((it && it.category) || "other"));
  return (
    <div className="sec">
      <div className="sec-h"><span>{title}</span></div>
      {rows.length === 0 && <div className="im" style={{ padding: "8px 2px" }}>Nothing here yet.</div>}
      {rows.map(([k, it]) => <InvRow key={k} itemKey={k} item={it} ctx={ctx} kind={kind} />)}
    </div>
  );
}
function ArmourView({ ctx }) {
  return <InvList ctx={ctx} title="Worn & Carried" cats={["armour"]} kind="armour" />;
}
function WeaponsView({ ctx }) {
  return <InvList ctx={ctx} title="Weapons" cats={["weapons"]} kind="weapons" />;
}
function CashView() {
  const c = C.coins;
  const total = (c.pp * 10 + c.gp + c.sp / 10 + c.cp / 100).toFixed(2);
  const rows = [["Platinum", "pp", c.pp], ["Gold", "gp", c.gp], ["Silver", "sp", c.sp], ["Copper", "cp", c.cp]];
  return (
    <div className="sec">
      <div className="sec-h"><span>Purse</span><span style={{ letterSpacing:".02em", textTransform:"none", fontWeight:600 }}>{total} gp total</span></div>
      {rows.map(([name, k, v]) => (
        <div className="item" key={k}>
          <div className="qty">{k}</div>
          <div className="main"><div className="in">{name}</div></div>
          <div className="stats"><span className="tag">{v}</span></div>
        </div>
      ))}
    </div>
  );
}
function MiscView({ ctx }) {
  return <InvList ctx={ctx} title="Tools & Sundries" cats={["tools", "loot", "other", "misc"]} kind="misc" />;
}
function InvConsumablesView({ ctx }) {
  return <InvList ctx={ctx} title="Potions & Herbs" cats={["consumables"]} kind="consumables" />;
}
// Add-item form: name + qty + category; weapons/armour collect extra stats.
// Writes straight to the live Firebase inventory (the legacy app's flow).
const ADD_CATS = ["weapons", "armour", "tools", "loot", "consumables", "other"];
const DMG_TYPES = ["slashing", "piercing", "bludgeoning", "fire", "cold", "lightning", "acid", "poison", "necrotic", "radiant", "psychic", "thunder", "force"];
function AddView() {
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [cat, setCat] = useState("consumables");
  const [step, setStep] = useState("form"); // form | stats
  const [count, setCount] = useState(1);
  const [die, setDie] = useState("d6");
  const [dmgType, setDmgType] = useState("slashing");
  const [ac, setAc] = useState(10);
  const [notes, setNotes] = useState("");
  const reset = () => { setName(""); setQty(1); setNotes(""); setStep("form"); };

  const submit = () => {
    const n = name.trim();
    if (!n) return;
    if (cat === "weapons" || cat === "armour") { setStep("stats"); return; }
    invAdd({ name: n, amount: Math.max(1, qty), category: cat });
    reset();
  };
  const confirmStats = () => {
    const item = { name: name.trim(), amount: Math.max(1, qty), category: cat };
    if (cat === "weapons") { item.damageDice = `${count}${die}`; item.damageType = dmgType; }
    else item.ac = parseInt(ac, 10) || 10;
    if (notes.trim()) item.notes = notes.trim();
    invAdd(item);
    reset();
  };

  if (step === "stats") {
    return (
      <div className="addview">
        <div className="add-t">{cat === "weapons" ? "Weapon stats" : "Armour stats"}</div>
        {cat === "weapons" ? (
          <>
            <div className="add-row"><span className="add-lbl">Damage</span>
              <input className="add-num" type="number" min="1" max="20" value={count} onChange={(e) => setCount(e.target.value)} />
              <select className="add-sel" value={die} onChange={(e) => setDie(e.target.value)}>{["d4", "d6", "d8", "d10", "d12", "d20"].map((d) => <option key={d}>{d}</option>)}</select>
            </div>
            <div className="add-row"><span className="add-lbl">Type</span>
              <select className="add-sel" value={dmgType} onChange={(e) => setDmgType(e.target.value)}>{DMG_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
            </div>
          </>
        ) : (
          <div className="add-row"><span className="add-lbl">AC</span>
            <input className="add-num" type="number" min="1" max="30" value={ac} onChange={(e) => setAc(e.target.value)} />
          </div>
        )}
        <textarea className="add-notes" placeholder="Other info…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="add-actions">
          <button className="add-opt" onClick={confirmStats}>Add to sack</button>
          <button className="add-opt ghost" onClick={() => setStep("form")}>Back</button>
        </div>
      </div>
    );
  }
  return (
    <div className="addview">
      <div className="add-ico">{ICON.add}</div>
      <div className="add-t">Add an item</div>
      <div className="add-row"><input className="add-name" placeholder="Item name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} /></div>
      <div className="add-row">
        <input className="add-num" type="number" min="1" value={qty} onChange={(e) => setQty(parseInt(e.target.value) || 1)} />
        <select className="add-sel" value={cat} onChange={(e) => setCat(e.target.value)}>{ADD_CATS.map((c) => <option key={c} value={c}>{c}</option>)}</select>
      </div>
      <div className="add-actions"><button className="add-opt" onClick={submit}>{cat === "weapons" || cat === "armour" ? "Next: stats" : "Add to sack"}</button></div>
    </div>
  );
}

const VIEW = { skills: SkillsView, combat: CombatView, magic: MagicView,
  armour: ArmourView, weapons: WeaponsView, cash: CashView, misc: MiscView, consumables: InvConsumablesView, add: AddView };

/* ---------- saving throws + conditions panels ---------- */
function SavesView({ rolls, roll }) {
  const pb = parseInt(C.prof, 10);
  return (
    <React.Fragment>
      {C.stats.map((s) => {
        const base = parseInt(s.mod, 10);
        const prof = C.saveProf.includes(s.key);
        const total = base + (prof ? pb : 0);
        const f = (total >= 0 ? "+" : "") + total;
        const r = rolls[s.key];
        return (
          <div className="srow" key={s.key}>
            <span className={"sdia" + (prof ? " on" : "")} />
            <span className="skey">{s.key}</span>
            <span className="smod">{f}</span>
            <span className="sname">{STAT_NAMES[s.key]}</span>
            <button className={"sroll" + (r ? " hit" : "")} onClick={() => roll(s.key, total)}>
              {r ? r.total : "ROLL"}
            </button>
          </div>
        );
      })}
    </React.Fragment>
  );
}
function ConditionsView({ conds, toggle, info }) {
  return (
    <React.Fragment>
      {CONDITIONS.map((c) => (
        <div className="crow" key={c}>
          <span className={"cname tappable" + (conds[c] ? " on" : "")} onClick={() => info(c, CONDDESC[c] || "No description available.")}>{c} <span className="qmark">?</span></span>
          <span className={"sw" + (conds[c] ? " on" : "")} onClick={() => toggle(c)} />
        </div>
      ))}
    </React.Fragment>
  );
}

/* ---------- health orb (liquid-filled) ---------- */
function HealthOrb() {
  const frac = Math.max(0, Math.min(1, C.hp.cur / C.hp.max));
  const chg = (d) => { try { useGameStore.getState().changeHp(LAB_CHAR_KEY, d); } catch (e) { /* ignore */ } };
  return (
    <div className="orb-wrap">
      <div className="orb" title={`${C.hp.cur} / ${C.hp.max} HP`}>
        <div className="liquid" style={{ "--fill": (frac * 100) + "%" }} />
        <div className="gloss" />
        <span className="orb-num">{C.hp.cur}</span>
      </div>
      <div className="hp-pm">
        <button onClick={() => chg(-1)} aria-label="Lose 1 HP">−</button>
        <button onClick={() => chg(1)} aria-label="Gain 1 HP">+</button>
      </div>
    </div>
  );
}

/* ---------- spell wheel (each chunk = one slot) ---------- */
function SpellWheel({ slots, toggle }) {
  const flat = [];
  C.spellSlots.forEach((s, li) => slots[li].forEach((spent, pi) => flat.push({ li, pi, level: s.level, spent })));
  const N = flat.length;
  const cx = 29, cy = 29, rOut = 27, rIn = 14.5, gap = 6;
  const seg = (360 - N * gap) / N;
  // darker = higher spell-slot level (gold ramp, supports levels 1-9)
  const shadeRamp = ["#efd089", "#e3bd6a", "#d0a44b", "#ba8d37", "#a37828", "#8a631d", "#704f15", "#583e10", "#422f0b"];
  const shadeFor = (lv) => shadeRamp[Math.max(0, Math.min(8, lv - 1))];
  const remaining = flat.filter((f) => !f.spent).length;
  const rad = (d) => (d - 90) * Math.PI / 180;
  const pt = (r, d) => [cx + r * Math.cos(rad(d)), cy + r * Math.sin(rad(d))];
  const arc = (a0, a1) => {
    const [x0, y0] = pt(rOut, a0), [x1, y1] = pt(rOut, a1);
    const [x2, y2] = pt(rIn, a1), [x3, y3] = pt(rIn, a0);
    const big = a1 - a0 > 180 ? 1 : 0;
    return `M${x0} ${y0} A${rOut} ${rOut} 0 ${big} 1 ${x1} ${y1} L${x2} ${y2} A${rIn} ${rIn} 0 ${big} 0 ${x3} ${y3} Z`;
  };
  return (
    <svg className="wheel" viewBox="0 0 58 58" width="56" height="56" title={`${remaining} spell slots left`}>
      {flat.map((f, i) => {
        const a0 = i * (seg + gap) + gap / 2, a1 = a0 + seg;
        return (
          <path key={i} d={arc(a0, a1)}
            fill={f.spent ? "#241a12" : shadeFor(f.level)}
            stroke={f.spent ? "var(--line-strong)" : "none"} strokeWidth="1.4"
            style={{ cursor: "pointer" }} onClick={() => toggle(f.li, f.pi)} />
        );
      })}
      <circle cx={cx} cy={cy} r="11.5" fill="#120d0a" stroke="var(--gold-2)" strokeWidth="1.4" />
      <text x={cx} y={cy + 0.5} textAnchor="middle" dominantBaseline="central"
        fill="var(--gold)" fontFamily="var(--mono)" fontSize="13" fontWeight="700">{remaining}</text>
    </svg>
  );
}

/* ---------- journal (tab 3): dice roller, roll log, notes ---------- */
const DICE = [
  { label:"d4",  sides:4,   poly:"12,3 21,20 3,20" },
  { label:"d6",  sides:6,   poly:"4.5,4.5 19.5,4.5 19.5,19.5 4.5,19.5" },
  { label:"d8",  sides:8,   poly:"12,2 21,12 12,22 3,12" },
  { label:"d10", sides:10,  poly:"12,2 19,10 12,22 5,10" },
  { label:"d12", sides:12,  poly:"12,2.5 20.5,9 17,20.5 7,20.5 3.5,9" },
  { label:"d20", sides:20,  poly:"6,4.5 18,4.5 22,12 18,19.5 6,19.5 2,12" },
  { label:"d%",  sides:100, poly:"12,2 20,7 20,17 12,22 4,17 4,7" },
];
const DieShape = ({ poly, size }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
    <polygon points={poly} />
  </svg>
);
function relTime(t) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 8) return "just now";
  if (s < 60) return s + "s";
  if (s < 3600) return Math.floor(s / 60) + "m";
  if (s < 86400) return Math.floor(s / 3600) + "h";
  return Math.floor(s / 86400) + "d";
}

function JournalTab({ history, pushRoll, clearHistory, notes, setNotes }) {
  const [pane, setPane] = useState("log");
  const [last, setLast] = useState(null);
  const [pop, setPop] = useState(0);
  const spinRef = useRef(null);
  useEffect(() => () => clearInterval(spinRef.current), []);

  const roll = async (die) => {
    // Animate the real 3D physics dice (same roller as the HTML/legacy version);
    // fall back to a plain RNG roll if the dice box can't load.
    setLast({ label: die.label, sides: die.sides, rolling: true });
    let value;
    try {
      const vals = await rollLabDice(`1d${die.sides}`);
      value = Array.isArray(vals) && vals.length ? vals[0] : 1 + Math.floor(Math.random() * die.sides);
    } catch {
      value = 1 + Math.floor(Math.random() * die.sides);
    }
    const crit = die.sides === 20 ? (value === 20 ? "max" : value === 1 ? "min" : null) : null;
    setLast({ label: die.label, sides: die.sides, value, crit, rolling: false });
    setPop((p) => p + 1);
    pushRoll({ sides: die.sides, label: die.label, value, src: "manual" });
    // LIVE: log to the shared dice log so the DM screen sees the roll
    try {
      useGameStore.getState().pushDiceLog({
        character: C.name, charKey: LAB_CHAR_KEY, label: die.label, result: value, type: "Manual Roll",
      });
    } catch { /* ignore */ }
  };

  const critCls = last && !last.rolling && last.crit ? " crit-" + last.crit : "";
  return (
    <div className="journal">
      <div className="jroller">
        <div className="jh">Manual Roll</div>
        <div className="die-row">
          {DICE.map((d) => (
            <button className="die" key={d.label} onClick={() => roll(d)}>
              <DieShape poly={d.poly} size={26} />
              <span className="dl">{d.label}</span>
            </button>
          ))}
        </div>
        <div className={"readout" + critCls} key={pop}>
          {last && !last.rolling && last.crit === "max" && <span className="crit-tag" style={{ color: "var(--gold)" }}>★ CRITICAL ★</span>}
          {last && !last.rolling && last.crit === "min" && <span className="crit-tag" style={{ color: "var(--blood)" }}>FUMBLE</span>}
          <span className={"rv" + (last && !last.rolling ? " pop" : "")}>{last ? last.value : "—"}</span>
          <span className="rl">{last ? (last.rolling ? "rolling " + last.label + "…" : "rolled " + last.label) : "tap a die to roll"}</span>
        </div>
      </div>

      <div className="jtoggle">
        <button className={pane === "log" ? "on" : ""} onClick={() => setPane("log")}>Roll Log</button>
        <button className={pane === "notes" ? "on" : ""} onClick={() => setPane("notes")}>Notes</button>
      </div>

      <div className="jpane">
        {pane === "log" ? (
          history.length === 0 ? (
            <div className="rlog"><div className="empty">No rolls yet.<br/>Cast a die above, or roll a saving throw.</div></div>
          ) : (
            <div className="rlog">
              <button className="rlog-clear" onClick={clearHistory}>✕ clear log</button>
              {history.map((h) => {
                const critCls2 = h.sides === 20 ? (h.value === 20 ? " max" : h.value === 1 ? " min" : "") : "";
                return (
                  <div className="rlog-row" key={h.id}>
                    <span className="rlog-die">{h.label}</span>
                    <span className={"rlog-val" + critCls2}>{h.value}{h.total != null && h.total !== h.value ? <span className="rlog-tot"> → {h.total}</span> : null}</span>
                    <span className="rlog-src">{h.note || "manual roll"}</span>
                    <span className="rlog-time">{relTime(h.t)}</span>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <textarea className="notes-area" value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Quest notes, NPCs met, clues, loot owed…" spellCheck={false} />
        )}
      </div>
    </div>
  );
}

/* ---------- main app ---------- */
function App() {
  const CARDS = cardsFor(C);
  const phoneRef = useRef(null);
  const closeTimer = useRef(null);
  const [tab, setTab] = useState(1);
  const [sackOpen, setSackOpen] = useState(false);
  const [expanded, setExpanded] = useState(null); // {card, cx, cy, rot}
  const [open, setOpen] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // saves / conditions panels
  const [panel, setPanel] = useState(null);
  const [pOpen, setPOpen] = useState(false);
  const pTimer = useRef(null);
  const [rolls, setRolls] = useState({});
  const [statRoll, setStatRoll] = useState(null); // {key, d, total} flashed on a stat tile
  const [conds, setConds] = useState({});

  // journal: roll history + notes (persisted)
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`${LAB_CHAR_KEY}_roll_history`)) || []; } catch (e) { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem(`${LAB_CHAR_KEY}_roll_history`, JSON.stringify(history.slice(0, 80))); } catch (e) {}
  }, [history]);
  const pushRoll = useCallback((entry) => {
    setHistory((h) => [{ id: Date.now() + "-" + Math.random().toString(36).slice(2, 6), t: Date.now(), ...entry }, ...h].slice(0, 80));
  }, []);
  const clearHistory = useCallback(() => setHistory([]), []);
  const [notes, setNotes] = useState(() => {
    try {
      const liveC = useGameStore.getState().characters[LAB_CHAR_KEY];
      if (liveC && typeof liveC.notes === "string") return liveC.notes;
      return localStorage.getItem(`${LAB_CHAR_KEY}_journal_notes`) || "";
    } catch (e) { return ""; }
  });
  const notesTimer = useRef(null);
  useEffect(() => {
    // auto-hard-save: localStorage immediately + debounced to the live store so
    // notes persist between sessions and devices
    try { localStorage.setItem(`${LAB_CHAR_KEY}_journal_notes`, notes); } catch (e) {}
    clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      try { useGameStore.getState().saveNotes(LAB_CHAR_KEY, notes); } catch (e) {}
    }, 700);
    return () => clearTimeout(notesTimer.current);
  }, [notes]);
  const openPanel = (id) => { clearTimeout(pTimer.current); setPanel(id); };
  const closePanel = useCallback(() => {
    setPOpen(false);
    clearTimeout(pTimer.current);
    pTimer.current = setTimeout(() => setPanel(null), 320);
  }, []);
  useEffect(() => {
    if (!panel) return;
    const t = setTimeout(() => setPOpen(true), 20);
    return () => clearTimeout(t);
  }, [panel]);
  const rollSave = async (key, mod) => {
    let d;
    try { const vals = await rollLabDice("1d20"); d = Array.isArray(vals) && vals.length ? vals[0] : 1 + Math.floor(Math.random() * 20); }
    catch { d = 1 + Math.floor(Math.random() * 20); }
    const total = d + mod;
    const modStr = (mod >= 0 ? "+" : "") + mod;
    setRolls((r) => ({ ...r, [key]: { d, total } }));
    pushRoll({ sides: 20, label: "d20" + modStr, value: d, total, src: "save", note: key + " save" });
    try { useGameStore.getState().pushDiceLog({ character: C.name, charKey: LAB_CHAR_KEY, label: "1d20" + modStr, result: total, type: key + " Save", modifier: mod }); } catch { /* ignore */ }
    setTimeout(() => setRolls((r) => { const n = { ...r }; delete n[key]; return n; }), 2400);
  };
  // Ability check: tap a stat tile → roll the 3D dice (d20 + that stat's mod),
  // flash the total on the tile, log it locally + to the shared dice log.
  const rollStat = async (key, mod) => {
    let value;
    try {
      const vals = await rollLabDice("1d20");
      value = Array.isArray(vals) && vals.length ? vals[0] : 1 + Math.floor(Math.random() * 20);
    } catch {
      value = 1 + Math.floor(Math.random() * 20);
    }
    const total = value + mod;
    const modStr = (mod >= 0 ? "+" : "") + mod;
    setStatRoll({ key, d: value, total });
    pushRoll({ sides: 20, label: "d20" + modStr, value, total, src: "check", note: key + " check" });
    try {
      useGameStore.getState().pushDiceLog({
        character: C.name, charKey: LAB_CHAR_KEY, label: "1d20" + modStr, result: total, type: key + " Check", modifier: mod,
      });
    } catch { /* ignore */ }
    setTimeout(() => setStatRoll((s) => (s && s.key === key ? null : s)), 2600);
  };
  const toggleCond = (c) => setConds((p) => ({ ...p, [c]: !p[c] }));

  // spell slots: boolean array per level (true = expended)
  const [slots, setSlots] = useState(() =>
    C.spellSlots.map((s) => Array.from({ length: s.total }, (_, i) => i < s.used))
  );
  const toggleSlot = (li, pi) => setSlots((prev) => {
    const next = prev.map((a) => a.slice());
    next[li][pi] = !next[li][pi];
    return next;
  });

  // ---- shared interactivity (descriptions, generic rolls, spells, abilities) ----
  const [info, setInfo] = useState(null);       // {title, body} description pop-out
  const [castPick, setCastPick] = useState(null); // {spell, options:[{level, n, free}]}
  const [rollToast, setRollToast] = useState(null); // {label, total, sub, crit}
  const [delTarget, setDelTarget] = useState(null); // {itemKey, name} slide-to-delete
  const [abilUses, setAbilUses] = useState({});   // ability name -> uses spent
  const [consumed, setConsumed] = useState({});   // consumable name -> count consumed
  const showInfo = useCallback((title, body) => setInfo({ title, body }), []);

  // Generic 3D roll: rolls the dice, flashes a toast, logs locally + to shared log.
  const rollThing = useCallback(async ({ label, count = 1, sides = 20, modifier = 0, type, note }) => {
    let value;
    try {
      const vals = await rollLabDice(`${count}d${sides}`);
      value = Array.isArray(vals) && vals.length ? vals.reduce((a, b) => a + b, 0) : null;
    } catch { value = null; }
    if (value == null) { let s = 0; for (let i = 0; i < count; i++) s += 1 + Math.floor(Math.random() * sides); value = s; }
    const total = value + modifier;
    const crit = count === 1 && sides === 20 ? (value === 20 ? "max" : value === 1 ? "min" : null) : null;
    setRollToast({ label: label || `${count}d${sides}`, total, sub: type || note || "", crit });
    setTimeout(() => setRollToast((t) => (t && t.total === total && t.label === (label || `${count}d${sides}`) ? null : t)), 2600);
    pushRoll({ sides, label: label || `${count}d${sides}`, value, total, src: "roll", note: type || note });
    try {
      useGameStore.getState().pushDiceLog({ character: C.name, charKey: LAB_CHAR_KEY, label: label || `${count}d${sides}`, result: total, type: type || note || "Roll", modifier });
    } catch { /* ignore */ }
  }, [pushRoll]);

  // spell-slot bookkeeping (slots state is boolean[level][pip], true = spent)
  const slotsFreeAtIndex = (li) => slots[li]?.filter((x) => !x).length || 0;
  // cast a spell: open a level picker (>= base level), greying out empty slot types
  const openCast = (spell, baseLevel) => {
    const options = C.spellSlots
      .map((s, li) => ({ level: s.level, li, free: slotsFreeAtIndex(li) }))
      .filter((o) => o.level >= baseLevel);
    if (options.length === 0) { setRollToast({ label: spell.n, total: "—", sub: "no slots", crit: null }); setTimeout(() => setRollToast(null), 1800); return; }
    setCastPick({ spell, baseLevel, options });
  };
  const confirmCast = (opt) => {
    if (opt.free <= 0) return;
    setSlots((prev) => {
      const next = prev.map((a) => a.slice());
      const pi = next[opt.li].findIndex((x) => !x);
      if (pi >= 0) next[opt.li][pi] = true;
      return next;
    });
    setCastPick(null);
    const dice = parseDice(castPick.spell.tag) || parseDice(castPick.spell.dmg);
    if (dice) rollThing({ ...dice, label: `${dice.count}d${dice.sides}`, type: `${castPick.spell.n} (lvl ${opt.level})` });
    else { setRollToast({ label: castPick.spell.n, total: "✦", sub: `cast at level ${opt.level}`, crit: null }); setTimeout(() => setRollToast(null), 2200); }
  };

  // ability use: parse "x/y" from tag for finite uses; roll any dice in meta/tag
  const useAbility = (a) => {
    const maxM = String(a.tag || "").match(/(\d+)\s*\/\s*(\d+)/);
    const dice = parseDice(a.meta) || parseDice(a.tag);
    if (maxM) {
      const max = parseInt(maxM[2], 10);
      const used = abilUses[a.n] || 0;
      if (used >= max) return;
      setAbilUses((u) => ({ ...u, [a.n]: used + 1 }));
    }
    if (dice) rollThing({ ...dice, label: `${dice.count}d${dice.sides}`, type: a.n });
    else { setRollToast({ label: a.n, total: "✦", sub: "used", crit: null }); setTimeout(() => setRollToast(null), 1800); }
  };

  const consumeItem = (c) => setConsumed((p) => ({ ...p, [c.n]: (p[c.n] || 0) + 1 }));

  const ctx = {
    roll: rollThing, info: showInfo, slots, slotsFreeAtIndex, openCast,
    abilUses, useAbility, consumed, consumeItem,
    requestDelete: (itemKey, name) => setDelTarget({ itemKey, name }),
  };

  const openCard = useCallback((card, e) => {
    clearTimeout(closeTimer.current);
    const ph = phoneRef.current.getBoundingClientRect();
    const r = e.currentTarget.getBoundingClientRect();
    setShowContent(false);
    setOpen(false);
    setExpanded({
      card,
      cx: r.left + r.width / 2 - ph.left,
      cy: r.top + r.height / 2 - ph.top,
      rot: parseFloat(e.currentTarget.dataset.rot || "0"),
      spin: tab === 1,
    });
  }, [tab]);

  useEffect(() => {
    if (!expanded) return;
    const t1 = setTimeout(() => setOpen(true), 20);
    const t2 = setTimeout(() => setShowContent(true), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [expanded]);

  const closeCard = useCallback(() => {
    setShowContent(false);
    setOpen(false);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setExpanded(null), 560);
  }, []);

  const switchTab = (id) => {
    setTab(id);
    setSackOpen(false);
    clearTimeout(closeTimer.current);
    setShowContent(false); setOpen(false); setExpanded(null);
  };

  const sheetStyle = (() => {
    if (!expanded) return {};
    if (open) return { left: 23, top: 85, width: 347, height: 682, borderRadius: 26, transform: `perspective(1100px) rotate(0deg) rotateY(${expanded.spin ? 360 : 0}deg)` };
    return {
      left: expanded.cx - CARD_W / 2, top: expanded.cy - CARD_H / 2,
      width: CARD_W, height: CARD_H, borderRadius: 19,
      transform: `perspective(1100px) rotate(${expanded.rot}deg) rotateY(0deg)`,
    };
  })();

  const card = expanded && expanded.card;
  const Body = card && VIEW[card.id];
  const hpPct = Math.round((C.hp.cur / C.hp.max) * 100);
  // armour AC bonus (sum of "+N AC" from worn armour) shown bracketed next to natural AC
  const armourBonus = (C.armour || []).reduce((s, a) => {
    const m = String(a.ac).match(/^\s*([+-]\d+)/); // only explicit "+N"/"-N" bonuses
    return s + (m ? parseInt(m[1], 10) : 0);
  }, 0);

  return (
    <div className="phone" ref={phoneRef}>
      {/* 3D dice roll surface — clipped to the phone screen */}
      <div className="lab-dice" id="lab-dice-box" />
      <div className="statusbar"><span>9:41</span><div className="dots"><i/><i/><i/></div></div>

      <div className="topbar">
        <div className="cluster">
          <HealthOrb />
          <div className="glyph angel" onClick={() => openPanel("saves")} title="Saving Throws">{GLYPH.angel}</div>
        </div>
        <div className="navset">
          {TABS.map((t) => (
            <div key={t.id} className={"tab" + (tab === t.id ? " active" : "")} onClick={() => switchTab(t.id)} title={t.label}>{t.el}</div>
          ))}
        </div>
        <div className="cluster">
          <div className="glyph demon" onClick={() => openPanel("conditions")} title="Conditions">{GLYPH.demon}</div>
          <SpellWheel slots={slots} toggle={toggleSlot} />
        </div>
      </div>

      {tab === 1 ? (
        <React.Fragment>
          <div className="charline">
            <span className="cn">{C.name}</span>
            <span className="cc">{C.race ? `${C.race} · ${C.klass}` : C.klass}</span>
            <div className="charstats">
              <span className="cbadge"><span className="bk">AC</span><span className="bv">{C.ac}{armourBonus ? `(${armourBonus >= 0 ? "+" : ""}${armourBonus})` : ""}</span></span>
              <span className="cbadge"><span className="bk">Level</span><span className="bv">{C.level}</span></span>
            </div>
          </div>

          <div className="body">
            <div className="stat-grid">
              {C.stats.map((s) => {
                const rolled = statRoll && statRoll.key === s.key;
                return (
                  <div className={"stat" + (rolled ? " rolled" : "")} key={s.key}
                    onClick={() => rollStat(s.key, parseInt(s.mod, 10) || 0)} title={`Roll ${s.key} check`}>
                    {rolled ? (
                      <React.Fragment>
                        <span className="mod">{statRoll.total}</span>
                        <span className="k">{s.key} CHECK</span>
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <span className="sc">{s.score}</span>
                        <span className="mod">{s.mod}</span>
                        <span className="k">{s.key}</span>
                      </React.Fragment>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </React.Fragment>
      ) : tab === 2 ? (
        sackOpen ? (
          <div className="inv">
            <div className="ring">
              <div
                className="inv-item center"
                data-rot="0"
                onClick={(e) => openCard(INV_CENTER, e)}
                style={{ left: 106, top: 106, animationDelay: "0ms",
                  visibility: expanded && expanded.card.id === INV_CENTER.id ? "hidden" : "visible" }}
              >
                <div className="disc" style={{ background: INV_CENTER.color }}>{ICON[INV_CENTER.id]}</div>
                <div className="ilabel">{INV_CENTER.title}</div>
              </div>
              {INV_RING.map((it, i) => {
                const p = ringPos(it.angle, 110, 64);
                return (
                  <div
                    key={it.id}
                    className={"inv-item" + (it.id === "add" ? " add" : "")}
                    data-rot="0"
                    onClick={(e) => openCard(it, e)}
                    style={{ left: p.left, top: p.top, animationDelay: (90 + i * 60) + "ms",
                      visibility: expanded && expanded.card.id === it.id ? "hidden" : "visible" }}
                  >
                    <div className="disc" style={{ background: it.color }}>{ICON[it.id]}</div>
                    <div className="ilabel">{it.title}</div>
                  </div>
                );
              })}
            </div>
            <button className="tie" onClick={() => setSackOpen(false)}>Tie up sack</button>
          </div>
        ) : (
          <div className="inv">
            <div className="sack-wrap" onClick={() => setSackOpen(true)}>
              <div className="sack">{SACK}</div>
              <div className="sack-label">Tap to open your sack</div>
            </div>
          </div>
        )
      ) : tab === 3 ? (
        <JournalTab history={history} pushRoll={pushRoll} clearHistory={clearHistory} notes={notes} setNotes={setNotes} />
      ) : (
        <div className="tabpage">
          <div className="ph-icon">{TABS[tab - 1].el}</div>
          <div className="ph-title">{TABS[tab - 1].label}</div>
          <div className="ph-sub">Coming soon</div>
        </div>
      )}

      {tab === 1 && (
        <div className="hint" style={{ opacity: expanded ? 0 : 1 }}>Tap a card to open</div>
      )}

      {tab === 1 && (
        <div className="fan">
          {CARDS.map((c, i) => (
            <div
              key={c.id}
              className="card"
              data-rot={FAN[i].rot}
              onClick={(e) => openCard(c, e)}
              style={{
                left: FAN[i].left, bottom: FAN[i].bottom, zIndex: FAN[i].z,
                transform: `rotate(${FAN[i].rot}deg)`,
                visibility: expanded && expanded.card.id === c.id ? "hidden" : "visible",
              }}
            >
              <div className="cap" style={{ background: c.color }}>{ICON[c.id]}</div>
            </div>
          ))}
        </div>
      )}

      <div className={"scrim" + ((open || pOpen) ? " open" : "")} onClick={() => { if (panel) closePanel(); if (expanded) closeCard(); }} />

      {panel && (
        <div className={"panel" + (pOpen ? " open" : "")}>
          <div className="p-head" style={{ background: PANELS[panel].color }}>
            <div className="p-wm">{GLYPH[PANELS[panel].glyph]}</div>
            <button className="p-close" onClick={closePanel} aria-label="Close">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
            <div className="p-title">{PANELS[panel].title}</div>
          </div>
          <div className="p-body">
            {panel === "saves"
              ? <SavesView rolls={rolls} roll={rollSave} />
              : <ConditionsView conds={conds} toggle={toggleCond} info={showInfo} />}
          </div>
        </div>
      )}

      {expanded && (
        <div className="sheet" style={sheetStyle}>
          <div className="s-head" style={{ background: card.color, height: open ? 132 : "48%" }}>
            <div className="wm">{ICON[card.id]}</div>
            <button className="s-close" onClick={closeCard} aria-label="Close" style={{ opacity: showContent ? 1 : 0 }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
            <div className="s-title" style={{ opacity: showContent ? 1 : 0 }}>
              <div className="t">{card.title.replace("\n", " ")}</div>
            </div>
          </div>
          {showContent && Body && (
            <div className="s-body"><Body ctx={ctx} /></div>
          )}
        </div>
      )}

      {/* description pop-out */}
      {info && (
        <div className="lab-pop-backdrop" onClick={() => setInfo(null)}>
          <div className="lab-pop" onClick={(e) => e.stopPropagation()}>
            <div className="lab-pop-title">{info.title}</div>
            <div className="lab-pop-body">{info.body}</div>
            <button className="lab-pop-x" onClick={() => setInfo(null)}>Close</button>
          </div>
        </div>
      )}

      {/* spell-slot level picker */}
      {castPick && (
        <div className="lab-pop-backdrop" onClick={() => setCastPick(null)}>
          <div className="lab-pop" onClick={(e) => e.stopPropagation()}>
            <div className="lab-pop-title">Cast {castPick.spell.n}</div>
            <div className="lab-pop-body">Choose a spell slot level:</div>
            <div className="cast-opts">
              {castPick.options.map((o) => (
                <button key={o.li} className="cast-opt" disabled={o.free <= 0} onClick={() => confirmCast(o)}>
                  Level {o.level} <span className="cast-free">{o.free} left</span>
                </button>
              ))}
            </div>
            <button className="lab-pop-x" onClick={() => setCastPick(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* transient roll result toast */}
      {rollToast && (
        <div className={"lab-toast" + (rollToast.crit === "max" ? " crit-max" : rollToast.crit === "min" ? " crit-min" : "")}>
          <div className="lt-total">{rollToast.total}</div>
          <div className="lt-sub">{rollToast.label}{rollToast.sub ? " · " + rollToast.sub : ""}</div>
        </div>
      )}

      {/* slide-to-confirm delete */}
      {delTarget && (
        <SlideToDelete name={delTarget.name}
          onConfirm={() => { invRemove(delTarget.itemKey); setTimeout(() => setDelTarget(null), 250); }}
          onCancel={() => setDelTarget(null)} />
      )}
    </div>
  );
}




// ---- live-data wiring (everything above is the verbatim prototype) ----
// Build the active character's `C` from live Firebase (sheet + runtime state)
// and point the module bindings at it before <App> renders.
function RefreshedPlayer() {
  const subscribe = useGameStore((s) => s.subscribe)
  useEffect(() => { subscribe() }, [subscribe])

  // which character (step 2 will read this from the route/param)
  const charKey = 'akwan-akusian'
  const sheet = useGameStore((s) => s.sheets[charKey])
  const live = useGameStore((s) => s.characters[charKey])

  // Wait for the static sheet before mounting App, so App's once-per-mount state
  // (spell slots, notes, roll log) initialises from the real character.
  if (!sheet) {
    return (
      <div className="refreshed-root">
        <div className="phone" style={{ display: 'grid', placeItems: 'center', color: 'var(--gold)', fontFamily: 'var(--cap)' }}>
          Loading…
        </div>
      </div>
    )
  }

  LAB_CHAR_KEY = charKey
  C = adaptCharacter(sheet, live)
  return <div className="refreshed-root"><App key={charKey} /></div>
}

export default RefreshedPlayer
