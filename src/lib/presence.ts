import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase-client.js'

/**
 * A separate Realtime channel from the pattern-sync one -- Presence tracks
 * "who's here" (ephemeral, not persisted to Postgres), distinct from the
 * postgres_changes channel that syncs the actual pattern data.
 */
export function joinPresence(roomCode: string, clientId: string, onCountChange: (count: number) => void): RealtimeChannel {
  const channel = supabase.channel(`presence:${roomCode}`, { config: { presence: { key: clientId } } })

  channel
    .on('presence', { event: 'sync' }, () => {
      onCountChange(Object.keys(channel.presenceState()).length)
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void channel.track({ joinedAt: Date.now() })
      }
    })

  return channel
}
