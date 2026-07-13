export const TRACK_IDS = ['kick', 'snare', 'hihat', 'clap', 'synth-stab'] as const
export type TrackId = (typeof TRACK_IDS)[number]
export const STEP_COUNT = 16

export interface Pattern {
  tracks: Record<TrackId, boolean[]>
}

export function emptyPattern(): Pattern {
  const tracks = {} as Record<TrackId, boolean[]>
  for (const id of TRACK_IDS) tracks[id] = new Array(STEP_COUNT).fill(false)
  return { tracks }
}

export function toggleStep(pattern: Pattern, trackId: TrackId, stepIndex: number): Pattern {
  const steps = pattern.tracks[trackId].map((v, i) => (i === stepIndex ? !v : v))
  return { tracks: { ...pattern.tracks, [trackId]: steps } }
}
