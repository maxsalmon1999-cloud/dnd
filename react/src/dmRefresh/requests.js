// Request-queue helpers (kept out of liveParts.jsx so that file only exports
// components — required for eslint react-refresh / Vite HMR fast-refresh).

// Flatten {charKey: {reqId: req}} into rows, oldest first.
export function flattenRequests(byChar) {
  const out = []
  Object.entries(byChar || {}).forEach(([charKey, reqs]) => {
    Object.entries(reqs || {}).forEach(([reqId, req]) => out.push({ charKey, reqId, ...req }))
  })
  return out.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
}
