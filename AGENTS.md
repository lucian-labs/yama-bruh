# Yama-bruh

Read `/Users/elijahlucian/AGENTS.md` (or the machine's global agent entry point)
and `~/repos/lucian-utils/AGENTS.md` for shared conventions.

## Audio investigation

- Web keyboard and KEY SEQUENCE use `www/synth.js` and `www/synth-worklet.js`.
- Bank A lives in `www/yamabruh-notify.js`; Bank B in `www/yamabruh-bank-b.js`.
- Bank A sequence definitions live in `www/app.js`; Bank B definitions accompany its presets.
- `node www/tests/sequence-notes.test.js` checks scheduling/compilation, not audio continuity.
- `node tools/audit-audio.cjs OUTPUT_DIR [BANK] [INDEX] [SAMPLE_RATE]` records every web preset by default. Set `AUDIT_SR=48000` for a full second sample-rate sweep.
- Each WAV contains a plain note, default sequence, rapid repeated keys and release tails. JSON includes source hashes and voice-stealing events. Keep recordings outside the repository.
- `node tools/probe-clicks.cjs` isolates hard voice stealing and premature carrier retirement. It reports current behavior; it is not a passing continuity regression test.
- For a reviewable local report, render into `OUTPUT_ROOT/baseline` and `OUTPUT_ROOT/48000`, save probe output to `OUTPUT_ROOT/probe-results.txt`, then run `python3 tools/build-audio-report.py OUTPUT_ROOT`. Serve that directory with a local HTTP server.
- Large adjacent-sample differences alone do not prove clicks: intentional noise, feedback FM and quarter-sine waveforms also produce them. Separate offline PCM evidence from real browser scheduling, CPU load and physical listening.
