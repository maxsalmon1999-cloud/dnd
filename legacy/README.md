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
