import { TRACK_IDS, type TrackId } from '../lib/pattern.js'

export function TrackControls({
  muted,
  onToggleMute,
}: {
  muted: Record<TrackId, boolean>
  onToggleMute: (trackId: TrackId) => void
}) {
  return (
    <div className="flex gap-3">
      {TRACK_IDS.map((trackId) => (
        <button
          key={trackId}
          onClick={() => onToggleMute(trackId)}
          data-testid={`mute-${trackId}`}
          className={`text-xs px-2 py-1 rounded border ${muted[trackId] ? 'border-red-400 text-red-400' : 'border-border text-secondary'}`}
        >
          {trackId} {muted[trackId] ? 'muted' : ''}
        </button>
      ))}
    </div>
  )
}
