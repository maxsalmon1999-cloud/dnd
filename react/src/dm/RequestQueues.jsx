import { useGameStore } from '../store/gameStore'
import { fmtMod } from '../player/helpers'

// Flatten {charKey: {reqId: req}} into [{charKey, reqId, ...req}] sorted by time.
function flatten(byChar) {
  const out = []
  Object.entries(byChar || {}).forEach(([charKey, reqs]) => {
    Object.entries(reqs || {}).forEach(([reqId, req]) => out.push({ charKey, reqId, ...req }))
  })
  return out.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
}

const firstName = (sheets, charKey) => (sheets[charKey]?.name || charKey).split(' ')[0]

export default function RequestQueues() {
  const sheets = useGameStore((s) => s.sheets)
  const invReqs = flatten(useGameStore((s) => s.inventoryRequests))
  const goldReqs = flatten(useGameStore((s) => s.goldRequests))
  const approveInv = useGameStore((s) => s.approveInventoryRequest)
  const rejectInv = useGameStore((s) => s.rejectInventoryRequest)
  const approveGold = useGameStore((s) => s.approveGoldRequest)
  const rejectGold = useGameStore((s) => s.rejectGoldRequest)

  return (
    <>
      <div className="card">
        <strong style={{ color: '#c4a44e' }}>Inventory Requests <span className="badge-count">({invReqs.length})</span></strong>
        {invReqs.length === 0 && <div className="muted" style={{ marginTop: 6 }}>No pending requests</div>}
        {invReqs.map((r) => (
          <div className="req-row" key={r.reqId}>
            <span style={{ flex: 1 }}>
              <strong>{firstName(sheets, r.charKey)}</strong>: ({r.currentAmount}) {r.itemName} {fmtMod(r.delta)}
            </span>
            <button className="btn iconbtn approve" onClick={() => approveInv(r.charKey, r.reqId)}>✓</button>
            <button className="btn iconbtn reject" onClick={() => rejectInv(r.charKey, r.reqId)}>✗</button>
          </div>
        ))}
      </div>

      <div className="card">
        <strong style={{ color: '#c4a44e' }}>Gold Requests <span className="badge-count">({goldReqs.length})</span></strong>
        {goldReqs.length === 0 && <div className="muted" style={{ marginTop: 6 }}>No pending requests</div>}
        {goldReqs.map((r) => {
          const newGold = Math.max(0, (r.currentGold || 0) + (r.delta || 0))
          return (
            <div className="req-row" key={r.reqId}>
              <span style={{ flex: 1 }}>
                <strong>{firstName(sheets, r.charKey)}</strong>: {r.currentGold} gp {fmtMod(r.delta)} → {newGold} gp
              </span>
              <button className="btn iconbtn approve" onClick={() => approveGold(r.charKey, r.reqId)}>✓</button>
              <button className="btn iconbtn reject" onClick={() => rejectGold(r.charKey, r.reqId)}>✗</button>
            </div>
          )
        })}
      </div>
    </>
  )
}
