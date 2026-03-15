# YAMA-BRUH UI Handoff

## Reference
Target aesthetic: **Yamaha PortaSound PSS-470** (photos provided by user). Dark charcoal plastic body, cyan/teal text, green rectangular buttons, 7-segment LED display, air vents/speaker grille, ridged case edges.

## Current File Structure
```
www/
  index.html       ← page structure
  style.css        ← all styling
  app.js           ← UI logic, GLSL shader, keyboard, voice bank, editor, visual config, effects, drums
  synth.js         ← audio engine (DO NOT MODIFY — WASM agent owns this)
  synth-worklet.js ← AudioWorklet processor (DO NOT MODIFY — WASM agent owns this)
  drum-worklet.js  ← Drum AudioWorklet (DO NOT MODIFY — WASM agent owns this)
  drums.js         ← Drum sequencer (DO NOT MODIFY — WASM agent owns this)
  midi.js          ← MIDI handler (DO NOT MODIFY — WASM agent owns this)
  yama_bruh.wasm   ← compiled Rust binary (DO NOT MODIFY)
```

## What the UI Agent Should Touch
- `index.html` — structure, layout, elements
- `style.css` — all styling
- `app.js` — ONLY the following sections:
  - GLSL shader source (`fsSource` string)
  - DOM building (voice bank, keyboard, ID sections)
  - CSS class toggling, UI event handlers
  - Visual Config UI section
  - **DO NOT** modify: synth init, preset logic, MIDI logic, worklet communication, effect switch logic, drum engine init, MIDI channel grid logic

## Key UI Sections (top to bottom)
1. **Air vents** — speaker grille slats at top (`.air-vents`, `.vent-slat`)
2. **Header** — "YAMA-BRUH PortaSound" + "YB-99FM" (`.plate-header`)
3. **Voice Bank** — 99 preset names in cyan text, scrollable grid (`.voice-bank-panel`)
4. **Controls Row** — 7-segment display + voice selector buttons (`.controls-row`)
   - Display: red LED digits + preset name + status line (`.display-unit`)
   - Voice selector: 2 columns of 5 buttons, number labels above each (`.voice-selector`)
5. **Effect Switches** — SUSTAIN / VIBRATO / PORTAMENTO toggle buttons (`.effects-row`)
6. **Rhythm Section** — pattern selector, START/STOP, FILL, tempo +/-, step dots (`.rhythm-section`)
7. **ID Section** — 5 random + 5 custom ringtone IDs with play buttons (`.id-section`)
8. **Keyboard Section** — MIDI button/dropdown + piano keys (`.keyboard-section`)
9. **Editor** — collapsible panel with two subsections (`.tweak-section`):
   - **SOUND** — 8 FM parameter sliders (carrier, mod ratio, mod index, ADSR, feedback)
   - **MIDI CHANNELS** — 4×4 grid of channel slots with SET buttons
10. **Visual Config** — collapsible, dust/wear/patina/light/grain/scratches/TOD sliders (`.tweak-section`)

## Rhythm Section (NEW)

Pattern sequencer with 10 PSS-170 rhythm presets. All logic is wired — UI agent just needs to refine styling.

### What exists
- **HTML**: `.rhythm-section` with `.rhythm-controls` (pattern `< >` buttons, START/STOP, FILL, tempo +/-, BPM display) and `.rhythm-steps` (16 step indicator dots)
- **CSS**: Basic dark button styling matching other sections. Step dots light up cyan (`.active`) or red (`.beat` on downbeats)
- **JS**: Pattern cycling, start/stop toggle, fill trigger, tempo adjustment, step indicator callback, localStorage persistence (`yamabruh_drums`)

### What the UI agent should refine
1. **Match PSS-470 rhythm section** — the real keyboard has a labeled rhythm panel with printed pattern names. Consider making the rhythm display look more like a small LCD/LED readout
2. **Transport buttons** — START should feel like a physical toggle (green/lit when active). FILL could pulse briefly when clicked
3. **Step dots** — could be made more prominent, maybe rectangular like LED segments instead of circles
4. **Mobile** — already wraps via flex-wrap, but verify it looks good at 480px

### Don't break these IDs
- `id="rhythm-prev"`, `id="rhythm-next"` — pattern cycling
- `id="rhythm-display"` — shows current pattern name
- `id="rhythm-start"` — start/stop toggle
- `id="rhythm-fill"` — fill trigger
- `id="tempo-down"`, `id="tempo-up"` — BPM adjustment
- `id="tempo-display"` — shows current BPM
- `id="rhythm-steps"` — step dot container
- CSS class `.active` on `.transport-btn` — JS toggles this for start/stop state
- CSS classes `.active` / `.beat` on `.step-dot` — JS toggles these per step

## MIDI Channel Grid (NEW)

16-channel MIDI mapping inside the Editor panel. Each MIDI channel can be assigned a different voice preset.

### What exists
- **HTML**: `#ch-grid` inside `#tweak-body`, populated by JS with 16 `.ch-slot` elements
- **CSS**: 4×4 grid layout. Channels 13-16 have `.drum-ch` class with yellow accent colors. Each slot shows channel number, preset name, and SET button
- **JS**: SET button assigns current preset to that channel. Drum channels (13-16) have no SET button. State persists in localStorage (`yamabruh_chmap`)

### What the UI agent should refine
1. **Channel slots** — could look like small labeled patch bays or routing buttons
2. **Drum channels (13-16)** — yellow accent distinguishes them. Consider adding a drum icon or "DR" label. These don't have SET buttons since they always route to the drum engine
3. **SET buttons** — could flash or pulse when clicked for feedback
4. **Compact layout** — the 4×4 grid should feel dense but readable, like a mixer channel strip

### Don't break
- `#ch-grid` — JS populates this
- `.ch-slot` — channel container
- `.ch-slot.drum-ch` — drum channel styling
- `.ch-set-btn[data-ch]` — SET button per channel
- `.ch-name` — preset name display per channel

## Effect Switches

Three toggle buttons matching PSS-470 physical switches. Logic is wired — refine styling.

### What exists
- **HTML**: `.effects-row` with three `.fx-btn` buttons (SUSTAIN, VIBRATO, PORTAMENTO)
- **CSS**: Dark buttons with green glow when `.active`
- **JS**: Click toggles `.active`, calls synth methods, persists to localStorage (`yamabruh_fx`)

### What to refine
1. Match PSS-470 switch row — flat rectangular toggle switches
2. Recessed/inset when inactive, raised/lit when active
3. Consider adding `.panel-label` "EFFECTS" above the row

### Don't break
- `id="fx-sustain"`, `id="fx-vibrato"`, `id="fx-portamento"`
- CSS class `.active` on `.fx-btn`

## GLSL Background
The fragment shader in `app.js` (`fsSource`) renders a full-page plastic texture. Uniforms:
- `u_time` — animation time
- `u_resolution` — viewport size
- `u_mouse` — mouse position (specular highlight)
- `u_flash` — key press flash (decays in render loop)
- `u_tod` — time of day (0-24, from visual config)
- `u_dust`, `u_wear`, `u_patina`, `u_light`, `u_grain`, `u_scratches` — visual config params

## User Requests Still Pending (UI)
- Buttons should look more like PSS-470 (wider, flatter green rectangles)
- Air vents should look more like the actual speaker grille
- General polish to match the reference photos more closely
- The ridged edges on the sides of the case
- Effect switches styling refinement
- Rhythm section styling refinement
- MIDI channel grid styling refinement

## Colors (current)
- Body: `#1a1a1a` (dark charcoal)
- Cyan text: `#22ccaa`
- Active/highlight: `#77ffdd`
- Green buttons: `#3cc88a` → `#1a7850`
- 7-seg display: `#ff4444` with glow
- Number labels: `#22ccaa`
- Panel borders: `#2a2a2a`
- Text fields: `rgba(255,255,255,0.88)` on dark
- FX button active: `#1a5038` → `#0d3020` bg, `#77ffdd` text, `#22ccaa` border
- Drum channel accent: `#cc9922` / `#ddaa33` (yellow)
- Tempo display: `#ff4444` (red LED style)

## Interaction Notes
- Arrow Up/Down changes preset
- Number keys (0-9) enter preset directly (2-digit, auto-complete after 1.5s)
- Click voice bank entry to select
- QWERTY keys play piano (A=F#3, S=G#3, etc.)
- Editor toggle opens/closes sound sliders + MIDI channel grid
- Visual Config toggle opens/closes visual slider panel
- Effect buttons toggle on/off (SUSTAIN, VIBRATO, PORTAMENTO)
- Rhythm START/STOP toggles pattern playback, step dots animate
- FILL triggers one-bar percussion break
- Tempo +/- adjusts BPM in steps of 4
- SET button in MIDI grid assigns current preset to that channel
- Preset + MIDI + FX + visual + rhythm + channel map settings persist in localStorage

## Don't Break
- `id="voice-bank-grid"` — app.js populates this
- `id="seg-digits"`, `id="preset-readout"`, `id="lcd-info"` — display updates
- `id="keyboard"` — app.js builds piano keys here
- `id="random-ids"`, `id="custom-ids"` — app.js builds ID rows here
- `id="midi-btn"`, `id="midi-select"` — MIDI logic binds to these
- `id="tweak-toggle"`, `id="tweak-body"`, `id="tweak-reset"` — editor section logic
- `id="tw-carrier"` through `id="tw-feedback"` — slider IDs used by JS
- `id="fx-sustain"`, `id="fx-vibrato"`, `id="fx-portamento"` — effect toggle buttons
- `id="rhythm-prev"`, `id="rhythm-next"`, `id="rhythm-display"` — rhythm selector
- `id="rhythm-start"`, `id="rhythm-fill"` — transport controls
- `id="tempo-down"`, `id="tempo-up"`, `id="tempo-display"` — tempo controls
- `id="rhythm-steps"` — step indicator container
- `id="ch-grid"` — MIDI channel grid container
- `id="visual-toggle"`, `id="visual-body"`, `id="visual-reset"` — visual config section
- `id="tod-mode-btn"`, `id="vis-tod"` — TOD controls
- `id="vis-dust"` through `id="vis-scratches"` — visual slider IDs
- `.sel-btn[data-num]` — voice selector buttons
- `.vb-entry[data-preset]` — voice bank entries
- `#bg-canvas` — GLSL renders here
