import type { EnvelopePoint } from './kick.js'

/** Filtered white-noise burst with a fast decay -- the caller runs noise through a bandpass/highpass BiquadFilterNode using this as the amplitude envelope. */
export function snareEnvelope(): EnvelopePoint[] {
  return [
    { time: 0, value: 1 },
    { time: 0.15, value: 0.0001 },
  ]
}
