import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Palette } from '../types'

const palette = atom({ plugin: 'bg-tint', key: 'palette' } as const, null)

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

    return (
      <Text color={colors.accent}>{`✻ ${label}${e.props.suffix}`}</Text>
    )
  })
}
