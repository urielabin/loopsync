export interface EnvelopePoint {
  time: number
  value: number
}

/**
 * 808-style kick: a sine oscillator whose frequency ramps sharply down
 * (the "pitch drop" that gives a kick its thump) while its amplitude
 * decays independently. Returned as breakpoints so the caller wires them
 * onto real AudioParam automation (setValueAtTime/exponentialRampToValueAtTime)
 * -- this function has no AudioContext dependency, so it's testable on its own.
 */
export function kickEnvelope(): { frequency: EnvelopePoint[]; gain: EnvelopePoint[] } {
  return {
    frequency: [
      { time: 0, value: 150 },
      { time: 0.08, value: 40 },
    ],
    gain: [
      { time: 0, value: 1 },
      { time: 0.3, value: 0.0001 },
    ],
  }
}
