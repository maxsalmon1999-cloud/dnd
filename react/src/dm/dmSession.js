// Ephemeral DM-session state (lost on reload, like the original): conversation
// history, meta comments, the story-notes scratchpad, the prompt draft (so the
// dice table can inject results), and the pending AI dice request.
import { create } from 'zustand'

export const useDmSession = create((set) => ({
  history: [], // [{role, content}] sent to the AI
  metaComments: [],
  storyNotes: '',
  promptDraft: '', // bound to the prompt textarea; dice results inject here
  diceRequest: null, // parsed dice_request from the AI, loaded into the dice table

  pushHistory: (msg) => set((s) => ({ history: [...s.history, msg] })),
  setHistory: (history) => set({ history }),
  addMeta: (text) => set((s) => ({ metaComments: [...s.metaComments, text] })),
  setNotes: (storyNotes) => set({ storyNotes }),
  setPromptDraft: (promptDraft) => set({ promptDraft }),
  setDiceRequest: (diceRequest) => set({ diceRequest }),
}))
