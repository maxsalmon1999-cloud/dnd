// Prompt budget tracker. Mirrors the original: persists {limitUsd, spentUsd} to
// localStorage and estimates spend from token usage using the opus-4-6 pricing.
import { create } from 'zustand'

const STORAGE_KEY = 'dnd_prompt_budget_v1'
const DEFAULT_LIMIT = 10

// $ per million tokens for claude-opus-4-6.
const PRICE_IN = 5 / 1_000_000
const PRICE_OUT = 25 / 1_000_000

export function estimateCost(usage) {
  if (!usage) return 0
  return (usage.input_tokens || 0) * PRICE_IN + (usage.output_tokens || 0) * PRICE_OUT
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const limitUsd = raw.limitUsd > 0 ? raw.limitUsd : DEFAULT_LIMIT
    const spentUsd = raw.spentUsd >= 0 ? raw.spentUsd : 0
    return { limitUsd, spentUsd }
  } catch {
    return { limitUsd: DEFAULT_LIMIT, spentUsd: 0 }
  }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ limitUsd: state.limitUsd, spentUsd: state.spentUsd }))
}

export const useBudget = create((set, get) => ({
  ...load(),
  setLimit(limitUsd) {
    const v = limitUsd > 0 ? limitUsd : DEFAULT_LIMIT
    set({ limitUsd: v })
    save(get())
  },
  record(usage) {
    set({ spentUsd: get().spentUsd + estimateCost(usage) })
    save(get())
  },
  reset() {
    set({ spentUsd: 0 })
    save(get())
  },
}))
