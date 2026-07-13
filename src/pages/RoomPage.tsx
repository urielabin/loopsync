import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase-client.js'
import { getRoomByCode, subscribeToRoomUpdates, updateRoomBpm, updateRoomPattern, type RoomRow } from '../lib/rooms.js'
import { joinPresence } from '../lib/presence.js'
import { emptyPattern, toggleStep, type Pattern, type TrackId } from '../lib/pattern.js'
import { LoopEngine } from '../audio/engine.js'
import { StepGrid } from '../components/StepGrid.js'
import { TransportBar } from '../components/TransportBar.js'
import { TrackControls } from '../components/TrackControls.js'
import { PresenceIndicator } from '../components/PresenceIndicator.js'

export function RoomPage() {
  const { code } = useParams<{ code: string }>()
  const roomCode = (code ?? '').toUpperCase()

  const [room, setRoom] = useState<RoomRow | null | undefined>(undefined)
  const [pattern, setPattern] = useState<Pattern>(emptyPattern())
  const [bpm, setBpm] = useState(120)
  const [playing, setPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState<number | null>(null)
  const [muted, setMuted] = useState<Record<TrackId, boolean>>({} as Record<TrackId, boolean>)
  const [realtimeReady, setRealtimeReady] = useState(false)
  const [presenceCount, setPresenceCount] = useState(0)

  // The engine's scheduler tick reads these via closures that must always
  // see the latest values -- refs kept in sync with state on every render,
  // rather than recreating the engine (and losing its running interval)
  // whenever the pattern or bpm changes.
  const patternRef = useRef(pattern)
  const bpmRef = useRef(bpm)
  patternRef.current = pattern
  bpmRef.current = bpm

  const engine = useMemo(
    () => new LoopEngine(() => patternRef.current, () => bpmRef.current, setCurrentStep),
    [],
  )

  useEffect(() => {
    if (!roomCode) return
    let cancelled = false

    getRoomByCode(roomCode).then((row) => {
      if (cancelled) return
      setRoom(row)
      if (row) {
        setPattern(row.pattern)
        setBpm(row.bpm)
      }
    })

    const roomChannel = subscribeToRoomUpdates(
      roomCode,
      (row) => {
        setPattern(row.pattern)
        setBpm(row.bpm)
      },
      () => {
        if (!cancelled) setRealtimeReady(true)
      },
    )

    const clientId = crypto.randomUUID()
    const presenceChannel = joinPresence(roomCode, clientId, setPresenceCount)

    return () => {
      cancelled = true
      engine.stop()
      supabase.removeChannel(roomChannel)
      supabase.removeChannel(presenceChannel)
    }
  }, [roomCode, engine])

  const handleToggleStep = useCallback(
    (trackId: TrackId, stepIndex: number) => {
      const next = toggleStep(patternRef.current, trackId, stepIndex)
      setPattern(next)
      void updateRoomPattern(roomCode, next)
    },
    [roomCode],
  )

  function handleBpmChange(next: number) {
    setBpm(next)
    void updateRoomBpm(roomCode, next)
  }

  function handleToggleMute(trackId: TrackId) {
    setMuted((prev) => {
      const next = { ...prev, [trackId]: !prev[trackId] }
      engine.setTrackVolume(trackId, next[trackId] ? 0 : 1)
      return next
    })
  }

  function handleTogglePlay() {
    if (playing) {
      engine.stop()
      setCurrentStep(null)
    } else {
      engine.start()
    }
    setPlaying(!playing)
  }

  if (room === undefined) {
    return <div className="min-h-screen flex items-center justify-center text-secondary">Loading…</div>
  }
  if (room === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-secondary">No room found for code "{roomCode}".</p>
        <Link to="/" className="text-accent">Back home</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Room {roomCode}</h1>
          <PresenceIndicator count={presenceCount} />
        </div>
        <Link to="/" className="text-sm text-secondary hover:text-primary">← Home</Link>
      </div>

      <span data-testid="realtime-status" data-ready={realtimeReady} className="hidden" />

      <div className="flex flex-col gap-6">
        <TransportBar playing={playing} onTogglePlay={handleTogglePlay} bpm={bpm} onBpmChange={handleBpmChange} />
        <StepGrid pattern={pattern} currentStep={currentStep} onToggle={handleToggleStep} />
        <TrackControls muted={muted} onToggleMute={handleToggleMute} />
      </div>
    </div>
  )
}
