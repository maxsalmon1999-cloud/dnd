// Build the refreshed DM screen's Party shape from live Firebase data.
// Reuses the player adapter (single source of truth for stats/abilities/spells),
// then reshapes into what the DM "Book of the Raven" Party cards expect:
//   { id, name, cls, race, lvl, hp, max, ac, dc, abil:[{k,v}], feats[], actions[] }
import { adaptCharacter } from '../refreshed/characterAdapter'

export function adaptDmParty(sheets, characters) {
  const keys = Object.keys(sheets || {})
  return keys.map((key) => {
    const live = (characters || {})[key] || {}
    const C = adaptCharacter(sheets[key], live)
    const liveAbil = live.abilities || {}

    // ability tiles, highest modifier first (matches the prototype's ordering)
    const abil = [...C.stats]
      .map((st) => ({ k: st.key, v: st.mod, n: parseInt(st.mod, 10) || 0 }))
      .sort((a, b) => b.n - a.n)
      .map(({ k, v }) => ({ k, v }))

    // feats = the character's features; limited-use ones show live remaining/max
    const feats = (sheets[key].abilities || []).map((a) =>
      a.max ? `${a.name} (${Math.max(0, a.max - (liveAbil[a.key] || 0))}/${a.max})` : a.name
    )

    // actions = known cantrips + leveled spells (flat name list)
    const actions = [
      ...C.cantrips.map((c) => c.n),
      ...Object.values(C.spells).flat().map((sp) => sp.n),
    ]

    return {
      id: key,
      name: C.name,
      cls: C.klass,
      race: C.race,
      lvl: C.level,
      hp: C.hp.cur,
      max: C.hp.max,
      ac: C.ac,
      dc: C.spellDC,
      abil,
      feats,
      actions,
    }
  })
}
