// 3D dice for the refreshed DM screen — the same @3d-dice/dice-box roller as
// the refreshed player screen (black dice, gold numbers), mounted in a
// full-screen overlay above the DM interface. Dice stay visible for 5s.
import DiceBox from '@3d-dice/dice-box'

let box = null
let initPromise = null
let hideTimer = null

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

function ensureBox() {
  if (initPromise) return initPromise
  ensureOverlay()
  box = new DiceBox('#dm-dice-box', {
    assetPath: '/assets/',
    theme: 'blackgold',
    themeColor: '#0a0a0a',
    scale: 5,
    gravity: 1.8,
    throwForce: 5,
    spinForce: 4.5,
    lightIntensity: 1.1,
    shadowTransparency: 0.4,
    restitution: 0,
  })
  initPromise = box.init().then(() => {
    window.dispatchEvent(new Event('resize'))
    return box
  })
  return initPromise
}

// Roll a notation like "3d6"; resolves with the settled die values.
export async function rollDmDice(notation) {
  const b = await ensureBox()
  const el = document.getElementById('dm-dice-box')
  clearTimeout(hideTimer)
  if (el) el.style.opacity = '1'
  window.dispatchEvent(new Event('resize'))
  const results = await b.roll(notation)
  hideTimer = setTimeout(() => {
    b.clear()
    if (el) el.style.opacity = '0'
  }, 5000)
  return (Array.isArray(results) ? results : []).map((r) => r.value)
}
