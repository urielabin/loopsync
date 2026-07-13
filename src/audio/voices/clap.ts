import type { EnvelopePoint } from './kick.js'

/**
 * A real clap sound is a few quick, close-together noise bursts (the
 * "flams" of multiple hands) followed by one longer tail -- distinct in
 * shape from a single-decay snare/hihat, not just a retuned copy of them.
 */
export function clapEnvelope(): EnvelopePoint[] {
  return [
    { time: 0, value: 0.9 },
    { time: 0.01, value: 0.1 },
    { time: 0.02, value: 0.9 },
    { time: 0.03, value: 0.1 },
    { time: 0.04, value: 0.8 },
    { time: 0.15, value: 0.0001 },
  ]
}
