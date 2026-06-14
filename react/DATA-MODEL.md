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
```

## `campaign`

```
{ meta, promptTemplates, npcs, locations, encounters, enemyStats }
```

Used to build the AI system prompt and to populate NPC/enemy pickers.
