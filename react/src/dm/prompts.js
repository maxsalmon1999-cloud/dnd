// Builds the AI system prompt for the DM, mirroring the original loadPrompts():
// campaign setting + plot + NPCs + locations + party roster, then a per-mode
// instruction. Falls back to sensible defaults when no campaign is loaded.

const DEFAULT_TEMPLATES = {
  description:
    'Describe the scene vividly in 2-4 paragraphs. Focus on sensory detail, mood, character reactions, and concrete environmental cues. Do not resolve mechanics or invent facts beyond the supplied campaign context.',
  action:
    'Resolve the action clearly in 1-3 short paragraphs. Lead with the mechanical outcome, use supplied stat blocks, and briefly narrate the immediate effect.',
  both:
    'Blend vivid narration with explicit mechanical resolution in 3-5 paragraphs. End on the scene’s updated state.',
  rules:
    "Answer the player's D&D 5e rules question accurately and concisely. Cite the relevant rule or mechanic. Do not advance the story.",
}

function buildBase(campaign, sheets) {
  let s = ''
  const meta = campaign?.meta
  if (meta) {
    if (meta.setting) s += meta.setting + '\n\n'
    if (meta.plotSummary) s += '### Plot Summary\n\n' + meta.plotSummary + '\n\n'
  }
  const npcs = campaign?.npcs
  if (npcs && Object.keys(npcs).length) {
    s += '### Key NPCs\n\n'
    Object.values(npcs).forEach((n) => {
      s += `**${n.name}**${n.role ? ` (${n.role})` : ''}\n`
      if (n.description) s += `- ${n.description}\n`
      if (n.personality) s += `- Personality: ${n.personality}\n`
      s += '\n'
    })
  }
  const locs = campaign?.locations
  if (locs && Object.keys(locs).length) {
    s += '### Key Locations\n\n'
    Object.values(locs).forEach((l) => {
      s += `**${l.name}**: ${l.description || ''}\n`
    })
    s += '\n'
  }
  const chars = Object.values(sheets || {})
  if (chars.length) {
    s += '### The Party\n\n'
    chars.forEach((c) => {
      s += `**${c.name}** — ${c.cls}\n`
      s += `- HP: ${c.maxHp} | AC: ${c.ac}`
      if (c.spellSaveDC) s += ` | Spell Save DC: ${c.spellSaveDC}`
      s += '\n- Stats: ' + Object.entries(c.stats || {}).map(([k, v]) => `${k}: ${v >= 0 ? '+' : ''}${v}`).join(', ') + '\n\n'
    })
  }
  return s
}

export function buildSystemPrompt({ campaign, sheets, mode }) {
  const base = buildBase(campaign, sheets)
  const templates = campaign?.promptTemplates || {}
  const modeSection =
    mode === 'rules'
      ? DEFAULT_TEMPLATES.rules
      : templates[mode] || DEFAULT_TEMPLATES[mode] || ''
  return [base, modeSection].filter(Boolean).join('\n\n---\n\n')
}
