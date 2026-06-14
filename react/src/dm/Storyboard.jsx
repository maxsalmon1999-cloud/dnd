import { useState, useRef, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { stream } from '../lib/ai'
import { DM_MODES, buildSystemPrompt } from './prompts'
import { renderAssistantMarkdown, renderUserText } from './markdown'
import { useBudget } from './budget'
import { AI_ASSISTANT_NAME } from '../config'

const modeLabel = (m) => DM_MODES.find((x) => x.key === m)?.label || ''
const stripDiceRequest = (t) => t.replace(/```dice_request[\s\S]*?```/g, '').trim()

export default function Storyboard() {
  const campaign = useGameStore((s) => s.campaign)
  const sheets = useGameStore((s) => s.sheets)

  const [entries, setEntries] = useState([]) // {role,label,text,mode}
  const [mode, setMode] = useState('description')
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState('') // live partial reply
  const [busy, setBusy] = useState(false)
  const historyRef = useRef([]) // [{role, content}] — ephemeral conversation
  const scrollRef = useRef(null)

  const placeholder = DM_MODES.find((m) => m.key === mode)?.placeholder

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [entries, streaming])

  const send = async () => {
    const text = input.trim()
    if (!text || busy) return
    setInput('')

    // Meta mode: local comment, no AI.
    if (mode === 'meta') {
      setEntries((e) => [...e, { role: 'meta', label: 'Meta', text, mode }])
      return
    }

    setEntries((e) => [...e, { role: 'user', label: 'You', text, mode }])
    historyRef.current.push({ role: 'user', content: text })

    setBusy(true)
    setStreaming('…')
    try {
      const system = buildSystemPrompt({ campaign, sheets, mode })
      let acc = ''
      const { text: reply, usage } = await stream({
        system,
        messages: historyRef.current,
        maxTokens: 1024,
        onToken: (chunk) => { acc += chunk; setStreaming(stripDiceRequest(acc)) },
      })
      useBudget.getState().record(usage)
      historyRef.current.push({ role: 'assistant', content: reply })
      const clean = stripDiceRequest(reply)
      setEntries((e) => [...e, { role: 'assistant', label: AI_ASSISTANT_NAME, text: clean, mode }])
    } catch (err) {
      setEntries((e) => [...e, { role: 'assistant', label: AI_ASSISTANT_NAME, text: `[Error: ${err.message}]`, mode }])
    } finally {
      setStreaming('')
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="story-area" ref={scrollRef}>
        {entries.length === 0 && !streaming && (
          <div className="welcome-message">Set the scene, narrate an action, or ask a rules question to begin.</div>
        )}
        {entries.map((e, i) => (
          <div className={`story-entry ${e.role}`} key={i}>
            <div className="label">
              {e.label}
              {e.mode && <span className={`mode-badge mode-${e.mode}`}>{modeLabel(e.mode)}</span>}
            </div>
            <div className="text" dangerouslySetInnerHTML={{ __html: e.role === 'assistant' ? renderAssistantMarkdown(e.text) : renderUserText(e.text) }} />
          </div>
        ))}
        {streaming && (
          <div className="story-entry assistant">
            <div className="label">{AI_ASSISTANT_NAME}</div>
            <div className="text" dangerouslySetInnerHTML={{ __html: streaming === '…' ? '…' : renderAssistantMarkdown(streaming) }} />
          </div>
        )}
      </div>

      <div className="prompt-tabs">
        {DM_MODES.map((m) => (
          <button key={m.key} className={mode === m.key ? 'active' : ''} onClick={() => setMode(m.key)}>{m.label}</button>
        ))}
      </div>
      <div className="prompt-box">
        <textarea
          className="input"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
        />
        <button className="btn" disabled={busy} onClick={send}>{busy ? '…' : 'Send'}</button>
      </div>

      <BudgetBar />
    </div>
  )
}

function BudgetBar() {
  const { limitUsd, spentUsd, setLimit, reset } = useBudget()
  const remaining = Math.max(0, limitUsd - spentUsd)
  const pct = Math.min(100, limitUsd ? (spentUsd / limitUsd) * 100 : 0)
  return (
    <div className="budget">
      <div className="row spread">
        <span>${remaining.toFixed(2)} left of ${limitUsd.toFixed(2)} · ${spentUsd.toFixed(2)} used</span>
        <span className="row" style={{ gap: 6 }}>
          <input className="input" style={{ width: 60 }} type="number" min={1} value={limitUsd} onChange={(e) => setLimit(+e.target.value)} />
          <button className="btn" onClick={reset}>Reset</button>
        </span>
      </div>
      <div className="budget-track"><div className="budget-fill" style={{ width: `${pct}%` }} /></div>
    </div>
  )
}
