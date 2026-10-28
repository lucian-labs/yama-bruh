#!/usr/bin/env python3
"""Record and validate both web banks at 44.1/48 kHz in a fresh temp directory."""
import argparse
import json
import math
import os
from pathlib import Path
import shlex
import shutil
import struct
import subprocess
import sys
import tempfile

REPO = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, help='Create this new directory instead of a temporary directory')
args = parser.parse_args()
node = shutil.which('node')
if not node:
    parser.error('Node.js is required; install Node.js and retry.')
if args.output:
    root = args.output.expanduser().resolve()
    try:
        root.mkdir(parents=True, exist_ok=False)
    except FileExistsError:
        parser.error(f"Output already exists: {root}. Choose a new directory.")
else:
    root = Path(tempfile.mkdtemp(prefix='yama-bruh-audio-'))
print(f'Artifacts: {root}', flush=True)

def run(command, log, env=None):
    with (root / log).open('w') as stream:
        result = subprocess.run(command, cwd=REPO, env=env, stdout=stream, stderr=subprocess.STDOUT)
    if result.returncode:
        raise RuntimeError(f'Command failed ({result.returncode}); see {root / log}')

try:
    run([node, 'www/tests/sequence-notes.test.js'], 'sequence-tests.txt')
    run([node, 'tools/probe-clicks.cjs'], 'probe-results.txt')
    summary = {}
    for folder, rate in [('baseline', 44100), ('48000', 48000)]:
        print(f'Recording all 200 presets at {rate} Hz…', flush=True)
        run([node, 'tools/audit-audio.cjs', str(root / folder)], f'{folder}.log',
            env={**os.environ, 'AUDIT_SR': str(rate)})
        report = json.loads((root / folder / 'report.json').read_text())
        rows = report['results']
        expected = {(bank, index) for bank in ('A', 'B') for index in range(100)}
        if len(rows) != 200 or {(r['bank'], r['index']) for r in rows} != expected:
            raise RuntimeError(f'{folder}: missing or duplicate presets')
        if report['sampleRate'] != rate:
            raise RuntimeError(f'{folder}: incorrect sample rate')
        for row in rows:
            recording = root / folder / row['filename']
            raw = recording.read_bytes()
            if (len(raw) != 44 + rate * 14 * 4 or raw[:4] != b'RIFF'
                    or raw[8:12] != b'WAVE' or raw[36:40] != b'data'
                    or struct.unpack_from('<HHI', raw, 20) != (3, 1, rate)):
                raise RuntimeError(f'Invalid WAV: {recording}')
            # Decode the saved PCM, independently of the renderer's counters.
            if any(not math.isfinite(x[0]) for x in struct.iter_unpack('<f', raw[44:])):
                raise RuntimeError(f'Non-finite saved PCM: {recording}')
            if row['nonfinite'] or row['crashes']:
                raise RuntimeError(f'Audio engine errors: {recording}')
        summary[folder] = {'sampleRate': rate, 'recordings': len(rows),
            'presetsWithVoiceCutoffs': sum(bool(r['steals']) for r in rows),
            'voiceCutoffs': sum(len(r['steals']) for r in rows),
            'unfinishedTails': sum(bool(r['remainingVoices']) for r in rows)}
    run([sys.executable, 'tools/build-audio-report.py', str(root)], 'report-build.txt')
    (root / 'validation.json').write_text(json.dumps({
        'passed': True, 'summary': summary,
        'scope': 'Offline web engine. Validates complete finite PCM, not click-free sound or physical playback.',
        'sequenceTestLog': 'sequence-tests.txt', 'diagnosticProbeLog': 'probe-results.txt',
    }, indent=2) + '\n')
    print(f'PASS: 400 WAVs, waveform SVGs, JSON measurements and interactive report.\n{root / "index.html"}')
    print('Preview: python3 -m http.server 3469 --bind 127.0.0.1 --directory ' + shlex.quote(str(root)))
    print('Voice cutoffs remain diagnostic findings; PASS does not mean click-free audio.')
except Exception as error:
    (root / 'validation.json').write_text(json.dumps({'passed': False, 'error': str(error)}, indent=2) + '\n')
    raise SystemExit(f'FAIL: {error}\nArtifacts retained: {root}')
