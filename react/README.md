# D&D Session Manager — React app

The live app for the campaign: a DM screen and a per-character player screen,
sharing one Firebase Realtime Database so every change syncs live between the
DM and the players.

## Routes

| Route | What it is |
|---|---|
| `/` | Home — links to the two screens |
| `/dm` | The DM screen ("Book of the Raven"): party tracker, AI narration, requests, whispers, timer, dice roller, notes, Spotify |
| `/play?char=<key>` | The player screen (character card): stats, skills, combat, spells, inventory, journal — with 3D dice |
| `/callback` | Spotify OAuth redirect handler |

Character keys: `akwan-akusian`, `fiel-amimso`, `flicker`, `fordee-whax`.
`/play` without a `char` param shows a character picker.

## Commands

```bash
npm run dev      # local dev on http://127.0.0.1:5173 (pinned for Spotify OAuth)
npm run build    # production build to dist/
npm run deploy   # build + deploy to Cloudflare Pages (dnd-react.pages.dev)
npm run lint     # eslint over the tree
```

## Backend

- **Firebase RTDB** (`src/config.js`, `src/firebase.js`) — the source of truth;
  `src/store/gameStore.js` mirrors it into React and holds all write helpers.
  Node shapes are documented in `DATA-MODEL.md`.
- **AI proxy** — a Cloudflare Worker (`../worker/`) that holds the Anthropic
  key; the client is `src/lib/ai.js`.
- **Spotify** — PKCE auth + Web Playback SDK in `src/dm/spotify.js`; requires
  the exact redirect URI registered in the Spotify dashboard (see DEPLOY.md).

The pre-refresh screens live in `../legacy/` as a frozen reference.
