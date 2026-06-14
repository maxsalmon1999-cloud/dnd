import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { useDmSession } from './dmSession'
import { useBudget } from './budget'
import { complete } from '../lib/ai'
import { Modal } from '../shared/ui'

const DEFAULT_SESSION_END =
  'Write a structured session record using the conversation, meta notes, story notes, and campaign context supplied. Be specific, chronological, and grounded in events that actually happened.'

export default function SessionEndModal({ onClose }) {
  const campaign = useGameStore((s) => s.campaign)
  const { history, metaComments, storyNotes } = useDmSession()
  const [summary, setSummary] = useState('Generating summary…')
  const [additions, setAdditions] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const system = campaign?.promptTemplates?.sessionEnd || DEFAULT_SESSION_END
        let context = 'Please produce a structured session summary based on everything above.\n\n'
        if (metaComments.length) context += '### Meta Notes\n' + metaComments.map((c) => '- ' + c).join('\n') + '\n\n'
        if (storyNotes.trim()) context += '### Story Notes\n' + storyNotes.trim() + '\n\n'
        const { text, usage } = await complete({
          system,
          messages: [...history, { role: 'user', content: context }],
          maxTokens: 2048,
        })
        useBudget.getState().record(usage)
        if (!cancelled) { setSummary(text); setLoading(false) }
      } catch (err) {
        if (!cancelled) { setSummary(`[Error generating summary: ${err.message}]\n\nWrite your own notes below.`); setLoading(false) }
      }
    })()
    return () => { cancelled = true }
  }, [campaign, history, metaComments, storyNotes])

  const save = () => {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10)
    const timeStr = date.toTimeString().slice(0, 5).replace(':', '')
    const key = `dnd_session_${dateStr}_${timeStr}`
    const record = { date: date.toISOString(), summary: summary.trim(), additions: additions.trim(), metaNotes: [...metaComments], storyNotes: storyNotes.trim() }
    localStorage.setItem(key, JSON.stringify(record))
    localStorage.setItem('dnd_last_session', key)

    const parts = [`# Session Log — ${dateStr}\n`]
    if (record.summary) parts.push(`## Summary\n\n${record.summary}\n`)
    if (record.additions) parts.push(`## DM Additions\n\n${record.additions}\n`)
    if (metaComments.length) parts.push(`## Meta Notes\n\n${metaComments.map((c) => '- ' + c).join('\n')}\n`)
    if (record.storyNotes) parts.push(`## Story Notes\n\n${record.storyNotes}\n`)
    const url = URL.createObjectURL(new Blob([parts.join('\n')], { type: 'text/markdown' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `session_${dateStr}.md`
    a.click()
    URL.revokeObjectURL(url)
    onClose()
  }

  return (
    <Modal onClose={onClose}>
      <h2>End of Session</h2>
      <div style={{ fontSize: 12, marginTop: 8 }}>Summary</div>
      <textarea className="input" style={{ width: '100%', minHeight: 160 }} value={summary} readOnly={loading} onChange={(e) => setSummary(e.target.value)} />
      <div style={{ fontSize: 12, marginTop: 8 }}>DM additions</div>
      <textarea className="input" style={{ width: '100%', minHeight: 70 }} value={additions} onChange={(e) => setAdditions(e.target.value)} placeholder="Anything to add…" />
      <div className="row" style={{ gap: 8, marginTop: 12 }}>
        <button className="btn" disabled={loading} onClick={save}>Save & Close Session</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  )
}
