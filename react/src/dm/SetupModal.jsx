import { useState, useRef } from 'react'
import { useGameStore } from '../store/gameStore'
import { Modal } from '../player/ui'
import { complete } from '../lib/ai'
import { useBudget } from './budget'
import { parseCharacterSheet, resolveCharacterKey } from './parseCharacterSheet'
import { extractPdfText } from './pdf'
import { CAMPAIGN_EXTRACTION_PROMPT } from './campaignPrompt'

export default function SetupModal({ onClose }) {
  return (
    <Modal onClose={onClose}>
      <div className="row spread">
        <h2>⚙ Game Setup</h2>
        <button className="btn" onClick={onClose}>✕</button>
      </div>
      <CampaignSection />
      <div style={{ height: 1, background: 'var(--line)', margin: '14px 0' }} />
      <CharacterSection />
    </Modal>
  )
}

function CampaignSection() {
  const campaign = useGameStore((s) => s.campaign)
  const saveCampaign = useGameStore((s) => s.setAt)
  const removeAt = useGameStore((s) => s.removeAt)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDel, setConfirmDel] = useState('')
  const fileRef = useRef(null)

  const process = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) { setStatus('No file selected'); return }
    setBusy(true)
    try {
      setStatus('Extracting text from PDF…')
      const fullText = await extractPdfText(file)
      setStatus('Sending to Claude for structuring…')
      const { text, usage } = await complete({
        messages: [{ role: 'user', content: CAMPAIGN_EXTRACTION_PROMPT + fullText.slice(0, 30000) }],
        maxTokens: 4096,
      })
      useBudget.getState().record(usage)
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Could not parse campaign JSON from response')
      const parsed = JSON.parse(match[0])
      await saveCampaign('campaign', parsed)
      setStatus(`Campaign "${parsed.meta?.name || 'unnamed'}" processed and saved!`)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setStatus('Error: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h3>Campaign</h3>
      <p className="muted" style={{ margin: '4px 0' }}>{campaign?.meta?.name || 'No campaign loaded'}</p>
      <div className="row" style={{ gap: 6, marginTop: 6 }}>
        <input ref={fileRef} type="file" accept=".pdf" className="input" style={{ flex: 1 }} />
        <button className="btn" disabled={busy} onClick={process}>Process</button>
      </div>
      {status && <p className="muted" style={{ marginTop: 6, fontSize: 12 }}>{status}</p>}
      {campaign && (
        <div className="row" style={{ gap: 6, marginTop: 8 }}>
          <input className="input" style={{ width: 120 }} placeholder='type "delete"' value={confirmDel} onChange={(e) => setConfirmDel(e.target.value)} />
          <button className="btn reject" disabled={confirmDel !== 'delete'} onClick={() => { removeAt('campaign'); setConfirmDel('') }}>Delete Campaign</button>
        </div>
      )}
    </div>
  )
}

function CharacterSection() {
  const sheets = useGameStore((s) => s.sheets)
  const setAt = useGameStore((s) => s.setAt)
  const batchUpdate = useGameStore((s) => s.batchUpdate)
  const removeAt = useGameStore((s) => s.removeAt)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [delKey, setDelKey] = useState(null)
  const fileRef = useRef(null)

  const add = async () => {
    const files = fileRef.current?.files
    if (!files?.length) { setStatus('No files selected'); return }
    setBusy(true)
    setStatus('Processing…')
    try {
      const texts = await Promise.all(Array.from(files).map((f) => f.text()))
      const reserved = new Set(Object.keys(sheets))
      const known = { ...sheets }
      for (const text of texts) {
        const parsed = parseCharacterSheet(text)
        const key = resolveCharacterKey(parsed.name, known, reserved)
        known[key] = { ...parsed, key }
        await setAt(`characterSheets/${key}`, { ...parsed, key })
        // Initialise runtime state only where missing.
        const live = useGameStore.getState().characters[key] || {}
        const updates = {}
        if (live.hp == null) { updates[`characters/${key}/hp`] = parsed.maxHp; updates[`characters/${key}/maxHp`] = parsed.maxHp }
        if (parsed.spellSlots.length && !live.slots) parsed.spellSlots.forEach((s) => { for (let i = 0; i < s.count; i++) updates[`characters/${key}/slots/${s.key}_${i}`] = false })
        const activeAbils = parsed.abilities.filter((a) => !a.passive && a.key)
        if (activeAbils.length && !live.abilities) activeAbils.forEach((a) => { updates[`characters/${key}/abilities/${a.key}`] = 0 })
        if (Object.keys(parsed.inventory).length && !live.inventory) Object.entries(parsed.inventory).forEach(([k, v]) => { updates[`characters/${key}/inventory/${k}`] = v })
        if (Object.keys(updates).length) await batchUpdate(updates)
      }
      setStatus(`${texts.length} character(s) added successfully`)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setStatus('Error: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  const exportChar = (key) => {
    const md = sheets[key]?.rawMarkdown
    if (!md) return
    const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${sheets[key].name}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const del = (key) => {
    removeAt(`characterSheets/${key}`)
    removeAt(`characters/${key}`)
    setDelKey(null)
  }

  return (
    <div>
      <h3>Character Sheets</h3>
      {Object.entries(sheets).map(([key, c]) => (
        <div className="row spread" key={key} style={{ padding: '4px 0' }}>
          <span>{c.name} <span className="muted">{c.cls}</span></span>
          <span className="row" style={{ gap: 4 }}>
            <button className="btn" onClick={() => exportChar(key)}>Export</button>
            {delKey === key ? (
              <button className="btn reject" onClick={() => del(key)}>Confirm</button>
            ) : (
              <button className="btn" onClick={() => setDelKey(key)}>Delete</button>
            )}
          </span>
        </div>
      ))}
      <div className="row" style={{ gap: 6, marginTop: 8 }}>
        <input ref={fileRef} type="file" accept=".md,.txt" multiple className="input" style={{ flex: 1 }} />
        <button className="btn" disabled={busy} onClick={add}>Add Characters</button>
      </div>
      {status && <p className="muted" style={{ marginTop: 6, fontSize: 12 }}>{status}</p>}
    </div>
  )
}
