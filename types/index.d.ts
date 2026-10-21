export type Palette = {
  user: string
  assistant: string
  tool: string
  bar: string
  accent: string
}

declare module 'claude-code' {
  interface PluginState {
    'session-hues-cc': { palette: Palette | null; frame: number }
  }
}
