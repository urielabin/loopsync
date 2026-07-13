import { STEP_COUNT, TRACK_IDS, type Pattern, type TrackId } from '../lib/pattern.js'

const TRACK_LABELS: Record<TrackId, string> = {
  kick: 'Kick',
  snare: 'Snare',
  hihat: 'Hi-hat',
  clap: 'Clap',
  'synth-stab': 'Stab',
}

export function StepGrid({
  pattern,
  currentStep,
  onToggle,
}: {
  pattern: Pattern
  currentStep: number | null
  onToggle: (trackId: TrackId, stepIndex: number) => void
}) {
  return (
    <div className="flex flex-col gap-2" data-testid="step-grid">
      {TRACK_IDS.map((trackId) => (
        <div key={trackId} className="flex items-center gap-2">
          <span className="w-14 text-sm text-secondary shrink-0">{TRACK_LABELS[trackId]}</span>
          <div className="flex gap-1">
            {pattern.tracks[trackId].map((active, stepIndex) => (
              <button
                key={stepIndex}
                aria-label={`${trackId} step ${stepIndex + 1}`}
                data-testid={`step-${trackId}-${stepIndex}`}
                data-active={active}
                onClick={() => onToggle(trackId, stepIndex)}
                className={`w-6 h-6 rounded ${active ? 'bg-accent' : 'bg-surface border border-border'} ${
                  currentStep === stepIndex ? 'ring-2 ring-white' : ''
                } ${stepIndex % 4 === 0 ? 'ml-1' : ''}`}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2 mt-1">
        <span className="w-14 shrink-0" />
        <div className="flex gap-1">
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <span key={i} className={`w-6 text-center text-[10px] text-secondary ${i % 4 === 0 ? 'ml-1' : ''}`}>
              {i + 1}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
