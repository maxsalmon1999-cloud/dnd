// Small shared UI primitives for the player screen.
import { useState, useEffect, useRef } from 'react'

// Collapsible section (accordion).
export function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card">
      <div className="acc-head" onClick={() => setOpen((o) => !o)}>
        <span>{title}</span>
        <span className={`acc-arrow ${open ? 'open' : ''}`}>▸</span>
      </div>
      {open && <div style={{ marginTop: 8 }}>{children}</div>}
    </div>
  )
}

// Toggle switch.
export function Switch({ on, onChange }) {
  return <button className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)} aria-pressed={on} />
}

// Centered modal with backdrop + Escape-to-close (optional).
export function Modal({ children, onClose, closeOnEsc = true }) {
  useEffect(() => {
    if (!closeOnEsc) return
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose, closeOnEsc])
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

// Description popup anchored to a click position; closes on outside click / Escape.
export function Popup({ anchor, onClose, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    const esc = (e) => e.key === 'Escape' && onClose()
    setTimeout(() => document.addEventListener('click', close))
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('click', close)
      document.removeEventListener('keydown', esc)
    }
  }, [onClose])

  // Clamp to viewport.
  const top = Math.min(anchor.y + 8, window.innerHeight - 160)
  const left = Math.min(anchor.x, window.innerWidth - 290)
  return (
    <div className="popup" style={{ top, left: Math.max(8, left) }} ref={ref}>
      {children}
    </div>
  )
}
