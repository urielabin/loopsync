import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateRoomCode } from '../lib/room-code.js'
import { createRoom } from '../lib/rooms.js'
import { emptyPattern } from '../lib/pattern.js'

export function RoomJoinForm() {
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setCreating(true)
    setError(null)
    try {
      const code = generateRoomCode()
      await createRoom(code, emptyPattern())
      navigate(`/room/${code}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room')
    } finally {
      setCreating(false)
    }
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (joinCode.trim()) navigate(`/room/${joinCode.trim().toUpperCase()}`)
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <button
        onClick={() => void handleCreate()}
        disabled={creating}
        className="w-full bg-accent text-white rounded-lg px-6 py-3 font-medium disabled:opacity-50"
      >
        {creating ? 'Creating…' : 'Create a room'}
      </button>

      <div className="flex items-center gap-3 w-full text-secondary text-sm">
        <div className="h-px flex-1 bg-border" />
        or
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleJoin} className="flex gap-2 w-full">
        <input
          aria-label="Room code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          placeholder="Room code"
          className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-primary uppercase focus:outline-none focus:border-accent"
        />
        <button type="submit" className="border border-border rounded-lg px-4 py-2 font-medium hover:border-secondary transition-colors">
          Join
        </button>
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
