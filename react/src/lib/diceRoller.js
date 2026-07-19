// Shared 3D dice factory (@3d-dice/dice-box): black dice, gold numbers.
// Both screens use the same physics/theme config and the same lifecycle —
// show the layer, roll, keep the dice visible 5s, then clear and hide.
// Instantiated by refreshed/refreshedDice.js (player, in-phone layer) and
// dmRefresh/dmDice.js (DM, full-screen overlay).
import DiceBox from '@3d-dice/dice-box'

export function createDiceRoller({ selector, scale, ensureMount }) {
  let box = null
  let initPromise = null
  let hideTimer = null
  const layerEl = () => document.querySelector(selector)

  function ensureBox() {
    if (initPromise) return initPromise
    if (ensureMount) ensureMount()
    box = new DiceBox(selector, {
      assetPath: '/assets/',
      theme: 'blackgold',
      themeColor: '#0a0a0a', // black dice body (numbers come gold from the theme)
      scale,
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

  // Roll a notation like "1d20" or "3d6"; resolves with the settled die values.
  return async function roll(notation) {
    const b = await ensureBox()
    const el = layerEl()
    clearTimeout(hideTimer)
    if (el) el.style.opacity = '1'
    window.dispatchEvent(new Event('resize'))
    const results = await b.roll(notation)
    hideTimer = setTimeout(() => {
      b.clear()
      const cur = layerEl()
      if (cur) cur.style.opacity = '0'
    }, 5000)
    return (Array.isArray(results) ? results : []).map((r) => r.value)
  }
}
