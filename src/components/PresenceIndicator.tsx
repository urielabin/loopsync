export function PresenceIndicator({ count }: { count: number }) {
  return (
    <span data-testid="presence-count" className="text-sm text-secondary">
      {count} {count === 1 ? 'person' : 'people'} in this room
    </span>
  )
}
