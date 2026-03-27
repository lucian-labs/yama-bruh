# YAMA-BRUH Ringtone System Spec

Integration guide for developers who want to add deterministic FM-synthesized notification sounds to their apps. No audio files, no server, no dependencies — just seeds in, sound out.

## How It Works

YAMA-BRUH generates short (3-8 note) ringtones from string identifiers using seeded PRNG and 2-operator FM synthesis modeled on the Yamaha YM2413 (OPLL) chip. The same seed always produces the same ringtone, across all platforms and sessions.

The system runs in three environments:

| Platform | Integration | File |
|----------|-------------|------|
| **Web** | `<script>` tag, zero deps, pure JS | `yamabruh-notify.js` |
| **iOS / macOS / watchOS** | Swift Package Manager | `Sources/YamaBruh/` |
| **Rust / WASM** | `wasm32-unknown-unknown` target | `src/lib.rs` |

All three produce byte-identical output from the same seeds.

---

## Web Integration

### Minimal Setup

```html
<script src="https://cdn.lucianlabs.ca/scripts/yamabruh-notify.js"></script>
<script>
  const notify = new YamaBruhNotify({ seed: 'my-app.example.com', mode: 0 });

  // User gets a message — play their unique sound
  notify.play('user-abc123');
</script>
```

That's it. One script tag, one constructor, one method call.

### Constructor Options

```js
new YamaBruhNotify({
  seed: 'my-app.example.com',   // instance seed (string) — your app's identity
  patchSeed: 'brass-family',    // patch seed (string) — controls which FM voice is used
  preset: 88,                    // explicit preset index (0-99) — overrides patchSeed
  mode: 0,                       // mood index (0-9) — controls scale/movement/resolution
  bpm: 140,                      // tempo (beats per minute)
  volume: 0.8,                   // master volume (0-1)
  sampleRate: 44100,             // sample rate in Hz
  minLength: 3,                  // minimum notes per ringtone (default 2)
  maxLength: 5,                  // maximum notes (null = mode default)
  speed: 1,                      // BPM multiplier (0.25-4), 2 = double speed
  octave: 0,                     // octave offset (-5..5)
  note: 0,                       // semitone offset (-12..12)
})
```

All fields are optional. Omitting everything gives you random ringtones with the `experimental` mood.

### Methods

| Method | Description |
|--------|-------------|
| `play(id?, opts?)` | Play a ringtone. `id` is any string — same string = same sound. Omit for a random one-shot. |
| `stop()` | Stop the current ringtone immediately. |
| `configure(opts)` | Update defaults (preset, bpm, volume, mode, patchSeed, sampleRate, minLength, maxLength). |

### Per-Call Overrides

Any constructor option can be overridden per-call:

```js
notify.play('order-456', {
  preset: 60,
  bpm: 160,
  volume: 0.5,
  mode: 3,  // spooky
  onDone: () => console.log('ringtone finished'),
});
```

### Static Properties

| Property | Returns |
|----------|---------|
| `YamaBruhNotify.PRESET_NAMES` | Array of 100 preset name strings |
| `YamaBruhNotify.MOOD_NAMES` | Array of 10 mood name strings |
| `YamaBruhNotify.SCALES` | Object of all 39 scale definitions |
| `YamaBruhNotify.MOODS` | Object of all 10 mood configurations |

---

## Seed Architecture

Three seeds compose the output. Understanding this is the key to using the system well.

```
INSTANCE SEED (your app)
    |
    +-- combined with PATCH SEED --> which FM voice (preset 0-99)
    |
    +-- combined with MELODY SEED --> which notes play
```

### Instance Seed (`seed`)

Your app's identity. Set it once. Every ringtone from your app will share a consistent timbre because the patch seed derives from it. Different apps with different instance seeds will sound distinct even when playing the same melody ID.

**Recommendation:** Use your domain name. `my-app.example.com`

### Patch Seed (`patchSeed`)

Determines which of the 99 FM presets is used. Combined with the instance seed via DJB2 hash, then modulo 99.

Use cases:
- Omit it: preset is derived from instance seed alone (all your notifications sound like the same instrument)
- Set it to a category like `'alerts'` or `'messages'`: different notification types get different timbres
- Set `preset` directly instead: bypass the seed system entirely and pick a voice by index

### Melody Seed (the `id` argument to `play()`)

The per-notification identifier. This is typically a user ID, message ID, order number, or any string that should map to a consistent sound.

```js
notify.play('user-abc123');   // Always the same melody for this user
notify.play('user-xyz789');   // Different melody, same instrument
notify.play();                // Random — no determinism
```

### Seed Resolution Priority

```
preset explicitly set?  --> use that preset index
  no: patchSeed set?    --> hash(instanceSeed + patchSeed) % 99
    no: instanceSeed?   --> hash(instanceSeed + ':patch:') % 99
      no:               --> random preset per play
```

---

## Moods

Moods control the musical character of generated melodies: which scales are drawn from, how notes move relative to each other, note durations, pitch range, and whether the melody resolves to a consonant ending.

| Mode | Name | Character | Resolves |
|------|------|-----------|----------|
| 0 | pretty | Major/pentatonic, stepwise, bright | yes |
| 1 | experimental | All 39 scales, wild, full range | no |
| 2 | depressing | Minor/Phrygian, descending, slow, low | no |
| 3 | spooky | Diminished/whole-tone, tritones, large jumps | no |
| 4 | dreamy | Lydian/pentatonic, floaty, long sustains | yes |
| 5 | aggressive | Phrygian/blues, fast, low, wide intervals | no |
| 6 | exotic | Double harmonic/Persian/Arabian/gypsy | no |
| 7 | jazzy | Dorian/bebop, chromatic passing tones | yes |
| 8 | ethereal | Whole-tone/augmented, wide intervals | yes |
| 9 | mechanical | Diminished/whole-tone, repetitive, fast | no |

"Resolves" means the last note snaps to the root, third, or octave of the scale — gives a sense of completion. Non-resolving modes end wherever the sequence lands.

**Default mode is 1 (experimental)** — the original behavior, uses all scales and modes. For notification sounds that need to feel pleasant and predictable, use 0 (pretty) or 4 (dreamy).

---

## Presets

99 FM voices indexed 0-98, plus preset 99 (Wave). Each preset defines a complete 2-operator FM patch: carrier and modulator frequency ratios, modulation index, ADSR envelopes for both operators, waveform selection, tremolo, vibrato, feedback, and envelope type.

| Range | Category |
|-------|----------|
| 0-9 | Piano / Electric Piano |
| 10-19 | Organ |
| 20-29 | Brass |
| 30-39 | Strings / Pad |
| 40-49 | Bass |
| 50-59 | Lead / Plucked |
| 60-69 | Bell / Mallet |
| 70-79 | Reed / Pipe |
| 80-89 | SFX |
| 90-99 | Retro / Digital |

Access names via `YamaBruhNotify.PRESET_NAMES[index]`.

---

## Swift Package (iOS / macOS / watchOS)

### Install

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/ELI7VH/yama-bruh", branch: "main"),
]
```

Supports iOS 16+, macOS 13+, watchOS 9+. No dependencies.

### Generate a Ringtone

```swift
import YamaBruh

// From string identifiers — most common usage
let wav = Ringtone.generate(
    from: "task-abc-123",
    appIdentifier: "ca.lucianlabs.myapp",
    mood: .pretty
)
try wav.write(to: fileURL)

// With a patch identifier for timbre control
let wav = Ringtone.generate(
    from: "alert-id",
    appIdentifier: "com.example",
    patchIdentifier: "brass",
    mood: .pretty
)

// Explicit preset override
let wav = Ringtone.generate(seed: 42, presetIndex: 88)

// From numeric seeds for direct control
let wav = Ringtone.generate(seed: 42, appSeed: 99, patchSeed: 7, mood: .spooky)
```

### Use as iOS Notification Sound

Write the WAV to `Library/Sounds/` and reference it:

```swift
import UserNotifications

let soundName = "notification-\(userId).wav"
let soundURL = FileManager.default.urls(for: .libraryDirectory, in: .userDomainMask)[0]
    .appendingPathComponent("Sounds/\(soundName)")

let wav = Ringtone.generate(from: userId, appIdentifier: "com.example.app", mood: .pretty)
try wav.write(to: soundURL)

// In your notification content:
content.sound = UNNotificationSound(named: UNNotificationSoundName(soundName))
```

### Custom OPLL Presets

Build per-operator FM patches programmatically:

```swift
let patch = OPLLPreset(
    modulator: OPLLOperator(mult: 2, attack: 0.001, decay: 0.5, sustainLevel: 0.3,
                            release: 1.0, waveform: 1, vibrato: true, tremolo: true, sustained: true),
    carrier: OPLLOperator(mult: 1, attack: 0.6, decay: 6.0, sustainLevel: 0.01,
                          release: 6.0, sustained: true),
    modDepth: 3.15,
    feedback: 0.0
)
let wav = Ringtone.generate(seed: 42, preset: patch)
```

Or convert raw YM2413 register dumps (8 bytes):

```swift
let ghost = OPLLPreset.fromRegisters([0xE2, 0x21, 0x17, 0x00, 0xF0, 0x54, 0x00, 0xF4])
```

### Swift API Reference

| Method | Description |
|--------|-------------|
| `Ringtone.generate(from:appIdentifier:patchIdentifier:presetIndex:mood:bpm:sampleRate:)` | Generate WAV Data from string identifiers |
| `Ringtone.generate(seed:appSeed:patchSeed:presetIndex:mood:bpm:sampleRate:)` | Generate from numeric seeds |
| `Ringtone.generate(seed:appSeed:preset:mood:bpm:sampleRate:)` | Generate with a custom OPLLPreset |
| `SequenceGenerator.generate(seed:mood:)` | Get the note sequence without rendering audio |
| `SequenceGenerator.djb2Hash(_:)` | Hash a string to UInt32 (same algorithm as JS/Rust) |
| `WavWriter.encode(samples:sampleRate:channels:)` | Encode Float buffer as 16-bit PCM WAV |
| `OPLLPreset.fromRegisters(_:)` | Convert 8 raw YM2413 register bytes to an OPLLPreset |

### Mood Enum

```swift
SequenceGenerator.Mood: .pretty, .experimental, .depressing, .spooky, .dreamy,
                        .aggressive, .exotic, .jazzy, .ethereal, .mechanical
```

---

## Common Integration Patterns

### Per-User Notification Sounds

Every user gets a unique, consistent sound. The app always uses the same instrument.

```js
const notify = new YamaBruhNotify({
  seed: 'my-app.example.com',
  mode: 0,  // pretty
});

// Each user ID produces a different melody, same timbre
onMessage(msg => notify.play(msg.senderId));
```

### Per-Channel / Per-Type Sounds

Different notification categories use different timbres:

```js
const alerts   = new YamaBruhNotify({ seed: 'my-app', patchSeed: 'alerts',  mode: 5 }); // aggressive
const messages = new YamaBruhNotify({ seed: 'my-app', patchSeed: 'messages', mode: 0 }); // pretty
const system   = new YamaBruhNotify({ seed: 'my-app', patchSeed: 'system',  mode: 9 }); // mechanical

onNotification(n => {
  if (n.type === 'alert') alerts.play(n.id);
  else if (n.type === 'message') messages.play(n.senderId);
  else system.play(n.id);
});
```

### Random One-Shot Sounds

No determinism needed — just a pleasant ding:

```js
const notify = new YamaBruhNotify({ mode: 4, preset: 75 }); // dreamy, Music Box
notify.play(); // Random each time
```

### Completion Callback

```js
notify.play('task-done', {
  onDone: () => {
    // Ringtone finished playing — safe to play another or update UI
  }
});
```

---

## Determinism Guarantees

The system is fully deterministic across all three platforms (JS, Swift, Rust):

- **Same hash function:** DJB2 with identical overflow behavior
- **Same PRNG:** XORshift with matching bit operations
- **Same scale/mood logic:** Identical scale arrays, movement tables, duration pools
- **Same FM synthesis:** Matching ADSR equations, waveform functions, modulation math

Given the same `seed + id + preset + mode + bpm + sampleRate`, the output is identical down to the sample level. This means a ringtone generated in a browser will sound identical to one generated natively on iOS from the same inputs.

---

## Constraints

- **Max duration:** ~5 seconds (iOS notification sound limit). Sequences self-limit based on note count (3-8) and BPM.
- **Mono output:** Single channel. Sufficient for notification sounds.
- **Web Audio context:** Requires user gesture to start on most browsers. Call `play()` from a click/tap handler the first time.
- **No streaming:** The entire ringtone is rendered to a buffer before playback. This is fast (sub-millisecond for typical sequences) but means you can't modify a ringtone mid-play.

---

## Demos

- **Synth + Keyboard:** [yama-bruh.lucianlabs.ca](https://yama-bruh.lucianlabs.ca/) — play presets with keyboard/MIDI, full preset editor
- **Ringtone Generator:** [yama-bruh.lucianlabs.ca/ringtones.html](https://yama-bruh.lucianlabs.ca/ringtones.html) — try moods, presets, custom IDs, copy embed code
