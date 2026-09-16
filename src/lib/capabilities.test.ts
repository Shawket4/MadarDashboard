import { describe, expect, it } from 'vitest'

import { CAPABILITIES, CAPABILITY_GROUPS } from '@/generated/capabilities'

// The registry is generated from MadarRust/authz/spec/capabilities.toml. These
// pin the invariants the dashboard's permission screens rely on.
describe('generated capability registry', () => {
  it('has unique ids and keys', () => {
    expect(new Set(CAPABILITIES.map((c) => c.id)).size).toBe(CAPABILITIES.length)
    expect(new Set(CAPABILITIES.map((c) => c.key)).size).toBe(CAPABILITIES.length)
  })

  it('keeps core roles within defaults, so a core grant is never a toggle that widens a role', () => {
    for (const c of CAPABILITIES) {
      for (const k of c.core) expect(c.defaults, c.key).toContain(k)
      expect(c.tier === 'core', c.key).toBe(c.core.length > 0)
    }
  })

  it('names every capability in both languages and puts it in a known group', () => {
    const groups = new Set(CAPABILITY_GROUPS.map((g) => g.key))
    for (const c of CAPABILITIES) {
      expect(c.en && c.ar && c.en !== c.ar, c.key).toBeTruthy()
      expect(groups.has(c.group), c.key).toBe(true)
    }
  })
})
