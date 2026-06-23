// ─────────────────────────────────────────────────────────────────────────
// Sequence note-count test suite (headless)
//
// Loads the REAL synth.js + synth-worklet.js, mocks the browser surface
// (fake AudioWorklet, fake timers, virtual clock), drives KEY SEQUENCE
// variations through synth.playNote(), and counts the actual `noteOn`
// messages the synth would post to the audio worklet.
//
// Primary regression target: a trailing `//` comment in a sequence source
// used to make the source compile to null (the `);` wrapper landed inside
// the comment) and the sequence silently fell back to a single note. These
// tests assert that an annotated sequence plays the SAME notes as the bare
// one — and that paren-heavy math still compiles and runs.
//
// Run:  node www/tests/sequence-notes.test.js
// ─────────────────────────────────────────────────────────────────────────

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const WWW = path.resolve(__dirname, '..');

// ── Virtual clock + fake timers ──────────────────────────────────────────
// Sequences schedule themselves with setTimeout over musical time. We replace
// the clock so the whole sequence resolves instantly and deterministically.
function makeClock() {
  let now = 0;
  let nextId = 1;
  const pending = new Map(); // id -> { time, fn }

  const setTimeoutFake = (fn, delay) => {
    const id = nextId++;
    pending.set(id, { time: now + Math.max(0, Number(delay) || 0), fn });
    return id;
  };
  const clearTimeoutFake = (id) => { pending.delete(id); };

  // Run every scheduled timer in time order until the queue drains.
  const drain = (maxIters = 500000) => {
    let iters = 0;
    while (pending.size) {
      if (++iters > maxIters) {
        throw new Error('timer drain exceeded ' + maxIters + ' iterations (runaway sequence?)');
      }
      let bestId = null;
      let bestTime = Infinity;
      for (const [id, t] of pending) {
        if (t.time < bestTime) { bestTime = t.time; bestId = id; }
      }
      const t = pending.get(bestId);
      pending.delete(bestId);
      now = t.time;
      t.fn();
    }
  };

  return {
    setTimeout: setTimeoutFake,
    clearTimeout: clearTimeoutFake,
    setInterval: () => 0,      // health monitor — never armed (init() is not called)
    clearInterval: () => {},
    performance: { now: () => now },
    drain,
  };
}

// A 21-param preset array — content is irrelevant to note COUNT, but the synth
// reads it to build each noteOn message, so it must exist for bank A.
const STUB_PRESET = [4, 1, 1, 0.01, 0.1, 0.5, 0.1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0.01, 0.1, 0.5, 0.1, 1];
const STUB_PRESETS = Array.from({ length: 100 }, () => STUB_PRESET.slice());

// ── Load synth.js into a sandbox and capture its class + compiler ─────────
function loadSynth() {
  const clock = makeClock();
  const sandbox = {
    window: {},
    YAMABRUH_PRESETS: STUB_PRESETS,
    performance: clock.performance,
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    setInterval: clock.setInterval,
    clearInterval: clock.clearInterval,
    console,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  let code = fs.readFileSync(path.join(WWW, 'synth.js'), 'utf8');
  // Capture lexically-scoped bindings (class/const) at end of the same script.
  code += '\n;try{ this.__SynthClass = YamaBruhSynth; }catch(e){}'
       +  '\n;try{ this.__compileSequenceSource = compileSequenceSource; }catch(e){}';
  vm.runInContext(code, sandbox, { filename: 'synth.js' });

  const SynthClass = sandbox.__SynthClass || (sandbox.window.synth && sandbox.window.synth.constructor);
  if (!SynthClass) throw new Error('Could not load YamaBruhSynth from synth.js');
  return { SynthClass, compileSequenceSource: sandbox.__compileSequenceSource, clock };
}

// ── Load synth-worklet.js just to exercise compileNoteAlgo (worklet path) ─
function loadWorkletCompiler() {
  const sandbox = {
    AudioWorkletProcessor: class { constructor() { this.port = { postMessage() {}, onmessage: null }; } },
    registerProcessor: () => {},
    sampleRate: 44100,
    currentFrame: 0,
    currentTime: 0,
    console,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  let code = fs.readFileSync(path.join(WWW, 'synth-worklet.js'), 'utf8');
  code += '\n;try{ this.__compileNoteAlgo = compileNoteAlgo; }catch(e){}';
  vm.runInContext(code, sandbox, { filename: 'synth-worklet.js' });
  if (typeof sandbox.__compileNoteAlgo !== 'function') {
    throw new Error('Could not load compileNoteAlgo from synth-worklet.js');
  }
  return sandbox.__compileNoteAlgo;
}

const { SynthClass, compileSequenceSource, clock } = loadSynth();
const compileNoteAlgo = loadWorkletCompiler();

// A fake worklet node that tallies noteOn / noteOff messages.
function makeCountingNode() {
  const counts = { noteOn: 0, noteOff: 0, other: 0 };
  return {
    counts,
    node: {
      connect() {},
      port: {
        onmessage: null,
        postMessage(msg) {
          if (msg && msg.type === 'noteOn') counts.noteOn++;
          else if (msg && msg.type === 'noteOff') counts.noteOff++;
          else counts.other++;
        },
      },
    },
  };
}

// Drive one sequence def through the synth and return how many notes fired.
function play(def, opts = {}) {
  const { midi = 60, vel = 0.8, preset = 0, bpm = 140 } = opts;
  const synth = new SynthClass();
  const { node, counts } = makeCountingNode();
  synth.workletNode = node;
  synth.setBpm(bpm);
  if (def) synth.setSequenceDef(preset, def);
  const normalized = def ? synth.getSequenceDef(preset) : null;
  synth.playNote(midi, vel, preset);
  clock.drain();
  return { noteOn: counts.noteOn, noteOff: counts.noteOff, normalized };
}

const seq = (source) => ({ enabled: true, name: 't', source });

// ── Test runner ──────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const rows = [];

function check(name, actual, expected) {
  const ok = actual === expected;
  ok ? passed++ : failed++;
  rows.push({ ok, name, detail: ok ? String(actual) : `got ${actual}, expected ${expected}` });
}
function checkTrue(name, cond, detail = '') {
  cond ? passed++ : failed++;
  rows.push({ ok: !!cond, name, detail: cond ? (detail || 'ok') : (detail || 'expected truthy') });
}

// ── Variations ───────────────────────────────────────────────────────────

// 1. No sequence → exactly one note.
check('plain note (no sequence)', play(null).noteOn, 1);

// 2. Offset sequence → one note per offset.
check('offsets [0,12,7,12] → 4 notes',
  play(seq('{ g: 0.6, offsets: [0, 12, 7, 12], t: 0.125, levels: [1, 0.7, 0.5, 0.3] }')).noteOn, 4);

// 3. Same offsets, annotated with a trailing comment → MUST match #2 (the bug).
check('offsets + trailing // comment → 4 notes',
  play(seq('{ g: 0.6, offsets: [0, 12, 7, 12], t: 0.125, levels: [1, 0.7, 0.5, 0.3] } // celesta cascade')).noteOn, 4);

// 4. Trailing comment that itself contains parentheses → still 4.
check('offsets + trailing // with parens → 4 notes',
  play(seq('{ offsets: [0, 7, 12, 7], t: 0.125 } // banjo roll (bluegrass)')).noteOn, 4);

// 5. Algorithm with paren-heavy math: bare vs annotated must agree.
const algoBare = '{\n  t: 0.2,\n  algorithm: ({ n, v, i }) => ({\n    n: n + ((i % 2) * 7),\n    v: clamp(v - 0.1, -1, 1),\n    t: 0.2,\n    g: 0.8,\n  }),\n}';
const algoNoted = algoBare + ' // arpeggiate up a fifth (every other step)';
const bare = play(seq(algoBare)).noteOn;
const noted = play(seq(algoNoted)).noteOn;
checkTrue('paren algorithm plays multiple notes', bare > 1, `${bare} notes`);
check('annotated algorithm matches bare algorithm', noted, bare);

// 6. The reported failure shape: trailing comment + parens compiles to a real
//    algorithmFn (pre-fix this was null → single fallback note).
const buggy = play(seq(algoNoted));
checkTrue('reported case compiled (algorithmFn present)',
  !!(buggy.normalized && typeof buggy.normalized.algorithmFn === 'function'));
checkTrue('reported case plays a real sequence (>1 note)', buggy.noteOn > 1, `${buggy.noteOn} notes`);

// 7. Genuinely broken source → null def, synth falls back to a single note.
//    (The synth logs the SyntaxError via console.error — expected here, so mute it.)
const broken = (() => {
  const err = console.error;
  console.error = () => {};
  try { return play(seq('{ offsets: [0, 12, , g: }')); }
  finally { console.error = err; }
})();
check('broken source → null sequence', broken.normalized, null);
check('broken source → single fallback note', broken.noteOn, 1);

// 8. Layer-only sequence [0, 70] → two layer voices + the main note = 3.
check('layer [0,70] → 3 notes', play(seq('{ layer: [0, 70] }')).noteOn, 3);

// 9. Non-terminating algorithm is capped at maxAlgorithmSteps (128).
check('runaway algorithm capped at 128',
  play(seq('{ algorithm: ({ n }) => ({ n: 60, v: 0.5, t: 0.1, g: 0.8 }) }')).noteOn, 128);

// 10. Descending-velocity algorithm terminates when next velocity < 0.
//     v: 0.8 → 0.6 → 0.4 → 0.2 → 0.0 (plays) → next -0.2 (<0, stops) = 5 notes.
check('velocity descent terminates at v<0',
  play(seq('{ algorithm: ({ n, v }) => ({ n: n + 1, v: round((v - 0.2) * 100) / 100, t: 0.1, g: 0.8 }) }')).noteOn, 5);

// ── Compile-only coverage for both wrappers (synth.js + worklet) ──────────
const trailingComment = '({ n }) => ({ n: n + 7 }) // up a fifth (a perfect one)';
checkTrue('synth compileSequenceSource: trailing comment ok',
  !!compileSequenceSource('{ offsets: [0, 7] } // chord (root + fifth)'));
checkTrue('worklet compileNoteAlgo: trailing comment ok',
  typeof compileNoteAlgo(trailingComment) === 'function');
checkTrue('worklet compileNoteAlgo: paren math ok',
  typeof compileNoteAlgo('({ time }) => (sin(time * 10) * (50 + 10))') === 'function');

// ── Report ───────────────────────────────────────────────────────────────
const PAD = Math.max(...rows.map((r) => r.name.length));
for (const r of rows) {
  console.log(`${r.ok ? '  ok' : 'FAIL'}  ${r.name.padEnd(PAD)}  ${r.detail}`);
}
console.log(`\n${passed} passed, ${failed} failed  (${passed + failed} total)`);
process.exit(failed ? 1 : 0);
