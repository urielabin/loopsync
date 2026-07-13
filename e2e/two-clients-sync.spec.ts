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

  async function toggleOnA() {
    // Only toggle if not already active -- this may run more than once
    // below (retry loop), and toggling an already-active step back off
    // would defeat the retry.
    const isActive = await pageA.getByTestId(stepTestId).getAttribute('data-active')
    if (isActive !== 'true') {
      await pageA.getByTestId(stepTestId).click()
    }
  }

  // On a freshly-started local Supabase instance (true in CI), Realtime's
  // internal publication cache can still be warming up just after a
  // client's own SUBSCRIBED handshake completes, so an update pushed
  // immediately after can be missed. Retry the write itself -- toggling
  // is idempotent here (see the guard above), and each retry is a fresh
  // UPDATE event that will be delivered once the cache catches up.
  await toggleOnA()
  for (let attempt = 0; attempt < 5; attempt++) {
    const active = await pageB.getByTestId(stepTestId).getAttribute('data-active')
    if (active === 'true') break
    await toggleOnA()
    await pageB.waitForTimeout(3000)
  }

  await expect(pageB.getByTestId(stepTestId)).toHaveAttribute('data-active', 'true', { timeout: 10_000 })

  await contextA.close()
  await contextB.close()
})
