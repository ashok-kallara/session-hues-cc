import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Palette } from '../types'

const palette = atom({ plugin: 'session-hues-cc', key: 'palette' } as const, null)
const frame = atom({ plugin: 'session-hues-cc', key: 'frame' } as const, 0)

const HUE_RANGE = 360
const USER_HUE_SHIFT = 25
const BASE_SATURATION = 40
const USER_SATURATION = 48
const TOOL_SATURATION = 30
const BAR_SATURATION = 70
const BAR_LIGHTNESS = 60
const ACCENT_SATURATION = 65
const ACCENT_LIGHTNESS = 70
const USER_LIGHTNESS = 20
const ASSISTANT_LIGHTNESS = 13
const TOOL_LIGHTNESS = 10
const BAND_GAP = 1
const FRAME_MS = 110
const TRACK_WIDTH = 7
const COLUMNS_PER_STEP = 2
const TRAIL = '·•'
// Text-art takes on Star Wars characters (Unicode has no real ones). A new
// character takes over each time the runner completes a lap of the track.
const STAR_WARS_FACES: readonly string[] = [
  '⊂(°‿°)⊃', // Yoda
  '[▓▀▓]', // Darth Vader
  '[◉_◉]', // Stormtrooper
  '(•o•)=', // R2-D2
  'ʕ•ᴥ•ʔ', // Chewbacca
  '[ô_ô]', // C-3PO
  '(◎)●', // BB-8
  '/(▓)\\', // Lightsaber duel
]
const FACE_WIDTH = Math.max(...STAR_WARS_FACES.map(face => face.length))
const LINE_WIDTH =
  (TRACK_WIDTH - 1) * COLUMNS_PER_STEP + TRAIL.length + FACE_WIDTH

// One lap is there-and-back across the track; the face runs ahead of a trail.
const LAP_FRAMES = (TRACK_WIDTH - 1) * 2

const spinnerFrame = (tick: number): string => {
  const lap = Math.floor(tick / LAP_FRAMES)
  const step = tick % LAP_FRAMES
  const goingRight = step < TRACK_WIDTH
  const position = goingRight ? step : LAP_FRAMES - step
  const face = STAR_WARS_FACES[lap % STAR_WARS_FACES.length]
  const indent = ' '.repeat(position * COLUMNS_PER_STEP)
  const trail = goingRight ? TRAIL : [...TRAIL].reverse().join('')
  const line = goingRight
    ? `${indent}${trail}${face}`
    : `${indent}${face}${trail}`

  return line.padEnd(LINE_WIDTH)
}

const hslToHex = (hue: number, saturation: number, lightness: number) => {
  const s = saturation / 100
  const l = lightness / 100
  const a = s * Math.min(l, 1 - l)
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12
    const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(value * 255).toString(16).padStart(2, '0')
  }
  return `#${channel(0)}${channel(8)}${channel(4)}`
}

const randomPalette = (): Palette => {
  const base = Math.floor(Math.random() * HUE_RANGE)
  const userHue = (base + USER_HUE_SHIFT) % HUE_RANGE
  return {
    user: hslToHex(userHue, USER_SATURATION, USER_LIGHTNESS),
    assistant: hslToHex(base, BASE_SATURATION, ASSISTANT_LIGHTNESS),
    tool: hslToHex(base, TOOL_SATURATION, TOOL_LIGHTNESS),
    bar: hslToHex(userHue, BAR_SATURATION, BAR_LIGHTNESS),
    accent: hslToHex(userHue, ACCENT_SATURATION, ACCENT_LIGHTNESS),
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    if ((await read($, palette)) === null) {
      await update($, palette, () => randomPalette())
    }

    $.clock.every(FRAME_MS, () => update($, frame, tick => tick + 1))

    return next(e)
  })

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const colors = await read($, palette)

    if (colors === null || e.props.isSummary) {
      return next(e)
    }

    const { Box, Markdown } = $.ui.resolve(e)

    return (
      <Box
        backgroundColor={colors.assistant}
        paddingX={1}
        paddingY={1}
        marginBottom={BAND_GAP}
      >
        <Markdown text={e.props.text} />
      </Box>
    )
  })

  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    const colors = await read($, palette)

    if (colors === null || e.props.origin.kind !== 'composer') {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="row" marginBottom={BAND_GAP}>
        <Box width={1} flexShrink={0} backgroundColor={colors.bar} />
        <Box
          flexGrow={1}
          backgroundColor={colors.user}
          paddingX={1}
          paddingY={1}
        >
          <Text>{`> ${e.props.text}`}</Text>
        </Box>
      </Box>
    )
  })

  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    const colors = await read($, palette)
    const engineRow = await next(e)

    if (colors === null) {
      return engineRow
    }

    const { Box } = $.ui.resolve(e)

    return <Box backgroundColor={colors.tool}>{engineRow}</Box>
  })

  on('ui.render', { component: 'ToolResult' }, async ($, e, next) => {
    const colors = await read($, palette)
    const engineRow = await next(e)

    if (colors === null) {
      return engineRow
    }

    const { Box } = $.ui.resolve(e)

    return <Box backgroundColor={colors.tool}>{engineRow}</Box>
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const colors = await read($, palette)

    if (colors === null) {
      return next(e)
    }

    const { Text } = $.ui.resolve(e)
    const label = e.props.message ?? e.props.word
    const tick = await read($, frame)

    return (
      <Text color={colors.accent}>{`${spinnerFrame(tick)} ${label}${e.props.suffix}`}</Text>
    )
  })
}
