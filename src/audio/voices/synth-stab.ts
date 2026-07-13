import type { EnvelopePoint } from './kick.js'

/** A short synth chord stab -- three detuned oscillators (an A-minor triad) sharing one gain envelope, the only melodic (non-percussive) voice. */
export const SYNTH_STAB_FREQUENCIES_HZ: readonly number[] = [220, 261.63, 329.63]

export function synthStabEnvelope(): EnvelopePoint[] {
  return [
    { time: 0, value: 0.7 },
    { time: 0.2, value: 0.0001 },
  ]
}
