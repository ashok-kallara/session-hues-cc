# bg-tint

A Claude Code mod that gives every new session a random color theme.

## What it does

- Picks a random hue at the start of each new session (kept across reloads).
- Your prompts: tinted band with a bright accent bar on the left.
- Claude's replies: tinted band in the base hue, with a gap between bands.
- Tool calls and results: a faint, darker tint.
- Spinner: drawn in a light tint of the prompt hue.

It tints the transcript rows only. It cannot change the terminal's own
background (the empty area around the rows); use your terminal's profile for that.
The lightness values assume a dark terminal theme.

## Install

### Option A: load from this folder (simplest, local)

For one session:

    claude --plugin-dir ~/work/dev/bg-tint-mod

For every session, add the folder to your shell profile.

fish (`~/.config/fish/config.fish`):

    set -gx CLAUDE_CODE_PLUGIN_DIRS ~/work/dev/bg-tint-mod

bash/zsh (`~/.zshrc`):

    export CLAUDE_CODE_PLUGIN_DIRS=~/work/dev/bg-tint-mod

Then start a new `claude` session.

### Option B: install as a plugin from a marketplace

Push this folder to a git repo (it already contains `.claude-plugin/marketplace.json`), then:

    /plugin install bg-tint --marketplace <owner>/<repo>

## Check it works

    claude plugin validate ~/work/dev/bg-tint-mod

In a session, mods may ask once: "Turn on the mods Claude writes in this session?"
That prompt applies to mods Claude writes in-session, not to mods loaded from
`--plugin-dir`.

## Tweak it

All colors and spacing are constants at the top of `hooks/register.tsx`
(saturation, lightness, `USER_HUE_SHIFT`, `BAND_GAP`). Edits hot-reload in a
session that has the folder loaded.

## Remove

Unset `CLAUDE_CODE_PLUGIN_DIRS` (or delete the line from your profile) and delete this folder.
