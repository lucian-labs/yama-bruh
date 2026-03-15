# Building YAMA-BRUH: A 6-Hour Sprint from Prompt to Product

**Date:** March 15, 2026
**Duration:** ~6 hours (3:43 PM - 9:33 PM)
**Context resets:** 6 (ran out of context 6 times)
**Parallel sessions:** 2 (engine + UI design)
**Stack:** Rust/WASM, Web Audio API, WebGL/GLSL, Web MIDI API, Pure JS

---

## The One-Shot Prompt (3:43 PM)

It started with a single prompt and a rule: no clarifications.

> "we are going to do a one-shot app, do not ask for any clarifications:
> make me a web assembly plugin. the purpose is to generate a 3-5 tone ringtone from a random seed. this will be used to generate ringtones based on unique ids.
> loose spec:
> should follow a pentatonic with accidentals. key: F#m
> randomize the duration of the notes between 1/8,1/4,1/2,1,2 beats.
> should follow a relative +- 0,2,3,4,6 semitone pattern
> it should be a simple 2 op fm synth with 99 presets - think 90s yamaha keyboards, as well, the user can send a config schema of floats to customize it - this is the sound used to generate the following: a web ui that shows 5 randomized on load unique ids with a button which fires the ringtone, as well as 5 text fields (localstorage) that the user can test. the ui should have a keypad like on those vintage keyboard and an LCD showing the current preset, allow the user to connect a midi device to play the selected sound.
> make the ui look weathered as though its made of the cheap plastic that's been moved around for 30 years. use glsl on the entire page to add texture and responsiveness.
> pressing the keys should use the plugin to generate sfx feedback for the user.
> call it yama-bruh, publish it to my public github, add a description that shows this prompt. add the page to lucianlabs.ca/labs"

17 minutes later, the first build was live.

---

## "Fucking Perfect" (4:00 PM)

> "fucking perfect. missed one feature which is the user plugging in a midi device and using that"

First reaction to the one-shot build. MIDI support was added immediately via Web MIDI API.

---

## The MIDI Debugging Gauntlet (4:04 - 4:17 PM)

What followed was a rapid-fire debugging session across 4 MIDI devices:

> "it's plugged in but no signal is coming thru. can we add a midi device select? maybe It's listening to the wrong one"

> "still no signals from the midi devices: [MIDI] Input: 'Arturia BeatStep Pro'... [MIDI] Input: 'MIDIIN2 (Arturia BeatStep Pro)'... [MIDI] Input: 'LCXL3 1 MIDI'... [MIDI] Input: 'Arturia KeyStep 32'..."

Eventually got it working, but latency was unacceptable:

> "ok works. there is quite a bit of midi latency. moreso than when i click the mouse. make it better. remove the logging if that's an issue. if there is an issue going from webaudio to the audio bridge, rewrite the entire thing in webassemly, possible to even get wabasm to use midi? or does it need the browser bridge? tighten it up!"

---

## Scope Creep, Embraced (5:02 PM)

After adding vibrato, portamento, sustain toggle, and starting to plan a drum engine:

> "do all 4 pls. additionally, I will want to add the drums, but maybe that's a different module? we have synth engine and drum engine. then we need the ability to do the accompany, so plan for that. lol this is getting dumb but i love it"

The scope went from "ringtone generator" to "full Yamaha PortaSound clone" in under 2 hours.

---

## The PSS-470 Reference Photos (4:59 - 6:18 PM)

A parallel UI session was running simultaneously, driven by photos of a real Yamaha PSS-470/PSS-170:

> "ok. I want the ui to look more lifelike. the number buttons should follow the 5 over 5 look. add some dimensionality, and also a light source, use the time of day to change the light. also somehow capture the dust and age better between the cracks and whatnot. But keep in mind that it should be configurable... all of it"

> "now note that the buttons are square with a chamfer edge. and the plastic has a rough quality to it. the voice panel has a reflective quality, and the color of the numbers vs voices. also note the top vents are vertical oriented, and the horizontal grooves are below all the selections. use whatever you can to make this look exactly as it is."

The willingness to throw technology at visual fidelity escalated:

> "if we need to use 3d for this, like three js, spare no expense"
> "or raw webgl"

It was solved with CSS alone.

---

## 16-Channel MIDI Routing (5:36 PM)

> "16 channel midi. I want to be able to assign voices to channels. change sound editor to 'editor' add a title for sound, and a new section for midi mappings. 4x4 with a [set] button that sets the current patch to the buttons. and the bottom row (13-16) should be drum patches so like yellow or something"

Full 16-channel MIDI routing with per-channel preset assignment. Channels 13-16 reserved for drums.

---

## The Audio Crash Saga (6:25 - 7:30 PM)

This was the longest debugging arc of the session. The audio would die after a few seconds.

> "running locally here: the audio just dropped out"

> "i don't think it's a sleep issue. it's not user error, when clicking the page, the keys, the buttons no sound takes place after the crash. needs some kind of logging if possible"

> "stopped again, investigate. no crash."

After multiple failed fixes in the browser:

> "nah bro still crashing after like one minute."

### The Pivot to Native (6:46 PM)

> "no, build it in rust, make it an executable, to make sure our core shit is not broken"

Built a standalone native Rust binary (`yambruh-test`) to isolate the problem. Same crash.

> "audio stopped 5 seconds in"

> "same thing. just a couple seconds then sound cut off. maybe do some logging from midi in, to triggering the sound, to the speaker for each note"

### The User Finds It (7:23 PM)

> "could this have something to do with it: CPAL audio cutting out after a few seconds is usually caused by the audio stream object being dropped (garbage collected/out of scope)"

**Root cause:** crossterm's `enable_raw_mode()` on the main thread was killing cpal's WASAPI audio stream on Windows. COM apartment threading conflict. Moving crossterm to a separate thread fixed it instantly.

> "works."

---

## Incremental DSP Rebuild (8:14 - 8:32 PM)

With the audio crash fixed, systematic DSP rebuild to make sure nothing else was broken:

> "ok wait. it might be the compression shit freaking out. remove all dsp"

Stripped everything. Added back one layer at a time:

**Bare FM voices:**
> "yep works"

**Added drums back:**
> "works buddy"

**Added limiter:**
> "throw a limiter on it just so it doesn't peak out"

Found ghost processes in task manager:
> "somethings still on in the bg"
> "two instances running in task manager"

> "we running debug?"

> "k i think we're good. ship it to the site."

---

## The Standalone Notification Engine (8:33 - 8:42 PM)

The ringtones page needed to work independently of the full WASM synth stack:

> "basically this needs to be a package that can be dropped into any site, and used for notifications"

> "oh just the engine"

Built `yamabruh-notify.js` -- a pure JS FM synth ringtone player. No WASM, no dependencies, all 99 presets embedded. Drop in via a single `<script>` tag.

> "like in one of my apps, I'm going to set the seed to 'lucianlabs.ca', and any time it loads it will always use the same ringtone for a given id"

The seed system: same seed + same ID = same ringtone, deterministically, across all devices.

> "strip localstorage yeah"

The seed is pure config, not persistence.

---

## Final Polish (8:44 - 8:55 PM)

> "fuck yeah. for the demo make the first id auto filled in with 'yama-bruh-id', so it demos that it persists the ringtone"

> "i can't see the embed code, text color green, put a border around the box"

CSS caching from `npx serve` was so aggressive that new stylesheet rules wouldn't load. Fixed with inline styles.

> "move the persistent id to 'custom ids' reduce the number to 3 each"

> "clicking on an empty id row should do the random play"

> "no. like it should change the code to `play()` to demonstrate the random"

When you play an empty row, the embed snippet shows `notify.play()` with no args -- demonstrating the auto-random feature.

> "perfect. ship it!"

---

## Ship & Document (8:55 - 9:33 PM)

> "update the readme"

> "ok, now go back thru this entire conversation collect all the quotes and notable moments that made this happen... create a /blog folder."

---

## Session Stats

| Metric | Value |
|--------|-------|
| Total duration | ~6 hours |
| Context resets | 6 |
| Parallel sessions | 2 (engine + UI) |
| One-shot to first build | 17 minutes |
| Audio crash debug time | ~65 minutes |
| Root cause | crossterm killing WASAPI (COM threads) |
| Final deliverables | WASM synth, native binary, standalone JS engine |
| Presets | 99 (Yamaha PSS-inspired) |
| MIDI channels | 16 |
| Dependencies | 0 (standalone engine) |

## What Was Built

1. **WASM FM Synth** -- Full 2-op FM synthesis engine in Rust, compiled to WebAssembly
2. **Web Synth UI** -- GLSL-shaded weathered plastic aesthetic, QWERTY keyboard, voice selector
3. **Drum Engine** -- FM percussion synthesis with 10 rhythm patterns and sequencer
4. **16-Channel MIDI** -- Per-channel preset routing with drum channels
5. **Native Binary** -- Standalone Rust/cpal audio engine (built to debug, kept as tool)
6. **Standalone Notification Engine** -- `yamabruh-notify.js`, pure JS, zero dependencies, drop-in script tag
7. **Ringtones Demo Page** -- Voice selector, seed config, embed code generator
8. **CI/CD** -- GitHub webhook auto-deploy to lucianlabs.ca

## Key Quotes

- **"fucking perfect"** -- first reaction
- **"lol this is getting dumb but i love it"** -- scope creep acknowledged
- **"if we need to use 3d for this, like three js, spare no expense"** -- visual fidelity pursuit
- **"nah bro still crashing after like one minute"** -- the audio saga
- **"no, build it in rust, make it an executable"** -- the pivot that found the bug
- **"works buddy"** -- drums confirmed stable
- **"fuck yeah"** -- notification engine ships
- **"perfect. ship it!"** -- final sign-off
