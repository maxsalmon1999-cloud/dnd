# Migration Plan: From single-file HTML to React

> **Audience:** the project owner (non-technical) and whoever does the coding (likely Claude).
> **Goal:** move the existing app onto React so a full UI overhaul — detailed graphics and
> animations — becomes practical and safe, without ever taking the app offline or rewriting
> the working "engine" code from scratch.

---

## STATUS (updated 2026-06-14)

**Scope decisions (owner):**
- Combat map (`combat-map.html`) — **dropped** from the React rebuild.
- Dice Lab (`dice-lab.html`) — **dropped**.
- Dormant/dead code in `player.html` — **dropped**.
- Old HTML — **archived** under `legacy/` as a frozen reference snapshot.

**Phase 0 — DONE** (except deployment, which needs the owner). Completed:
- React + Vite project scaffolded under `react/` (libraries: react-router-dom, firebase, zustand).
- Routes live: `/` (home), `/dm`, `/play` (placeholders for now).
- Verified the React app connects to the **real** backend: Firebase read returned the live
  character sheets, and the AI worker responded to a reachability ping. No console errors.
- (Toolchain note: a broken Homebrew Node install was repaired — Node is now 26.x.)

**Remaining Phase 0 item (needs owner):** wiring up deployment to Cloudflare. This publishes
publicly and uses your account, so it's left for you to approve/configure.

**Next:** Phase 1 — write down the Firebase game-state shape and build the Zustand store + a
real AI client (with streaming).

---

## 1. The big picture in plain English

You have two apps that share one brain:

- **DM screen** (`index.html`) — what you, the Dungeon Master, control.
- **Player screen** (`player.html`) — what each player sees on their own device.

They stay in sync because both talk to **Firebase**, a live database in the cloud. When you
change a player's HP on the DM screen, Firebase instantly pushes that change to the player's
phone. Firebase is the **single source of truth** — and that fact is the key to this whole
migration. We are NOT changing the brain. We are rebuilding the *body* (the screens) around it.

**What we keep, untouched or nearly so:**

| Piece | What it does | Migration effort |
|-------|--------------|------------------|
| `worker/index.js` | Securely talks to the AI, hides your API key | **None.** Leave it running as-is. |
| Firebase | Live sync + saved game data | **None to the data.** We just read/write it from React instead. |
| Pixel-art dice renderer (canvas) | Draws and animates the dice | **Low.** Wrapped into a React component, logic unchanged. |
| Spotify playback | Background music | **Low.** Becomes a React hook, logic unchanged. |
| Sound effects (Web Audio) | War horn, button clicks | **Low.** Becomes a small utility, unchanged. |
| PDF / character-sheet parsing | Reads uploaded sheets & campaigns | **Low.** Pure logic, lifts over as-is. |
| All your CSS | The retro Mac look | **Medium.** Reorganised, not rewritten (and will evolve in the overhaul anyway). |

**What actually changes:** the *structure*. Today, 6,000 lines of structure, style, and logic
live in one file, and the screen is updated by hand-written code that pokes at the page. In
React, the app becomes a tree of small, named **components** ("the HP bar", "the dice tray",
"the inventory list"), and React keeps each one automatically in sync with the data. That's
the entire point of the move.

---

## 2. The target setup (the tools we'll use, and why)

Keep this minimal. More tools = more to learn and maintain.

- **React** — the framework. The thing you chose.
- **Vite** — the "build tool". Runs the app on your computer while you work and packages it for
  the web. Industry standard, fast, near-zero configuration.
- **JavaScript (not TypeScript) to start.** TypeScript catches more bugs but adds concepts.
  We can adopt it later once the structure is stable. Starting in plain JavaScript keeps the
  migration approachable.
- **Zustand** — a tiny "global state" helper. This is what holds the live game state in React
  and connects it to Firebase. It's far simpler than the better-known Redux, and it fits your
  "external database updates the whole app" situation perfectly.
- **React Router** — lets one project serve both the DM screen and the Player screen at
  different web addresses (e.g. `/dm` and `/play`).
- **Your existing CSS, reorganised** — we do NOT adopt a new styling system mid-migration.
  Each component gets its own stylesheet, copied from the CSS you already have.
- **Motion (Framer Motion)** — added later, in the overhaul phase, when we do animations.
  Don't install it until we get there.

Everything above is free and open-source.

---

## 3. Guiding principles (the rules that keep this safe)

1. **The old app stays live the entire time.** We build the React version alongside it. We do
   not delete `index.html` / `player.html` until the React version fully replaces them.
2. **Migrate by feature, smallest first.** Each step ships a working piece. No "big bang" where
   everything is broken for weeks.
3. **Don't touch the engine.** Firebase, the worker, dice rendering, Spotify, sound — these are
   tested and working. Reuse them; don't rewrite them.
4. **The data model is the contract.** Before writing UI, we write down exactly what the game
   state looks like in Firebase. Both apps already agree on this implicitly; we make it explicit.
5. **Each finished step is committed to git**, so we can always roll back.

---

## 4. The phases

### Phase 0 — Foundations (no visible change yet)
*Outcome: an empty React app runs on your machine and deploys to the web, next to the old one.*

1. Create a new React + Vite project in a `react/` subfolder of the repo.
2. Get a blank page showing "Hello" in the browser via Vite.
3. Set up two routes with React Router: `/dm` and `/play`.
4. Wire up deployment so the React app can publish to the same place the old one lives
   (Cloudflare). The old HTML files stay reachable at their current addresses.
5. Confirm the React app can reach the **worker** (the AI proxy) and **Firebase** with a
   trivial test (e.g. read one value and print it).

> After Phase 0 nothing looks different to users — but the new foundation exists and is proven
> to connect to your real backend.

### Phase 1 — The data layer (the shared brain, in React)
*Outcome: React can read and write the live game state, exactly like the old app does.*

1. **Write down the game-state shape.** Document what lives in Firebase: characters, HP, stats,
   spell slots, inventory, gold, conditions, dice log, inventory/gold requests, current mode,
   etc. (Most of this is discoverable from the existing `LOADED_CHARS`, sync functions, and the
   player UI sections.)
2. **Build the Zustand store + Firebase connection.** One place that:
   - subscribes to Firebase and keeps the store updated live, and
   - writes changes back to Firebase.
   This replaces the scattered `initFirebaseSync`, `syncCharacterState`, `syncInvRequests`,
   `syncGoldRequests`, etc. with one organised module.
3. **Build the worker/AI client.** A small module that sends prompts to your worker and streams
   responses back (you already added streaming — we preserve that behaviour). This replaces the
   inline API-config and prompt code.

> This is the most important phase. Once the live data flows cleanly into React, every screen
> built afterwards is straightforward.

### Phase 2 — Port the Player screen (`player.html`)
*Outcome: a working React player app at `/play`, replacing player.html.*

Do this one **before** the DM screen — it's more self-contained and its sections are already
cleanly separated in your CSS. Port section by section, each as its own component, each
committed when working:

| Order | Component | Source section in player.html |
|-------|-----------|-------------------------------|
| 1 | Character select screen | `SELECT SCREEN` |
| 2 | HP bar | `HP` |
| 3 | Stats block | `STATS` |
| 4 | Saving throws | `SAVING THROWS` |
| 5 | Spell slots + spell-cast row | `SPELL SLOTS`, `SPELL CAST ROW` |
| 6 | Abilities | `ABILITIES` |
| 7 | Inventory + item stats | `INVENTORY`, `ITEM STATS` |
| 8 | Gold (+ request flow) | `GOLD` |
| 9 | Conditions | `CONDITIONS` |
| 10 | Dice tray | `DICE` (reuses the dice renderer from Phase 4 prep) |
| 11 | XP modal, Notes, Tabs | `XP MODAL`, `NOTES`, `TABS` |

Each component reads its data from the Zustand store (Phase 1) and writes changes back. Because
the store is wired to Firebase, the new player screen instantly syncs with the **old** DM screen
— which proves the data contract is correct before you've touched the DM side at all.

### Phase 3 — Port the DM screen (`index.html`)
*Outcome: a working React DM app at `/dm`, replacing index.html.*

Same approach, larger surface. Suggested component breakdown (from your existing sections):

- **Menu bar** (top classic-Mac bar)
- **Character sidebar** (`buildCharSidebar`) — the DM's view of each player
- **Storyboard / story display** — the main narrative area
- **Prompt area + prompt tabs + prompt modes** (description / ability / etc.)
- **Prompt budget meter** (`renderPromptBudget`, cost tracking)
- **Dice table & dice automation** — including the AI-driven dice loading
- **Meta comments / Notes sidebar**
- **Rest buttons, Timer, Music bar**
- **Game Setup modal** — campaign + character-sheet upload, PDF processing
- **Inventory / gold request approval panels** (DM side of the player requests)
- **Session-end modal**, **delete/export**, **undo/redo**

Undo/redo and the prompt-mode logic are the fiddliest; port them late, once the simpler pieces
are proven.

### Phase 4 — The shared engine pieces (as reusable components)
*Outcome: dice, music, and sound live in one place, used by both screens.*

These are used by both apps, so build them as shared modules and have both `/dm` and `/play`
import them:

- **DiceRenderer** — wrap the canvas pixel-art renderer + its animation loop in one React
  component. The drawing code itself is copied over essentially unchanged.
- **useSpotify** — the Spotify Web Playback SDK setup as a React hook.
- **soundEffects** — war horn + click sounds as a plain utility module.

(You may build slim versions of these earlier if Phase 2/3 need them; this phase is where they
get consolidated and de-duplicated.)

### Phase 5 — The UI overhaul (the reason we did all this)
*Outcome: the new look — detailed graphics and animations.*

Now that the app is clean components driven by clean data, this is finally easy and safe:

- Restyle component by component. Because styles are now scoped per component, changing one
  can't accidentally break another.
- Add **Motion (Framer Motion)** for animations — declarative transitions, springs, page
  changes, dice reveals, damage flashes, etc.
- For richer graphics (fancier dice, particle effects, animated maps) consider **PixiJS** or
  **Three.js** inside a component — the rest of the app neither knows nor cares.
- Build a reusable set of styled building blocks (buttons, panels, windows) so the new look is
  consistent everywhere.

### Phase 6 — Cutover & cleanup
*Outcome: React is the real app; the old files are retired.*

1. Point your main web address at the React app.
2. Keep the old `index.html` / `player.html` archived in git (not deleted from history) for a
   while as a safety net.
3. Optional, later: wrap the React app with **Capacitor** for the App Store (see the separate
   App Store discussion — React makes this step easier, not harder).

---

## 5. Risks and how we de-risk them

| Risk | Mitigation |
|------|------------|
| "Big bang" rewrite that's broken for weeks | Phased, feature-by-feature; app stays live throughout. |
| New player screen silently disagrees with old DM screen | Phase 2 runs the new player screen against the *old* DM screen over real Firebase — mismatches surface immediately. |
| Rewriting working engine code introduces new bugs | We don't rewrite it; we wrap/reuse it. |
| Losing the ability to roll back | Every working step is a git commit; old files retired, not destroyed. |
| Scope creep (migration + redesign at once) | Migration (Phases 0–4) keeps the *current* look. Redesign is deliberately a separate phase (5). |

---

## 6. Rough effort (very approximate, working with Claude)

- Phase 0 — Foundations: small (hours to a day).
- Phase 1 — Data layer: the crucial chunk; a few focused sessions.
- Phase 2 — Player screen: the bulk; steady component-by-component work.
- Phase 3 — DM screen: larger than Phase 2; same rhythm.
- Phase 4 — Shared engine: small-to-medium.
- Phase 5 — Overhaul: open-ended (it's design work, as big as you want it).
- Phase 6 — Cutover: small.

The migration itself (0–4) is the predictable part. Phase 5 is "how ambitious do you want to be."

---

## 7. Recommended first move

Do **Phase 0 + the data-shape write-up from Phase 1**. That gets a real React app talking to
your real Firebase and worker, and produces the written game-state contract everything else
depends on — without touching the working app. Once that's proven, porting screens is repetitive,
low-risk work.
