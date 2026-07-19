# Firebase data model (the migration contract)

> This is the **single source of truth** the whole app syncs through. Both the DM screen and
> the player screens read and write here; Firebase pushes every change live to all connected
> devices. The React rebuild must read/write these exact shapes so old and new clients stay
> compatible during the migration.
>
> Captured from the live `dnd-host` database on 2026-06-14.

## Top-level nodes

| Node | Purpose | Who writes |
|------|---------|------------|
| `characterSheets/{key}` | **Static** character definition (parsed from the uploaded sheet) | DM (on upload) |
| `characters/{key}` | **Live** runtime state of each character | DM + that player |
| `campaign` | Structured campaign data (AI-extracted from the PDF) | DM |
| `inventoryRequests/{charKey}/{id}` | Player→DM pending inventory-change requests | Player (created), DM (removes) |
| `goldRequests/{charKey}/{id}` | Player→DM pending gold-change requests | Player (created), DM (removes) |
| `diceLog/{id}` | Append-only log of player dice rolls | Players (push) |
| `whispers/{charKey}/{id}` | Private player↔DM messages (one thread per character, both directions) | Player + DM (push) |
| `campaignRag` | **Not used by the app** — orphaned RAG index. Out of scope. | — |

> `inventoryRequests`, `goldRequests`, and `diceLog` only exist when there's data — they're
> created on demand and may be absent (treat as empty).

`{key}` is a slug of the character name (e.g. `flicker`, `fiel-amimso`).

## `characterSheets/{key}` — static definition

```
{
  key, name, cls,            // identity (cls = class string, e.g. "Warlock")
  level, ac, maxHp, proficiency,
  stats,                     // ability modifiers (STR/DEX/CON/INT/WIS/CHA)
  spellSaveDC, spellAttack,
  spellSlots,                // slot counts per level (definition)
  spells,                    // known spells
  abilities,                 // active + passive ability definitions
  rawMarkdown                // original uploaded sheet text (kept for re-parsing/export)
}
```

## `characters/{key}` — live runtime state

```
{
  hp, maxHp,                 // current/max hit points (hp changed via TRANSACTION, clamped 0..maxHp)
  gold,                      // integer gold pieces
  inventory: {               // map of itemId -> item
    "<itemId>": {
      name, amount, category,        // category: armour|weapons|tools|loot|consumables|other
      damageDice?, damageType?, damageAbility?,   // weapons
      ac?,                            // armour
      notes?
    }
  },
  abilities: { "<ability_key>": usedCount },   // how many uses spent
  slots:      { "<slotKey>_<index>": true },   // spent spell-slot pips (present once used)
  conditions: { "<Condition_Name>": true },    // active conditions (spaces -> underscores)
  saveProficiencies:  ["WIS","DEX"],           // max 2
  skillProficiencies: ["Perception", ...],     // max 4
  notes,                                        // player's private notes (debounced save)
  rollHistory: [                                // last 8 rolls, newest first
    { label, total, type, suffix, isTotalCrit, isTotalFail }
  ]
}
```

Item IDs are either Firebase push IDs (e.g. `-Oq5qCOiz...`) or slugs (e.g. `arcane_focus_tome`).

## Request queue entries

```
inventoryRequests/{charKey}/{id}: { itemKey, itemName, currentAmount, delta, timestamp }
goldRequests/{charKey}/{id}:       { charKey, charName, currentGold, delta, timestamp }
diceLog/{id}:                      { character, charKey, label/dice, result/total, type, modifier, timestamp }
whispers/{charKey}/{id}:           { text, from: 'player' | 'dm', ts }
```

Whispers are a single live thread per character shared by both screens: the player's
✉ "Message the DM" popup and the DM screen's ✉ Messages panel both push to and read
`whispers/{charKey}`. Push keys sort chronologically (oldest→newest). `from` marks the
sender so each side can align its own messages.

## `campaign`

```
{ meta, promptTemplates, npcs, locations, encounters, enemyStats }
```

Used to build the AI system prompt and to populate NPC/enemy pickers.

## SRD reference data (bundled, not in Firebase)

`src/data/srd/*.json` is the full 5e SRD (2014 rules): all 319 spells (full text +
damage scaling), every class feature, racial trait, per-level class progression
(spell slots, proficiency, features, class counters), conditions, magic items,
and mundane gear. Generated from [5e-bits/5e-database](https://github.com/5e-bits/5e-database)
(CC-BY-4.0) by `node tools/build-srd.mjs` (raw source in `tools/srd-2014/`).

Lookups go through `src/data/srd.js` (fuzzy name resolution — parentheticals,
trailing dice, plurals). Priority order:

- **Spells** — SRD full spell card first, then the hand-curated one-liners in
  `gameData.js` (which cover non-SRD content the party uses: Hex, Toll the
  Dead, changeling traits…), then the sheet's own text.
- **Abilities** — curated/sheet text first (compact, table-tuned), SRD class
  feature / racial trait full text as fallback.

`characterAdapter.js` also falls back to the SRD class table for spell slots
when a sheet has no slot definitions, so any class/level combination works.
