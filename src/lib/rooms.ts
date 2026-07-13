import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase-client.js'
import type { Pattern } from './pattern.js'

export interface RoomRow {
  id: number
  room_code: string
  bpm: number
  pattern: Pattern
  updated_at: string
}

export async function createRoom(roomCode: string, pattern: Pattern, bpm = 120): Promise<RoomRow> {
  const { data, error } = await supabase.from('rooms').insert({ room_code: roomCode, bpm, pattern }).select().single()
  if (error) throw error
  return data as RoomRow
}

export async function getRoomByCode(roomCode: string): Promise<RoomRow | null> {
  const { data, error } = await supabase.from('rooms').select('*').eq('room_code', roomCode).maybeSingle()
  if (error) throw error
  return data as RoomRow | null
}

export async function updateRoomPattern(roomCode: string, pattern: Pattern): Promise<void> {
  const { error } = await supabase.from('rooms').update({ pattern, updated_at: new Date().toISOString() }).eq('room_code', roomCode)
  if (error) throw error
}

export async function updateRoomBpm(roomCode: string, bpm: number): Promise<void> {
  const { error } = await supabase.from('rooms').update({ bpm, updated_at: new Date().toISOString() }).eq('room_code', roomCode)
  if (error) throw error
}

/**
 * Streams UPDATEs to one room via Supabase Realtime -- no polling. Edits
 * are last-write-wins full-pattern overwrites (see updateRoomPattern), so
 * every subscriber just replaces its local state with whatever arrives;
 * there's no merge/CRDT logic here, a deliberate tradeoff for a casual-jam
 * room, not an oversight.
 *
 * `onSubscribed` fires once the WebSocket handshake completes -- events
 * aren't queued for late subscribers, so callers that need to know the
 * subscription is truly live (e.g. tests) should wait on this rather than
 * guessing a timeout.
 */
export function subscribeToRoomUpdates(roomCode: string, onUpdate: (row: RoomRow) => void, onSubscribed?: () => void): RealtimeChannel {
  return supabase
    .channel(`room:${roomCode}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `room_code=eq.${roomCode}` },
      (payload) => onUpdate(payload.new as RoomRow),
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') onSubscribed?.()
    })
}
