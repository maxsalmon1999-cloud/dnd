import { useDmSession } from './dmSession'
import { Section } from '../shared/ui'

export function MetaPanel() {
  const metaComments = useDmSession((s) => s.metaComments)
  return (
    <Section title={`Meta Comments (${metaComments.length})`}>
      {metaComments.length === 0 && <div className="muted">No comments. Use META mode to add.</div>}
      {metaComments.map((c, i) => (
        <div key={i} style={{ padding: '3px 0', fontSize: 13, borderBottom: '1px solid var(--line)' }}>{c}</div>
      ))}
    </Section>
  )
}

export function NotesPanel() {
  const storyNotes = useDmSession((s) => s.storyNotes)
  const setNotes = useDmSession((s) => s.setNotes)
  return (
    <Section title="Story Notes">
      <textarea
        className="input"
        style={{ width: '100%', minHeight: 140 }}
        placeholder="Scratchpad — NPC names, plot threads, reminders…"
        value={storyNotes}
        onChange={(e) => setNotes(e.target.value)}
      />
    </Section>
  )
}
