import { scheduleSteps, stepDurationSeconds, type SchedulerState } from './scheduler.js'
import { kickEnvelope } from './voices/kick.js'
import { snareEnvelope } from './voices/snare.js'
import { hihatEnvelope } from './voices/hihat.js'
import { clapEnvelope } from './voices/clap.js'
import { synthStabEnvelope, SYNTH_STAB_FREQUENCIES_HZ } from './voices/synth-stab.js'
import { STEP_COUNT, TRACK_IDS, type Pattern, type TrackId } from '../lib/pattern.js'

const TICK_INTERVAL_MS = 25
const LOOKAHEAD_S = 0.1
const NOISE_BUFFER_S = 0.3

function scheduleGainEnvelope(gainParam: AudioParam, envelope: { time: number; value: number }[], startTime: number) {
  envelope.forEach((point, i) => {
    const value = Math.max(point.value, 0.0001)
    const at = startTime + point.time
    if (i === 0) gainParam.setValueAtTime(value, at)
    else gainParam.exponentialRampToValueAtTime(value, at)
  })
}

/**
 * Wires the pure scheduler/voice-envelope functions onto real AudioNodes.
 * Everything decision-worthy (when to schedule, what each voice's envelope
 * looks like) lives in scheduler.ts/voices/*.ts and is unit-tested there;
 * this class is the untested I/O glue, matching the pattern used
 * throughout this session's other repos.
 */
export class LoopEngine {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private trackGains: Partial<Record<TrackId, GainNode>> = {}
  private noiseBuffer: AudioBuffer | null = null
  private intervalId: ReturnType<typeof setInterval> | null = null
  private schedulerState: SchedulerState = { nextStepTime: 0, nextStepIndex: 0 }

  constructor(
    private readonly getPattern: () => Pattern,
    private readonly getBpm: () => number,
    private readonly onStep: (stepIndex: number) => void,
  ) {}

  private ensureContext(): AudioContext {
    if (this.audioContext) return this.audioContext

    const ctx = new AudioContext()
    this.audioContext = ctx
    this.masterGain = ctx.createGain()
    this.masterGain.connect(ctx.destination)
    for (const id of TRACK_IDS) {
      const gain = ctx.createGain()
      gain.connect(this.masterGain)
      this.trackGains[id] = gain
    }

    const bufferSize = Math.floor(ctx.sampleRate * NOISE_BUFFER_S)
    this.noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = this.noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1

    return ctx
  }

  setTrackVolume(id: TrackId, volume: number) {
    this.trackGains[id]?.gain.setValueAtTime(volume, this.ensureContext().currentTime)
  }

  start() {
    const ctx = this.ensureContext()
    if (ctx.state === 'suspended') void ctx.resume()
    this.schedulerState = { nextStepTime: ctx.currentTime, nextStepIndex: 0 }
    this.intervalId = setInterval(() => this.tick(), TICK_INTERVAL_MS)
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private tick() {
    const ctx = this.audioContext
    if (!ctx) return

    const stepDuration = stepDurationSeconds(this.getBpm())
    const { decisions, nextState } = scheduleSteps(this.schedulerState, ctx.currentTime + LOOKAHEAD_S, STEP_COUNT, stepDuration)
    this.schedulerState = nextState

    const pattern = this.getPattern()
    for (const decision of decisions) {
      for (const trackId of TRACK_IDS) {
        if (pattern.tracks[trackId]?.[decision.stepIndex]) {
          this.playVoice(trackId, decision.time)
        }
      }
      const delayMs = Math.max(0, (decision.time - ctx.currentTime) * 1000)
      setTimeout(() => this.onStep(decision.stepIndex), delayMs)
    }
  }

  private playVoice(trackId: TrackId, time: number) {
    const ctx = this.ensureContext()
    const trackGain = this.trackGains[trackId]
    if (!trackGain) return

    if (trackId === 'kick') {
      const { frequency, gain } = kickEnvelope()
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      frequency.forEach((p) => osc.frequency.setValueAtTime(p.value, time + p.time))
      const gainNode = ctx.createGain()
      scheduleGainEnvelope(gainNode.gain, gain, time)
      osc.connect(gainNode).connect(trackGain)
      osc.start(time)
      osc.stop(time + gain.at(-1)!.time + 0.05)
      return
    }

    if (trackId === 'synth-stab') {
      const envelope = synthStabEnvelope()
      const gainNode = ctx.createGain()
      scheduleGainEnvelope(gainNode.gain, envelope, time)
      gainNode.connect(trackGain)
      for (const freq of SYNTH_STAB_FREQUENCIES_HZ) {
        const osc = ctx.createOscillator()
        osc.type = 'sawtooth'
        osc.frequency.value = freq
        osc.connect(gainNode)
        osc.start(time)
        osc.stop(time + envelope.at(-1)!.time + 0.05)
      }
      return
    }

    // snare / hihat / clap: filtered noise burst, differing only in the
    // filter type/frequency and the envelope shape used.
    const envelope = trackId === 'snare' ? snareEnvelope() : trackId === 'hihat' ? hihatEnvelope() : clapEnvelope()
    const noise = ctx.createBufferSource()
    noise.buffer = this.noiseBuffer
    const filter = ctx.createBiquadFilter()
    filter.type = trackId === 'hihat' ? 'highpass' : 'bandpass'
    filter.frequency.value = trackId === 'hihat' ? 7000 : trackId === 'snare' ? 1800 : 1200
    const gainNode = ctx.createGain()
    scheduleGainEnvelope(gainNode.gain, envelope, time)
    noise.connect(filter).connect(gainNode).connect(trackGain)
    noise.start(time)
    noise.stop(time + envelope.at(-1)!.time + 0.05)
  }
}
