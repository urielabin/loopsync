import { describe, expect, it } from 'vitest'
import { kickEnvelope } from '../../src/audio/voices/kick.js'
import { snareEnvelope } from '../../src/audio/voices/snare.js'
import { hihatEnvelope } from '../../src/audio/voices/hihat.js'
import { clapEnvelope } from '../../src/audio/voices/clap.js'
import { synthStabEnvelope, SYNTH_STAB_FREQUENCIES_HZ } from '../../src/audio/voices/synth-stab.js'
import type { EnvelopePoint } from '../../src/audio/voices/kick.js'

function expectIncreasingTimes(points: EnvelopePoint[]) {
  for (let i = 1; i < points.length; i++) {
    expect(points[i]!.time).toBeGreaterThan(points[i - 1]!.time)
  }
}

function expectDecaysToNearZero(points: EnvelopePoint[]) {
  expect(points[0]!.value).toBeGreaterThan(0)
  expect(points.at(-1)!.value).toBeLessThan(0.01)
}

describe('kickEnvelope', () => {
  it('has a frequency that drops (the pitch-envelope thump)', () => {
    const { frequency } = kickEnvelope()
    expectIncreasingTimes(frequency)
    expect(frequency.at(-1)!.value).toBeLessThan(frequency[0]!.value)
  })

  it('has a gain that decays to near silence', () => {
    const { gain } = kickEnvelope()
    expectIncreasingTimes(gain)
    expectDecaysToNearZero(gain)
  })
})

describe('snareEnvelope', () => {
  it('decays to near silence with increasing timestamps', () => {
    const envelope = snareEnvelope()
    expectIncreasingTimes(envelope)
    expectDecaysToNearZero(envelope)
  })
})

describe('hihatEnvelope', () => {
  it('decays faster than the snare (shorter total duration)', () => {
    const hihat = hihatEnvelope()
    const snare = snareEnvelope()
    expectIncreasingTimes(hihat)
    expectDecaysToNearZero(hihat)
    expect(hihat.at(-1)!.time).toBeLessThan(snare.at(-1)!.time)
  })
})

describe('clapEnvelope', () => {
  it('has multiple quick attack/decay bursts before its final tail', () => {
    const envelope = clapEnvelope()
    expectIncreasingTimes(envelope)
    expectDecaysToNearZero(envelope)
    // At least one dip-then-rise pair -- the "flam" character that makes a
    // clap sound distinct from a single-decay snare/hihat.
    const hasDipThenRise = envelope.some((p, i) => i > 0 && i < envelope.length - 1 && p.value < envelope[i - 1]!.value && envelope[i + 1]!.value > p.value)
    expect(hasDipThenRise).toBe(true)
  })
})

describe('synthStabEnvelope / SYNTH_STAB_FREQUENCIES_HZ', () => {
  it('decays to near silence', () => {
    expectDecaysToNearZero(synthStabEnvelope())
  })

  it('defines a 3-note chord', () => {
    expect(SYNTH_STAB_FREQUENCIES_HZ).toHaveLength(3)
    expect(new Set(SYNTH_STAB_FREQUENCIES_HZ).size).toBe(3)
  })
})
