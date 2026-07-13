export interface SchedulerState {
  nextStepTime: number
  nextStepIndex: number
}

export interface ScheduleDecision {
  stepIndex: number
  time: number
}

export function stepDurationSeconds(bpm: number, stepsPerBeat = 4): number {
  return 60 / bpm / stepsPerBeat
}

/**
 * The Web Audio "lookahead scheduler" pattern (Chris Wilson's "A Tale of
 * Two Clocks"): given where we last left off, decide which steps fall
 * within the lookahead window and exactly when to play them, using
 * audioContext.currentTime-based scheduling rather than wall-clock
 * setTimeout delays. Pure state-in/state-out so it's testable without a
 * real AudioContext or timer -- the caller (a setInterval tick in
 * practice) is responsible for actually scheduling audio at each decision's
 * `time` and for calling this again with the returned state.
 */
export function scheduleSteps(
  state: SchedulerState,
  lookaheadEndTime: number,
  stepCount: number,
  stepDurationS: number,
): { decisions: ScheduleDecision[]; nextState: SchedulerState } {
  const decisions: ScheduleDecision[] = []
  let { nextStepTime, nextStepIndex } = state

  while (nextStepTime < lookaheadEndTime) {
    decisions.push({ stepIndex: nextStepIndex, time: nextStepTime })
    nextStepTime += stepDurationS
    nextStepIndex = (nextStepIndex + 1) % stepCount
  }

  return { decisions, nextState: { nextStepTime, nextStepIndex } }
}
