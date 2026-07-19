# Legacy snapshot — original single-file HTML app

This folder is a **frozen reference copy** of the original app as it stood at the start of the
React migration (2026-06-14). It exists so we can:

- look back at the exact original behaviour while rebuilding, and
- catch any feature that the parity checklist or the rebuild might have missed.

**Do not develop here.** These files are a read-only reference. The live app (during the
migration) still runs from the copies in the repo root; the new app is built under `../react/`.

## Contents

| File | What it is | Migration status |
|------|------------|------------------|
| `index.html` | DM screen (the main app) | **Being rebuilt in React** |
| `player.html` | Player screen | **Being rebuilt in React** |
| `callback.html` | Spotify OAuth redirect handler | Infrastructure — preserve/migrate with Spotify |
| `combat-map.html` | Standalone tactical combat grid | **Dropped from scope** (not in React rebuild) |
| `dice-lab.html` | 3D dice physics sandbox | **Dropped from scope** (not in React rebuild) |

Also dropped from the rebuild: the dormant 2D dice board and orphaned roll-counter code inside
`player.html` (present in the file but never shown to users).

See `../FEATURE-CHECKLIST.md` for the full feature inventory and `../MIGRATION-PLAN.md` for the plan.

---

## Sunset note (later)

Once the React app (DM dashboard + **refreshed player screen**) became the product,
the following were retired here:

- `index.html`, `player.html`, `combat-map.html`, `dice-lab.html`, `callback.html` — the
  original single-file HTML app (removed from the repo root; copies kept above).
- `old-react-player-screen/` — the first React rebuild of the player screen (Phase 2),
  superseded by the refreshed player card (`react/src/refreshed/`).
- `old-react-dm-screen/` — the first React rebuild of the DM screen (Phase 3),
  superseded by the refreshed "Book of the Raven" DM screen (`react/src/dmRefresh/`).
  Three engine modules stayed live in `react/src/dm/` (`spotify.js`, `prompts.js`,
  `budget.js`) because the refreshed screen uses them. **Known gap:** the Setup flow
  (character-sheet / campaign-doc import — `SetupModal.jsx`, `parseCharacterSheet.js`,
  `pdf.js`, `campaignPrompt.js`) is not rebuilt in the refreshed screen yet; pull those
  from this archive when wiring it up.

The live app is now the React build (refreshed DM screen + refreshed player screen) on
Cloudflare Pages. The Cloudflare **worker** (AI proxy) and the React app under `react/`
are unaffected.
