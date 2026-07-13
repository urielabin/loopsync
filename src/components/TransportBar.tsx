export function TransportBar({
  playing,
  onTogglePlay,
  bpm,
  onBpmChange,
}: {
  playing: boolean
  onTogglePlay: () => void
  bpm: number
  onBpmChange: (bpm: number) => void
}) {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onTogglePlay}
        data-testid="transport-toggle"
        className="bg-accent text-white rounded-lg px-6 py-2 font-medium w-24"
      >
        {playing ? 'Stop' : 'Play'}
      </button>
      <div className="flex items-center gap-2">
        <label htmlFor="bpm" className="text-sm text-secondary">BPM</label>
        <input
          id="bpm"
          type="range"
          min={60}
          max={200}
          value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
        />
        <span className="text-sm w-10">{bpm}</span>
      </div>
    </div>
  )
}
