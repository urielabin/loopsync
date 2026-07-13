import { RoomJoinForm } from '../components/RoomJoinForm.js'

export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-5xl font-bold tracking-tight mb-6">LoopSync</h1>
      <p className="text-secondary text-lg max-w-xl mb-10">
        A mini collaborative step-sequencer. Synthesized drum sounds, no accounts -- just create a room and share the code.
      </p>
      <RoomJoinForm />
    </div>
  )
}
