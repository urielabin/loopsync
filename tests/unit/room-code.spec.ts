import { describe, expect, it } from 'vitest'
import { generateRoomCode } from '../../src/lib/room-code.js'

describe('generateRoomCode', () => {
  it('is 6 characters from the unambiguous alphabet (no I/1/O/0)', () => {
    expect(generateRoomCode()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
  })

  it('produces distinct codes across many calls (shape check, not collision-proof)', () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateRoomCode()))
    expect(codes.size).toBeGreaterThan(195)
  })
})
