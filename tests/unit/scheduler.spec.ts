import { describe, expect, it } from 'vitest'
import { scheduleSteps, stepDurationSeconds, type SchedulerState } from '../../src/audio/scheduler.js'

describe('stepDurationSeconds', () => {
  it('is 0.125s per 16th note at 120bpm', () => {
    // 120bpm = 2 beats/sec, 4 steps/beat -> 8 steps/sec -> 0.125s/step
    expect(stepDurationSeconds(120)).toBeCloseTo(0.125, 10)
  })

  it('halves when bpm doubles', () => {
    expect(stepDurationSeconds(240)).toBeCloseTo(stepDurationSeconds(120) / 2, 10)
  })
})

describe('scheduleSteps', () => {
  it('schedules every step whose time falls before the lookahead window ends', () => {
    const state: SchedulerState = { nextStepTime: 0, nextStepIndex: 0 }
    const { decisions } = scheduleSteps(state, 0.3, 16, 0.1)
    expect(decisions).toEqual([
      { stepIndex: 0, time: 0 },
      { stepIndex: 1, time: 0.1 },
      { stepIndex: 2, time: 0.2 },
    ])
  })

  it('wraps the step index around stepCount', () => {
    const state: SchedulerState = { nextStepTime: 0, nextStepIndex: 15 }
    const { decisions } = scheduleSteps(state, 0.25, 16, 0.1)
    expect(decisions.map((d) => d.stepIndex)).toEqual([15, 0, 1])
  })

  it('schedules nothing when the window is already in the past', () => {
    const state: SchedulerState = { nextStepTime: 5, nextStepIndex: 0 }
    const { decisions, nextState } = scheduleSteps(state, 1, 16, 0.1)
    expect(decisions).toEqual([])
    expect(nextState).toEqual(state)
  })

  it('is resumable: feeding nextState back in continues exactly where it left off', () => {
    const state: SchedulerState = { nextStepTime: 0, nextStepIndex: 0 }
    const first = scheduleSteps(state, 0.2, 16, 0.1)
    const second = scheduleSteps(first.nextState, 0.4, 16, 0.1)
    const combined = [...first.decisions, ...second.decisions]

    expect(combined.map((d) => d.stepIndex)).toEqual([0, 1, 2, 3])
    combined.forEach((d, i) => expect(d.time).toBeCloseTo(i * 0.1, 10))
  })
})
