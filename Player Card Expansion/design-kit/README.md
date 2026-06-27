# Ornate Pixel-Fantasy — Design Kit

Drop-in visual layer for your D&D player app. **Plain CSS + React, no build config needed** — it's just files. Your app logic, Zustand store, and data shapes stay exactly as they are; this only changes how things look.

Everything is namespaced `oui-` so it will **not** collide with your existing global CSS (`.card`, `.stat`, `.hp-bar-track`, …).

---

## Install (5 minutes)

**1. Copy the folder** into your source tree:
```
src/design-kit/
  theme.css
  ornate-ui.css
  components/HealthOrb.jsx
  components/SpellWheel.jsx
  components/Dice.jsx
  components/OrnateFrame.jsx
```

**2. Copy the sprites** to your public dir (served at `/`):
```
design-kit/assets/ui/*   →   react/public/assets/ui/
```
The CSS references them as `url('/assets/ui/frame_g.png')`, so they must live at `/assets/ui/`.

**3. Add the fonts** to `react/index.html` `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&family=Silkscreen:wght@400;700&display=swap" rel="stylesheet">
```

**4. Import the CSS once** at your app root (`src/main.jsx`, above your own styles):
```js
import './design-kit/theme.css'
import './design-kit/ornate-ui.css'
```

That's it. The tokens (`--gold`, `--ink`, `--panel`, …) are now available everywhere, and the `oui-*` classes + components are ready.

> **Token collision note:** your existing custom properties are scoped to `.pl`. These tokens go on `:root`. If any name clashes (e.g. you already have `--gold`), either rename in `theme.css`, or change its `:root {` to `.pl {`.

---

## Worked example — your StatsTab HP block

**Before** (`src/player/StatsTab.jsx`):
```jsx
function Hp({ charKey, sheet, live }) {
  const changeHp = useGameStore((s) => s.changeHp)
  const maxHp = live.maxHp ?? sheet.maxHp ?? 0
  const hp = live.hp ?? maxHp
  return (
    <div className="card">
      <div className="hp-bar-track">
        <div className="hp-bar-fill" style={{ width: `${(hp/maxHp)*100}%` }} />
      </div>
      <button onClick={() => changeHp(charKey, -1)}>−</button>
      <button onClick={() => changeHp(charKey, +1)}>+</button>
    </div>
  )
}
```

**After** — drop in the orb, keep all your logic:
```jsx
import HealthOrb from '../design-kit/components/HealthOrb'

function Hp({ charKey, sheet, live }) {
  const changeHp = useGameStore((s) => s.changeHp)
  const maxHp = live.maxHp ?? sheet.maxHp ?? 0
  const hp = live.hp ?? maxHp
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <HealthOrb cur={hp} max={maxHp} size={72} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="oui-btn" onClick={() => changeHp(charKey, -1)}>−</button>
        <button className="oui-btn" onClick={() => changeHp(charKey, +1)}>+</button>
      </div>
    </div>
  )
}
```
The orb fills from the bottom, has a bobbing liquid surface, and shows current HP in the center — driven purely by `cur`/`max`.

---

## Worked example — SpellWheel from your data

Your data:
- `sheet.spellSlots` = `[{ count, key, label }]`
- `live.slots` = `{ "1_0": true, "w_0": true }`  (`` `${key}_${index}` ``)

```jsx
import SpellWheel from '../design-kit/components/SpellWheel'

function SpellSlots({ charKey, sheet, live }) {
  const toggleSlot = useGameStore((s) => s.toggleSlot) // your existing action

  return (
    <SpellWheel
      slots={sheet.spellSlots}                 // [{ count, key, label }]
      spent={live.slots ?? {}}                 // { "1_0": true, … }
      onToggle={(key, i) => toggleSlot(charKey, `${key}_${i}`)}
      size={64}
    />
  )
}
```
- Chunk **count** = sum of every group's `count` (so it's automatic per class/level).
- Chunk **color** darkens with spell level: it uses `group.level` if you provide it, otherwise reads a numeric `key` ("1","2"…) as the level, otherwise falls back to array position. (For warlock pact slots with key `"w"`, add a `level` to that group to get the right shade.)
- Center shows **remaining** (unspent) slots. Tapping a chunk calls `onToggle(key, index)`.

If your store doesn't have a single-key toggle yet, the wheel just needs *some* callback that flips `live.slots["${key}_${index}"]`.

---

## What else is in the kit

| Import | What it gives you |
|---|---|
| `components/HealthOrb` | liquid HP orb (`cur`, `max`, `size`) |
| `components/SpellWheel` | radial slot tracker (above) |
| `components/Dice` | `DICE`, `DieShape`, `useDiceRoller(onResult)`, `<DiceRoller onResult>` |
| `components/OrnateFrame` | wraps any content in the gold 9-slice frame |

Plain classes you can apply to your own markup:
- **`.oui-frame`** — the ornate gold panel border (use on modals, cards, the XP modal).
- **`.oui-stat`** — ability-score tile. Markup: `<div class="oui-stat"><span class="sc">16</span><span class="mod">+3</span><span class="k">DEX</span></div>`
- **`.oui-badge`** — AC/Level chip: `<span class="oui-badge"><span class="bk">AC</span><span class="bv">15</span></span>`
- **`.oui-btn`** — bone pill button.
- **`.oui-divider`** — gold filigree rule.

### Dice tab
```jsx
import { DiceRoller } from '../design-kit/components/Dice'

function DiceTab({ roll }) {
  // roll() is your existing callback; DiceRoller hands it { sides, label, value }
  return <DiceRoller onResult={roll} />
}
```

---

## Notes / gotchas
- **`border-image` is the signature** (the ornate frame, stat tiles, buttons). The slice number in CSS must match the PNG inset — don't change one without the other.
- Keep **`image-rendering: pixelated`** on sprite-bearing elements (already set in the kit) so the pixel art stays crisp when scaled.
- The kit assumes a **dark ground**. If your app shell is light, set the page background to `var(--bg)` (or wrap the player screen in an element with `background: var(--paper)`).
- This is just the **primitives**. The bigger interactions from the prototype (cards floating up to fullscreen, the saves/conditions slide-in panels, the journal) are layout + a little state — happy to port any of them into matching components next; tell me which.
