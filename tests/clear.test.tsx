import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const endedByClear = {
  reason: 'clear',
  sessionId: 'old',
  resume: { id: 'old' },
} as never

const ASSISTANT = {
  plugin: 'session-hues-cc',
  component: 'AssistantMessage',
  surface: 'terminal',
  props: { text: 'hi', isSummary: false },
} as never

const SPINNER = {
  plugin: 'session-hues-cc',
  component: 'Spinner',
  surface: 'terminal',
  props: { word: 'Working', suffix: '' },
} as never

// What the engine draws when the mod steps aside: no Markdown in it.
const engineDrawing = (on: On) =>
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })

const passEngineEvents = (on: On) => {
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.end', (_, e) => ({ sessionId: e.sessionId }))
  on('prompt.submit', (_, e) => ({ text: e.text }))
  engineDrawing(on)
}

test('before any event the mod draws nothing of its own', async ($, on) => {
  passEngineEvents(on)

  const ui = await $.ui.mount(ASSISTANT)

  expect(await ui.find({ type: 'Markdown' })).toBe(undefined)
  await ui.unmount()
})

test('session.start seeds the palette', async ($, on) => {
  mock.clock(on)
  passEngineEvents(on)

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount(ASSISTANT)

  expect(await ui.find({ type: 'Markdown' })).not.toBe(undefined)
  await ui.unmount()
})

test('after /clear, with no session.start, the next prompt seeds the palette', async ($, on) => {
  mock.clock(on)
  passEngineEvents(on)

  await $.session.end(endedByClear)
  await $.prompt.submit({ text: 'hello' } as never)

  const ui = await $.ui.mount(ASSISTANT)

  expect(await ui.find({ type: 'Markdown' })).not.toBe(undefined)
  await ui.unmount()
})

test('the spinner animates after /clear', async ($, on) => {
  const clock = mock.clock(on)
  passEngineEvents(on)

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.session.end(endedByClear)
  await $.prompt.submit({ text: 'hello' } as never)

  const first = await $.ui.mount(SPINNER)
  const before = (await first.find({ type: 'Text' }))?.text
  await first.unmount()

  await clock.advance(1000)

  const second = await $.ui.mount(SPINNER)
  const after = (await second.find({ type: 'Text' }))?.text
  await second.unmount()

  expect(before).toBeDefined()
  expect(after).not.toBe(before)
})
