import { createClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { emptyPattern } from '../../src/lib/pattern.js'

// Real local Supabase stack (via `supabase start`), no mocking. Unlike
// masterlint's RLS test (which proves isolation), this proves the
// opposite on purpose: rooms.pattern is designed to be readable/writable
// by anyone with the room code, no account needed -- this test confirms
// that intentionally-permissive policy actually behaves as designed for
// a second, completely unrelated anonymous client.
const SUPABASE_URL = process.env['VITE_SUPABASE_URL'] ?? 'http://127.0.0.1:54321'
const ANON_KEY = process.env['VITE_SUPABASE_ANON_KEY']!

function roomCode() {
  return `TEST${Date.now()}${Math.floor(Math.random() * 1000)}`
}

describe('rooms RLS is intentionally permissive (real HTTP against real local Supabase, no mocking)', () => {
  it('lets one anonymous client create a room and a second, unrelated anonymous client read it', async () => {
    const clientA = createClient(SUPABASE_URL, ANON_KEY)
    const clientB = createClient(SUPABASE_URL, ANON_KEY)
    const code = roomCode()

    const { error: insertError } = await clientA.from('rooms').insert({ room_code: code, bpm: 120, pattern: emptyPattern() })
    expect(insertError).toBeNull()

    const { data, error } = await clientB.from('rooms').select('*').eq('room_code', code).single()
    expect(error).toBeNull()
    expect(data?.['bpm']).toBe(120)
  })

  it('lets a second, unrelated anonymous client update the pattern created by the first', async () => {
    const clientA = createClient(SUPABASE_URL, ANON_KEY)
    const clientB = createClient(SUPABASE_URL, ANON_KEY)
    const code = roomCode()

    await clientA.from('rooms').insert({ room_code: code, bpm: 120, pattern: emptyPattern() })

    const updatedPattern = { tracks: { ...emptyPattern().tracks, kick: [true, false, false, false] } }
    const { error: updateError } = await clientB.from('rooms').update({ pattern: updatedPattern, bpm: 140 }).eq('room_code', code)
    expect(updateError).toBeNull()

    const { data } = await clientA.from('rooms').select('*').eq('room_code', code).single()
    expect(data?.['bpm']).toBe(140)
    expect(data?.['pattern']).toEqual(updatedPattern)
  })
})
