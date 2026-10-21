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

Recommended: install it as a user-level plugin from this folder. No shell
profile changes needed, and it loads in every session.

    claude plugin marketplace add ~/work/dev/bg-tint-mod
    claude plugin install bg-tint@bg-tint-marketplace

Start a new `claude` session. Each session gets its own random hue.

The marketplace points at this folder, so edits here are what Claude reads.
After editing, refresh with `claude plugin marketplace update bg-tint-marketplace`
and restart the session.

### Other ways

Try it for one session without installing:

    claude --plugin-dir ~/work/dev/bg-tint-mod

Install from a git host after pushing this repo:

    claude plugin marketplace add <owner>/<repo>
    claude plugin install bg-tint@bg-tint-marketplace

## Check it works

    claude plugin validate ~/work/dev/bg-tint-mod

    claude plugin list

`bg-tint@bg-tint-marketplace` should show as enabled.

## Tweak it

All colors and spacing are constants at the top of `hooks/register.tsx`
(saturation, lightness, `USER_HUE_SHIFT`, `BAND_GAP`). 

## Remove

    claude plugin uninstall bg-tint@bg-tint-marketplace
    claude plugin marketplace remove bg-tint-marketplace
