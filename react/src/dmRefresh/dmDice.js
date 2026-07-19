// DM-screen dice: same roller as the player screen, mounted in a full-screen
// overlay created on first use (the DM screen has no dedicated dice layer).
import { createDiceRoller } from '../lib/diceRoller'

function ensureOverlay() {
  if (document.getElementById('dm-dice-box')) return
  const el = document.createElement('div')
  el.id = 'dm-dice-box'
  el.style.cssText =
    'position:fixed;inset:0;z-index:75;pointer-events:none;opacity:0;transition:opacity .2s;'
  document.body.appendChild(el)
  const style = document.createElement('style')
  style.textContent = '#dm-dice-box canvas{width:100%!important;height:100%!important;display:block}'
  document.head.appendChild(style)
}

export const rollDmDice = createDiceRoller({
  selector: '#dm-dice-box',
  scale: 5,
  ensureMount: ensureOverlay,
})
