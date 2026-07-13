import { expect, test } from '@playwright/test'

test('two clients in the same room see each other\'s step edits live, with no reload', async ({ browser }) => {
  const contextA = await browser.newContext()
  const contextB = await browser.newContext()
  const pageA = await contextA.newPage()
  const pageB = await contextB.newPage()

  await pageA.goto('/')
  await pageA.getByRole('button', { name: 'Create a room' }).click()
  await pageA.waitForURL('**/room/**')
  const roomCode = pageA.url().split('/room/')[1]!

  await pageB.goto(`/room/${roomCode}`)

  // Realtime events aren't queued for a late subscriber -- an UPDATE that
  // happens before a client's subscription reaches SUBSCRIBED is missed
  // forever, not just delayed. Wait on the real signal, not a fixed sleep.
  await expect(pageA.getByTestId('realtime-status')).toHaveAttribute('data-ready', 'true', { timeout: 15_000 })
  await expect(pageB.getByTestId('realtime-status')).toHaveAttribute('data-ready', 'true', { timeout: 15_000 })

  const stepTestId = 'step-kick-0'
  let clickCount = 0

  async function clickStepOnA() {
    // Unconditional -- a guard that skips clicking once pageA's own
    // optimistic UI already shows "active" looks idempotent, but it means
    // every retry after the first becomes a no-op (no new write is ever
    // sent), which defeats the retry entirely. Track parity instead, so
    // every retry unconditionally performs a fresh click/UPDATE.
    await pageA.getByTestId(stepTestId).click()
    clickCount++
  }

  // On a freshly-started local Supabase instance (true in CI; a
  // long-running local dev instance doesn't show this), Realtime's
  // internal publication cache can still be warming up just after a
  // client's own SUBSCRIBED handshake completes, so an update pushed
  // immediately after can be missed. Retry the write itself -- each retry
  // is a genuinely fresh UPDATE event that will be delivered once the
  // cache catches up.
  await clickStepOnA()
  for (let attempt = 0; attempt < 5; attempt++) {
    const expected = clickCount % 2 === 1 ? 'true' : 'false'
    const active = await pageB.getByTestId(stepTestId).getAttribute('data-active')
    if (active === expected) break
    await clickStepOnA()
    await pageB.waitForTimeout(3000)
  }

  const expectedFinal = clickCount % 2 === 1 ? 'true' : 'false'
  await expect(pageB.getByTestId(stepTestId)).toHaveAttribute('data-active', expectedFinal, { timeout: 10_000 })

  await contextA.close()
  await contextB.close()
})
