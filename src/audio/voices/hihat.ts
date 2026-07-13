import type { EnvelopePoint } from './kick.js'

/** High-passed noise with a very short decay -- brighter and shorter than the snare envelope. */
export function hihatEnvelope(): EnvelopePoint[] {
  return [
    { time: 0, value: 0.8 },
    { time: 0.05, value: 0.0001 },
  ]
}
