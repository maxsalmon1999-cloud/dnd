import { useGameStore } from '../store/gameStore'

export default function RestButtons() {
  const doRest = useGameStore((s) => s.doRest)
  return (
    <span className="row" style={{ gap: 6 }}>
      <button className="btn" onClick={() => doRest('short')}>Short Rest</button>
      <button className="btn" onClick={() => doRest('long')}>Long Rest</button>
    </span>
  )
}
