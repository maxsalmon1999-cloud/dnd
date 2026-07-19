// Live-data wrapper for the refreshed DM screen ("Book of the Raven").
// Wired to live Firebase/AI so far: party (character-sheet tracker + HP),
// dice log, story notes (+ session hard-save), Spotify music, whispers,
// item/gold requests, the real AI prompt tool, and the DM dice roller.
import { useEffect, useRef } from 'react'
import DMScreen from './DMScreen'
import { adaptDmParty } from './dmParty'
import { flattenRequests } from './liveParts'
import { useGameStore } from '../store/gameStore'
import { stream } from '../lib/ai'
import { buildSystemPrompt } from '../dm/prompts'
import { useBudget } from '../dm/budget'

// Map the live diceLog map → the DM screen's { char, f, r } row shape,
// newest first (Firebase push keys sort chronologically).
function adaptDiceLog(diceLog) {
  return Object.entries(diceLog || {})
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 30)
    .map(([, e]) => ({
      char: e.character || '—',
      f: [e.label, e.type].filter(Boolean).join(' '),
      r: e.result,
    }))
}

// The prototype's composer modes → the prompt builder's mode keys.
const MODE_KEY = { DESC: 'description', ACT: 'action', BOTH: 'both', RULES: 'rules' }

export default function DmRefresh() {
  const subscribe = useGameStore((s) => s.subscribe)
  useEffect(() => { subscribe() }, [subscribe])
  const sheets = useGameStore((s) => s.sheets)
  const characters = useGameStore((s) => s.characters)
  const diceLog = useGameStore((s) => s.diceLog)
  const invReqs = useGameStore((s) => s.inventoryRequests)
  const goldReqs = useGameStore((s) => s.goldRequests)
  const changeHp = useGameStore((s) => s.changeHp)
  const endSession = useGameStore((s) => s.endSession)

  // Conversation history for the AI (survives re-renders, resets on reload).
  const historyRef = useRef([])

  const keys = Object.keys(sheets || {})
  // Until the sheets load, let the prototype show its own mock party.
  const liveCharacters = keys.length ? adaptDmParty(sheets, characters) : undefined
  const requestCount = flattenRequests(invReqs).length + flattenRequests(goldReqs).length

  // The real DM prompt tool: same pipeline as the classic DM screen —
  // campaign-aware system prompt, streaming reply, shared $ budget tracking.
  const onAiSend = async ({ text, mode, onToken }) => {
    const { campaign, sheets: liveSheets } = useGameStore.getState()
    const system = buildSystemPrompt({ campaign, sheets: liveSheets, mode: MODE_KEY[mode] || 'description' })
    historyRef.current = [...historyRef.current, { role: 'user', content: text }]
    const { text: reply, usage } = await stream({
      system,
      messages: historyRef.current,
      maxTokens: 1024,
      onToken: (() => { let acc = ''; return (chunk) => { acc += chunk; onToken(acc) } })(),
    })
    historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }]
    useBudget.getState().record(usage)
    return { reply, spentUsd: useBudget.getState().spentUsd }
  }

  const budget = useBudget()

  return (
    <DMScreen
      liveCharacters={liveCharacters}
      liveDiceLog={adaptDiceLog(diceLog)}
      requestCount={requestCount}
      initialBudget={{ total: budget.limitUsd, used: budget.spentUsd }}
      onBudgetLimit={(v) => useBudget.getState().setLimit(v)}
      onBudgetReset={() => useBudget.getState().reset()}
      onAiSend={onAiSend}
      onAiUndo={() => { historyRef.current = historyRef.current.slice(0, -2) }}
      onAdjustHp={(id, delta) => changeHp(id, delta)}
      onEndSession={() => endSession()}
    />
  )
}
