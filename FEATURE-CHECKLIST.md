# Feature Parity Checklist — D&D Session Manager

> **Purpose:** the complete, checkable feature inventory of the current product, captured
> *before* the React migration. After the rebuild, go through this list item by item and tick
> off what works. Anything unticked is a regression — something the rebuild dropped.
>
> **How to read it:** each `[ ]` is one thing a tester can verify. Tags mark how data behaves:
> - **[FB]** — synced live via Firebase (real-time between DM and player screens)
> - **[FB→DM]** — a request the player sends to the DM for approval
> - **[LS]** — saved in the browser (localStorage)
> - **[EPH]** — ephemeral; lost on page reload
>
> **Scope note:** Sections A–H are the live product. Section I is dormant/standalone code —
> decide explicitly whether it's in scope for the rebuild. Section J is infrastructure that
> must be preserved exactly.

---

## A. Infrastructure & global config (must be preserved exactly)

- [ ] AI proxy worker reachable at `dnd-anthropic-proxy.max-salmon1999.workers.dev`; all AI calls POST `{model, max_tokens, [stream], [system], messages}` to it
- [ ] AI model is `claude-opus-4-6`; AI persona shown to user as "The abominable intelligence"
- [ ] Worker injects `x-api-key` + `anthropic-version: 2023-06-01`, forwards body verbatim, passes streaming (SSE) and non-streaming responses through, handles CORS preflight, rejects non-POST with 405
- [ ] `ANTHROPIC_API_KEY` provisioned as a worker secret (not in repo) — must be re-created on any redeploy
- [ ] Firebase project `dnd-host`, region `europe-west1`; the single source of truth + live sync layer
- [ ] Firebase compat SDK v10.12.0 (app + database), PDF.js 3.11.174 loaded
- [ ] 3D dice via `@3d-dice/dice-box@1.1.4` (player screen)

---

## B. DM screen — top bar, budget, session lifecycle

### Top menu bar
- [ ] Apple-logo SVG (decorative)
- [ ] Campaign name label, defaults "No campaign loaded", updates from loaded campaign **[FB]**
- [ ] "⚙ Setup" opens the Game Setup modal
- [ ] "☄ Dice Lab" link opens `dice-lab.html` in a new tab
- [ ] "End Session" triggers the AI session-summary flow
- [ ] "✕" reset opens the hard-reset modal

### Prompt budget / cost tracker
- [ ] Bar + text: "$X remaining of $Y budget · $Z used"
- [ ] Editable budget limit (default $10), persists **[LS]** `dnd_prompt_budget_v1` = `{limitUsd, spentUsd}`
- [ ] "Reset" zeroes spend only
- [ ] Spend estimated from token usage of every AI call (pricing opus-4-6 = $5/M in, $25/M out)
- [ ] Streaming calls accumulate input tokens (`message_start`) + output tokens (`message_delta`)
- [ ] Fill bar green→gold→red, caps at 100%; invalid/≤0 limit falls back to $10

### Session end
- [ ] "End Session" opens modal in loading state, calls AI with `sessionEnd` prompt + full history + meta notes + story notes
- [ ] Editable Summary + Additions fields; on AI error, DM can write manually
- [ ] "Save & Close Session" stores record `{date, summary, additions, metaNotes, storyNotes}` **[LS]** `dnd_session_{date}_{time}`, sets **[LS]** `dnd_last_session`, downloads `session_{date}.md`, adds "Session archived" entry
- [ ] On load, a prior session (if any) shows as a "Previous Session — date" entry atop the storyboard

### Hard reset
- [ ] "✕" modal requires typing "reset" to enable the button
- [ ] Reset clears conversation/storyboard (back to welcome), dice table, meta comments, story notes; does a long rest **[FB]**; clears prompt; mode back to Description
- [ ] (Known: does NOT clear undo stack or saved localStorage sessions)

---

## C. DM screen — storyboard, prompts & AI

### Prompt modes (5 tabs)
- [ ] **Description** — vivid narrative, no mechanics
- [ ] **Action** — stats/mechanics only (gold badge)
- [ ] **Both** — narrative + mechanics
- [ ] **Meta** — local comment, no AI call
- [ ] **Rules** — D&D rules Q&A
- [ ] Active tab highlighted; each sets its own placeholder; entries show a mode badge (DESC/ACT/BOTH/META/RULES)

### Sending & rendering
- [ ] Textarea + Send; Enter sends, Shift+Enter newline
- [ ] Meta mode short-circuits to a meta comment (no AI)
- [ ] Other modes: add user entry, push to history, show "…" loader, build system prompt (base + mode template), **stream** response, render markdown incrementally, record usage, then parse/strip any dice request
- [ ] AI error → "[Error: …]" assistant entry
- [ ] Welcome message removed on first prompt
- [ ] Markdown renderer: paragraphs, `##`–`####` headings, `*`/`-` lists, `**bold**`, `*italic*`; user text escaped with `<br>`
- [ ] `conversationHistory` is **[EPH]** (not persisted)

### Undo / redo
- [ ] Each user+assistant pair is a `.story-exchange`; hover shows "↩ Undo"
- [ ] Undo removes that exchange + all later ones, pops matching history entries, pushes to redo stack **[EPH]**
- [ ] Floating "↪ Redo" bar appears only when redo is available; restores exchange + re-wires undo
- [ ] Keyboard: Cmd/Ctrl+Z undo, Cmd/Ctrl+Shift+Z redo (ignored while typing in a field)

### Side panels
- [ ] Meta Comments panel (collapsible); meta-mode submissions append here, auto-open + scroll **[EPH]**
- [ ] Story Notes lined-paper scratchpad (collapsible) **[EPH]** (feeds session-end + NPC name extraction)

---

## D. DM screen — characters, campaign & data management

### Game Setup modal
- [ ] Opens via menu or backdrop; refreshes on open
- [ ] Campaign section: loaded name / "No campaign loaded"; `.pdf` input; "Process" button; status line; "Delete Campaign" (only when loaded) with type-"delete" confirm
- [ ] Character Sheets section: list of loaded chars (name + class) each with Export + Delete; `.md,.txt` multi-file input; "Add Characters"; status line
- [ ] Per-character delete uses inline type-"delete" confirm; Export downloads raw markdown

### Character sheet parsing & upload
- [ ] Reads selected text files, parses each, resolves a stable key (match existing by normalized name, else slugify + numeric suffix on collision)
- [ ] Writes full parsed record to `characterSheets/{key}` **[FB]**
- [ ] Initializes runtime state only if absent: hp/maxHp, spell slots (all false), ability counters (0), inventory **[FB]**
- [ ] Parser extracts: name, class, AC, max HP, proficiency, spell save DC, spell attack, level, XP, ability mods, spell slots (per-level + Warlock short-rest 'w'), active abilities ("Name (Nx / Short|Long Rest)"), passive features, spells, categorized inventory (armour/weapons/tools/consumables/other; weapon stats from Combat Actions)
- [ ] Spell parser detects "Known/Spells Known" sections, sub-levels, bullet entries, strips trailing parentheticals
- [ ] Status messages: Processing / N added / Error; clears input; reloads prompts + data

### Campaign PDF processing
- [ ] Extracts text from all PDF pages, sends first 30,000 chars to AI with fixed extraction prompt → strict JSON (`meta`, `promptTemplates`, `npcs`, `locations`, `encounters`, `enemyStats`)
- [ ] Parses JSON from response, saves to `campaign` **[FB]**; records usage
- [ ] Status progression + Process button disabled during run; resets prompts + reloads data

### Loaded game data & prompt building
- [ ] Loads `LOADED_CHARS` + `LOADED_CAMPAIGN` **[FB]**
- [ ] Spell backfill: chars with `rawMarkdown` get spells re-parsed and written back **[FB]**
- [ ] Spell/ability migration for chars missing them
- [ ] Campaign load derives `CAMPAIGN_NPCS.npcs` + deduped `.enemies` from encounters
- [ ] System prompt built from campaign (setting, plot, key NPCs/locations, party roster w/ HP/AC/DC/stats) + per-mode templates; cached in `dmPrompts`
- [ ] Fallback: no campaign → fetch `Prompts/dm_prompts.md`, split on `## ` headers

### Delete & export
- [ ] Campaign delete (type-"delete"): removes `campaign`, resets state + menu name **[FB]**
- [ ] Character delete (inline confirm): removes `characterSheets/{key}` + `characters/{key}` **[FB]**
- [ ] Export downloads `{Name}.md` of raw markdown (alerts if none)

### Character sidebar (left "Characters" window)
- [ ] Rebuilt per loaded char; empty state message
- [ ] Collapsible card: name + live HP + class
- [ ] HP row with −/+ (`dmChangeHp`, transaction clamped 0..maxHp) **[FB]**
- [ ] AC + ability mods shown
- [ ] Spell-slot diamond pips, live spent state **[FB]**
- [ ] Known Spells grouped by level, clickable for description popup
- [ ] Active abilities buttons "remaining/max", clickable popup, live count **[FB]**
- [ ] Passive features (dimmed) with popups
- [ ] Inventory line live **[FB]**
- [ ] After rebuild: resyncs FB listeners + rebuilds dice-table character buttons

### Ability / spell description popups
- [ ] Fixed tooltip positioned near click, clamped/flipped at viewport edges
- [ ] Hardcoded libraries: ~40 abilities + ~90 spells; falls back to parsed desc or "No description available."
- [ ] Closes on outside click or Escape **[EPH]**

### Rest buttons
- [ ] Short Rest resets only short-rest abilities + warlock/short-rest slots **[FB]**
- [ ] Long Rest resets all abilities + all slots **[FB]**
- [ ] UI updates flow through FB listeners

---

## E. DM screen — player request queues & dice log

### Inventory requests (player → DM)
- [ ] Listens `inventoryRequests`, flattened + sorted by timestamp; badge count, hides at zero **[FB→DM]**
- [ ] Row: "**FirstName**: (currentAmount) ItemName (±delta)" + ✓ approve / ✗ reject
- [ ] Approve sets `characters/{key}/inventory/{itemKey}/amount = current+delta`, removes request **[FB]**
- [ ] Reject removes request only; empty state "No pending requests"

### Gold requests (player → DM)
- [ ] Listens `goldRequests`, same flatten/sort/badge **[FB→DM]**
- [ ] Row: "**FirstName**: currentGold gp (±delta) → newGold gp" (floored at 0)
- [ ] Approve sets `characters/{key}/gold = max(0, current+delta)`, removes request **[FB]**
- [ ] Reject removes request only

### Player dice log
- [ ] Collapsible panel + "Clear" button
- [ ] Snapshots last 100 `diceLog` entries as "seen", then listens `child_added` for new rolls only **[FB]**
- [ ] Each roll: time (en-GB HH:MM) + bold name + dice + result
- [ ] d20==20 green "CRIT!", d20==1 red "FAIL", else gold; trimmed to 20 entries
- [ ] "Clear" removes the whole `diceLog` node **[FB]**

---

## F. DM screen — dice table & AI-driven automation

### Dice table & dice strip
- [ ] Bottom window; portions per participant; empty message
- [ ] Add panel: "+ FirstName" per char + dashed "+ NPC / Enemy" → NPC picker
- [ ] `addPortion` = header (name + ✕) + drop zone + manual-entry row
- [ ] Drag-drop: drag a die from the strip onto a portion → unrolled chip (drag-over highlight); chips themselves draggable between portions
- [ ] Manual entry: die-type select (d4–d100, d20 default) + count + "+"; validates 1..sides (red flash); adds pre-rolled "Manual" chip
- [ ] Deleting a portion unregisters its canvas animations + re-checks empty state
- [ ] Dice strip: "Dice:" label + 7 draggable pixel dice (d4,d6,d8,d10,d12,d20,d100) + "Roll All" (disabled when no unrolled chips); hover inverts palette

### Pixel-art dice renderer & animation
- [ ] Per-type pixel draw (d4 triangle, d6 cube w/ pip, d8/d10/d12 pentagon, d20 octagon, d100 dual-circle), 32×32 canvas, custom 3×5 pixel digit font
- [ ] Two palettes (normal dim gold / inverted gold-face for rolled/hover)
- [ ] Global animation loop at 4 FPS; idle dice wobble, rolled dice show static value; register/unregister canvas registry **[EPH]**

### Chips & rolling
- [ ] `addDiceChip` builds: optional label, canvas, "dN" sides, optional modifier, result span, ✕ remove; stores automation metadata (modifier, breakdown, label, rollId, rollGroupId, targetValue/Label, conditional, dependsOn, damageOnHit, damageType)
- [ ] `rollAll`: 600ms tumble then lock value; modifier shows "roll±mod=total"; triggers `calculateResults` if automation metadata present
- [ ] Roll button enabled-state tracking

### AI-driven dice automation
- [ ] AI replies may include fenced ```dice_request``` JSON; parsed + stripped from displayed text
- [ ] Confirmation flow: if `confirmations[]`, opens "DM Confirmation Needed" modal (input per question); "Confirm & Load Dice" injects Q/A back as "[DM Clarification]…" and re-sends; "Skip & Load Anyway"/Escape/backdrop loads as-is
- [ ] `populateDiceTable`: portion per participant, expands each `NdM` into chips (modifier on first die only), attaches metadata, scrolls into view
- [ ] `calculateResults`: groups by `rollGroupId`, rawSum+modifier=total, compares vs `targetValue` (hit/miss), resolves `conditional:'on_hit'` vs `dependsOn` parent (skip if parent missed); CSS states hit/miss/skipped/conditional/active
- [ ] `formatDiceResults` per-participant summary; `injectResults` writes summary into prompt, focuses, flashes border (DM reviews + re-sends) **[EPH]**

### NPC / Enemy picker modal
- [ ] DM section (adds AI persona), Campaign NPCs + Enemies columns, "From Notes" (names auto-extracted from Story Notes, skipping stop-words/campaign names)
- [ ] Custom name input + Add (Enter adds, Escape closes); selecting a name adds a portion + closes; backdrop/✕/Escape close

---

## G. DM screen — music, timer & sound

### Spotify music (left sidebar)
- [ ] Collapsible "♫ Music"; "Connect Spotify" (hidden once token exists) starts PKCE OAuth (verifier **[LS]** `spotify_code_verifier`, SHA-256 challenge, redirect to `…github.io/dnd/callback.html`)
- [ ] Tokens **[LS]**: `spotify_access_token`, `spotify_refresh_token`, `spotify_token_expiry`; refresh 1 min before expiry
- [ ] Loads Web Playback SDK on demand; player "DnD Session Manager" at 50% vol; ready/not_ready/state-change/error listeners
- [ ] 6 mood buttons (Tavern, Battle, Suspense, Forest, Feast, Walking) → hardcoded playlists; toggling active mood pauses; else shuffle + random offset start; active highlighted; auto-opens section; guards for no device / no playlist
- [ ] Transport: ⏮ / ▶⏸ / ⏭ + volume slider (0–100→0–1); now-playing line **[EPH]**

### Timer (left sidebar)
- [ ] MM:SS display; presets 0:30/1:00/2:00/5:00; custom input ("m:ss" or seconds; Enter/"Set"); Start/Pause + Reset
- [ ] Counts down per second; ≤10s pulsing orange warning; at 0 flashing red + war horn; Start reuses last duration if at 0 **[EPH]**

### Synthesized sound (Web Audio)
- [ ] War horn on timer completion: 3 layered sawtooth tones w/ pitch-bend + vibrato + swell + noise breath, second blast ~2.8s later **[EPH]**
- [ ] Click sounds intercepted in capture phase: "clunk" (buttons/pips/etc.), "toggle" (collapsible headers/tabs), "tick" (sliders + dice dragstart); skips text/number inputs **[EPH]**

---

## H. Player screen (`player.html`)

### Character select & loading
- [ ] Shown when no valid `?char=` param; title + subtitle
- [ ] One card per character in `characterSheets/`; class-derived icon, name, class, ▶; click → `?char=<key>` reload
- [ ] Empty state message; document title set
- [ ] On load reads `characterSheets` once → `CHARS` map (name, class, level, xp, maxHp, ac, proficiency, spellSaveDC/Attack, stats, slots, abilities, spells)
- [ ] Spell parse from rawMarkdown with backfill write-back **[FB]**
- [ ] Proficiency computed from level (`ceil(level/4)+1`)

### Layout & header
- [ ] Title + class·level label; close box (✝) → back to select
- [ ] Clicking name or class/level opens XP modal
- [ ] 3 tabs (mobile): ⚔ Stats, ⊞ Character, ☴ Dice; collapse to 3-column grid ≥980px (tabs hidden)

### HP
- [ ] Ornate bar + counter; − (damage) / + (heal) in steps of 1
- [ ] Transaction on `characters/<key>/hp` clamped [0,maxHp]; live two-way **[FB]**
- [ ] Color states low ≤25% / mid ≤50% / normal; animated width
- [ ] Init automation: writes hp=maxHp if null **[FB]**

### Stats, abilities scores, saving throws, skills
- [ ] Core stats: AC, Spell Save DC, Prof Bonus (read-only)
- [ ] Ability score boxes; tapping rolls d20 + mod via 3D dice, crit/fail flagged, pushes to `diceLog` **[FB]** + roll history
- [ ] Saving throws: per-stat prof toggle (max 2), computed save, Roll (d20+save) → diceLog + history; `saveProficiencies` live **[FB]**
- [ ] Skills (18, collapsible): prof toggle (max 4), computed value, Roll (d20+mod) → diceLog + history; `skillProficiencies` live **[FB]**

### 3D dice engine
- [ ] `rollWithFantasticDice(formula,label)`: fullscreen overlay, lazy-init singleton dice-box, roll, summarize
- [ ] After settle: wait 2s, detect die positions on canvas, spawn smoke-puff particles, clear dice, hide overlay ~1s later
- [ ] Config: scale 3.6, gravity 1.6, throwForce 6.2, spinForce 4.6, restitution 0

### Conditions
- [ ] Collapsible "◎ Conditions" (15 conditions w/ descriptions); toggle switch per condition; tapping name shows info popup
- [ ] Active conditions as red chips above list; chip tap shows description
- [ ] `conditions/<Name>` live two-way (underscores ↔ spaces) **[FB]**

### XP modal
- [ ] Opened from name/class label; "Level N"; parses XP (commas)
- [ ] No XP → message + empty bar; else "XP: current / nextThreshold" via 20-entry table, progress fill, "N XP to level L+1" / "Ready to level up!"; level 20 → "Max level reached"
- [ ] Dismiss on backdrop or Escape; read-only

### Inventory (Character tab)
- [ ] 6 collapsible categories (Armour/Weapons/Tools/Loot/Consumables/Other), rendered only if non-empty; empty state
- [ ] Add row: name (max 60) + qty (default 1) + category select (default Consumables) + "+"; Enter adds
- [ ] Weapons/armour open Item Stats modal first; others add directly **[FB]**
- [ ] Item row: bullet, name, optional stat badge (weapon damage / armour AC / legacy), notes, amount, adjust controls
- [ ] Quantity adjust creates/accumulates an **inventory request** to DM (delta 0 removes request) **[FB→DM]**; pending shows "(current) Name (±delta)" and hides controls
- [ ] Remove (×) deletes item + clears pending requests **[FB]**
- [ ] Legacy string entries coerced to `{name, amount:1, category:'other'}`

### Item Stats modal
- [ ] Weapons: dice count (1–20) + die type (d4–d20, default d6); damage type select (12 types); "Other info" notes
- [ ] Armour: AC (1–30, default 10); notes
- [ ] Add builds item data + pushes to inventory **[FB]** + resets row; Cancel closes (Escape does NOT close this modal)

### Gold
- [ ] "◎ Gold" value + −/+; clicking reveals inline amount (min 1) + ✔/✕ (Enter confirms, Escape cancels)
- [ ] Confirm pushes a **gold request** to DM **[FB→DM]**; pending shows summed "(±total)"
- [ ] `gold` live **[FB]**

### Abilities & features (Character tab)
- [ ] Active abilities: info button (icon + name + "max/max") + Cast; name opens description popup
- [ ] Cast decrements remaining (optimistic), disables at max, flashes "Cast ✦" 700ms, persists used count **[FB]**
- [ ] Passive features as chips with description popups
- [ ] Hardcoded `ABILITY_DESCRIPTIONS` lookup; used counts live two-way; init automation defaults to 0 **[FB]**

### Spells & slots (Character tab)
- [ ] Collapsible "✧ Spells" (only if spells/slots exist)
- [ ] Cantrips as chips (no cost) with descriptions
- [ ] Levelled spells grouped, [name][Cast]; Cast consumes slot ≥ spell level; if multiple types, cast-slot popup with "N left"; flashes "Cast ✦"; disabled when none remain
- [ ] Spell-slot diamond pips; tapping toggles spent/unspent
- [ ] `slots` live two-way; init automation writes all-false defaults **[FB]**

### Dice tab — manual, notes, history
- [ ] Manual roller: count (1–10,12,20) + die type (d4–d100, d20 default) + Roll; sum total; popup breakdown; pushes to diceLog (mod 0) + history (no crit/fail)
- [ ] Notes panel (collapsible): debounced 800ms save to `characters/<key>/notes`; live update only when textarea unfocused **[FB]**
- [ ] Roll history: up to 8 newest, type + dice + total w/ crit/fail color; clear button; persisted to `rollHistory` + live-synced (cap 8) **[FB]**

### Shared popup & DM channels
- [ ] Shared `#ability-popup` for abilities/features/cantrips/spells/conditions/manual results; positioned/flipped/clamped; dismiss on outside click or Escape
- [ ] Player → DM channels: `diceLog`, `inventoryRequests/<key>`, `goldRequests/<key>`
- [ ] Direct player writes (no approval): HP, conditions, save/skill proficiencies, ability used-counts, slots, notes, rollHistory, add/remove inventory, item stats
- [ ] No localStorage on player screen — all persistence is Firebase

---

## I. Standalone / dormant — DECIDE IF IN SCOPE

> These are not part of the normal DM/player flow. Confirm with the owner whether to port,
> drop, or rebuild each.

### combat-map.html — tactical grid (reachable only by direct URL; NOT linked in-app)
- [ ] 39×27 square grid, 32px cells, 5 ft/square, checkerboard floor, toggleable grid lines
- [ ] Tools: Move (default), Draw Wall, Erase, Grid ON/OFF, Clear (confirm), Export State; tool-label indicator
- [ ] Walls as a Set of "col,row"; click-drag paint/erase with bevel rendering
- [ ] Tokens: player(blue)/enemy(red)/npc(green); tray grouped Players/Enemies/NPCs
- [ ] Drag from tray → canvas (custom ghost, blocked on walls); move placed token (5px drag threshold vs click=select); right-click menu Rename/Remove; Add NPC footer (input + Enter)
- [ ] Chebyshev distance; 4 range bands (5/10/30/60 ft) gated by line-of-sight (Bresenham); LOS lines green/red dashed with ft labels; on-canvas legend
- [ ] Export modal: pretty JSON (grid, tokens, walls, pairwise distances + range/LOS flags) + Copy ("Copied!" 1.2s)
- [ ] Reads `characterSheets` + `campaign` once **[FB read-only]**; placeholder fallback offline; **no write-back / no sync**
- [ ] Close box → index.html

### dice-lab.html — 3D dice sandbox (linked from DM menu, experimental)
- [ ] Same `@3d-dice/dice-box@1.1.4`, but a parallel experiment — NOT the production renderer
- [ ] Quick Roll (notation + modifier + theme + Roll/Clear; Enter rolls)
- [ ] Physics Lab sliders (scale/gravity/throw/spin/bounce/color) + Apply/Reset; changing a slider debounces + rebuilds the dice box
- [ ] 6 presets (Attack/Advantage/Save/Fireball/Stat Roll/Weapon Damage) auto-roll
- [ ] Latest Result box + breakdown + per-die pills; timestamped Roll Log; Reroll Last; smoke effect; status chip; file:// warning
- [ ] Useful reference for production physics defaults

### callback.html — Spotify OAuth redirect (live infra, not a clickable page)
- [ ] Authorization Code + PKCE landing; reads `code`/`error`, `code_verifier` from **[LS]**
- [ ] Token exchange POST to Spotify; on success stores access/refresh/expiry **[LS]**, removes verifier, redirects to `/dnd/`; error states handled
- [ ] localStorage key contract shared with the DM screen — preserve or migrate jointly

---

## J. Cross-cutting parity notes

- [ ] **Real-time sync surface (DM ↔ player):** HP, inventory amounts, gold, spell-slot spent state, ability used-counts, conditions, save/skill proficiencies, notes, rollHistory, and dice log — all FB-backed; inventory/gold *requests* originate on the player side
- [ ] **Not persisted (lost on reload):** DM conversation/storyboard, meta comments, story notes, undo/redo stack, dice-table contents, timer, music UI; player tab + accordion states, dice overlay (budget tracker is the only LS exception on the DM side)
- [ ] **AI call sites (4):** streaming prompt send; campaign PDF extraction (non-stream, max 4096); session-end summary (non-stream, max 2048); dice-confirmation re-send (reuses streaming). Each records budget usage
- [ ] **Keyboard:** Enter=send / Shift+Enter=newline; Cmd/Ctrl+Z undo, +Shift redo; Escape closes popups/modals (note: player Item-Stats modal does NOT close on Escape); Enter in timer/NPC/manual/gold/item inputs; type-to-confirm ("delete"/"reset") for destructive actions
- [ ] **Hardcoded content libraries to carry over:** ~40 ability descriptions + ~90 spell descriptions (DM), separate ability/spell description tables (player), 15 conditions, 18 skills, 20-entry XP threshold table, 6 Spotify mood→playlist mappings
- [ ] **Dormant code in player.html** (NOT active, safe to omit): legacy 2D pixel-canvas dice board (`legacyDiceBoardArchive` template + `initDiceStrip`/`addDiceChip`/etc., never mounted) and the orphaned `renderAbilityRollCounter`/`.roll-counter` panel
