// Ephemeral DM-session state (lost on reload, like the original): meta comments
// and the story-notes scratchpad. Feeds the session-end summary later.
import { create } from 'zustand'

export const useDmSession = create((set) => ({
  metaComments: [],
  storyNotes: '',
  addMeta: (text) => set((s) => ({ metaComments: [...s.metaComments, text] })),
  setNotes: (storyNotes) => set({ storyNotes }),
}))
