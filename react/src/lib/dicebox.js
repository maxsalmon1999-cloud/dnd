// 3D physics dice (@3d-dice/dice-box), shared engine util.
// Lazily creates one DiceBox inside a fullscreen overlay, rolls a notation, and
// resolves with the settled die values. Assets are served from /assets/ (copied
// into public/ by the package's postinstall).
import DiceBox from '@3d-dice/dice-box'

let box = null
let initPromise = null
let overlay = null
let hideTimer = null

function ensureOverlay() {
  if (overlay) return
  // Always full-screen (so the WebGL canvas sizes correctly at init); shown/hidden
  // via opacity rather than display:none, which would give the canvas 0×0.
  overlay = document.createElement('div')
  overlay.id = 'dice-overlay'
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:90;pointer-events:none;opacity:0;transition:opacity 0.2s;'
  const container = document.createElement('div')
  container.id = 'dice-box'
  container.style.cssText = 'width:100%;height:100%;'
  overlay.appendChild(container)
  document.body.appendChild(overlay)

  // dice-box sizes its WebGL canvas from the canvas's own CSS size, so make it
  // fill the container (otherwise it stays at the default 300×150).
  const style = document.createElement('style')
  style.textContent = '#dice-box canvas{width:100%!important;height:100%!important;display:block}'
  document.head.appendChild(style)
}

function ensureBox() {
  if (initPromise) return initPromise
  ensureOverlay()
  box = new DiceBox('#dice-box', {
    assetPath: '/assets/',
    theme: 'default',
    scale: 5,
    gravity: 1.6,
    throwForce: 6.2,
    spinForce: 4.6,
    lightIntensity: 1.15,
    shadowTransparency: 0.55,
    restitution: 0,
  })
  initPromise = box.init().then(() => {
    // Ensure the engine reads the now-full-size canvas.
    window.dispatchEvent(new Event('resize'))
    return box
  })
  return initPromise
}

// Roll a simple notation like "1d20" or "2d6". Resolves to an array of die
// values once the dice settle. The dice stay visible briefly, then clear.
export async function rollDiceBox(notation) {
  const b = await ensureBox()
  clearTimeout(hideTimer)
  b.clear()
  overlay.style.opacity = '1'
  window.dispatchEvent(new Event('resize'))
  const results = await b.roll(notation)
  hideTimer = setTimeout(() => {
    b.clear()
    overlay.style.opacity = '0'
  }, 1600)
  // results is an array of die objects with a `.value` each
  return (Array.isArray(results) ? results : []).map((r) => r.value)
}
