// Lab dice roller: a @3d-dice/dice-box instance mounted INSIDE the phone screen
// (so dice roll only within the card, not across the whole window), with black
// dice + gold numbers (the 'blackgold' theme) at a smaller scale.
import DiceBox from '@3d-dice/dice-box'

let box = null
let initPromise = null
let hideTimer = null
const layerEl = () => document.getElementById('lab-dice-box')

function ensureBox() {
  if (initPromise) return initPromise
  box = new DiceBox('#lab-dice-box', {
    assetPath: '/assets/',
    theme: 'blackgold',
    themeColor: '#0a0a0a', // black dice body (numbers come gold from the theme)
    scale: 4, // smaller dice for the in-phone canvas
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

// Roll a notation like "1d20"; resolves with the settled die values.
// Dice stay on screen for 5s after the LAST roll. If you roll again within that
// window, the new dice are ADDED alongside the existing ones (previous dice are
// not cleared early) and the 5s timer resets.
let visible = false
export async function rollLabDice(notation) {
  const b = await ensureBox()
  const el = layerEl()
  clearTimeout(hideTimer)
  if (el) el.style.opacity = '1'
  window.dispatchEvent(new Event('resize'))
  const results = visible && typeof b.add === 'function' ? await b.add(notation) : await b.roll(notation)
  visible = true
  hideTimer = setTimeout(() => {
    b.clear()
    visible = false
    if (el) el.style.opacity = '0'
  }, 5000)
  return (Array.isArray(results) ? results : []).map((r) => r.value)
}
