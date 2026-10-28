#!/usr/bin/env python3
"""Build a self-contained audit index beside the recorded WAV directories."""
import json, struct, sys
from pathlib import Path
root = Path(sys.argv[1]).resolve()
report = json.loads((root / 'baseline/report.json').read_text())
rows = report['results']
for row in rows:
    raw = (root / 'baseline' / row['filename']).read_bytes()
    samples = memoryview(raw)[44:].cast('f')
    step = max(1, len(samples)//600)
    upper, lower = [], []
    for i in range(600):
        chunk = samples[i*step:min((i+1)*step,len(samples))]
        upper.append(f'{i},{60-max(chunk)*55:.2f}')
        lower.append(f'{i},{60-min(chunk)*55:.2f}')
    row['waveform'] = 'M'+' L'.join(upper+lower[::-1])+' Z'
    row['stolenVoices'] = len(row['steals'])
    row['firstSteal'] = row['steals'][0]['time'] if row['steals'] else None
    # Full events and parameters remain in report.json.
    del row['steals']
    del row['preset']
    del row['sequence']
data = json.dumps(rows).replace('</', '<\\/')
html = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Yama-bruh · Sound audit</title>
<style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#111617;color:#e5e9e4}body{max-width:1050px;margin:32px auto;padding:0 22px}h1{font-size:28px}h2{font-size:20px}p,li{line-height:1.55}a{color:#9bd8c1}button,input,select{font:inherit}button,select,input[type=search]{background:#253331;color:inherit;border:1px solid #58706b;border-radius:7px;padding:10px}button{cursor:pointer}button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #b9e6a6}.panel{border:1px solid #384741;background:#1a2321;padding:20px;border-radius:12px;margin:20px 0}.muted{color:#a9b7b1;font-size:14px}.controls{display:flex;gap:12px;flex-wrap:wrap;align-items:center}svg{width:100%;height:120px;background:#101714;cursor:pointer}path{fill:#8cb99e}line{stroke:#fff;stroke-width:2}input[type=range]{width:100%}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:9px;border-bottom:1px solid #34423d}td button{text-align:left;padding:6px}.bad{color:#ffb48e}summary{cursor:pointer}#status{min-height:1.5em} .scroll{max-height:550px;overflow:auto}th{position:sticky;top:0;background:#111617}
</style>
<h1>Yama-bruh · Sound audit</h1><p>200 web presets · both banks · 92 default key sequences · 28 October 2026</p>
<div class="panel"><h2>Confirmed: voices are cut off abruptly</h2>
<ul><li><strong>29 presets</strong> exhausted the 16-voice pool during this test. An older voice is removed with no fade.</li>
<li>Examples: Glass Celesta, Vibraphone, Music Box, Telephone Bell and Fireworks.</li>
<li>Some ungated Bank B sequences retain a positive velocity and run to the 128-step cap. Repeated keys stack these sequences.</li></ul>
<p>Controlled sine test: stealing a voice caused a <strong>0.3496 → 0</strong> jump in one sample. Ordinary note-off at the same phase caused no measurable jump after DAC quantization.</p>
<p><strong>Next repair:</strong> fade stolen voices while preserving their release continuity, then rerun this audit. Review long-running sequence definitions separately so intentional one-shot patterns retain their behavior.</p></div>
<div class="panel"><h2 id="name">Choose a recording</h2>
<svg id="wave" viewBox="0 0 600 120" role="img" aria-label="Recorded waveform; use the seek slider below"><path id="shape"></path><line id="head" x1="0" y1="0" x2="0" y2="120"></line></svg>
<input id="seek" type="range" min="0" max="14" step="0.01" value="0" aria-label="Seek recording">
<div class="controls"><button id="play">Play</button><button id="stop">Stop</button><button id="jump">First voice cutoff</button><span id="time">0.00 / 14.00 s</span><a id="download" download>Download WAV</a></div><p id="status" aria-live="polite">Ready</p><p id="detail" class="muted"></p>
<p class="muted">0–1s: plain C4 · 3–6s: default key sequence · 7–8.1s: rapid C3/C4/G4/C5 keys with 35ms gates · tails rendered through 14s.</p></div>
<div class="controls"><input id="search" type="search" placeholder="Find a preset" aria-label="Find a preset"><select id="filter" aria-label="Filter presets"><option value="all">All 200 presets</option><option value="steals">Voice cutoffs (29)</option><option value="A">Bank A</option><option value="B">Bank B</option></select><span id="count"></span></div>
<div class="scroll"><table><thead><tr><th>Preset (index)</th><th>Cutoffs</th><th>Largest sample jump</th><th>Sequence</th></tr></thead><tbody id="rows"></tbody></table></div>
<details class="panel"><summary>Coverage, measurements and limits</summary>
<ul><li>Real synth.js scheduler, both preset banks and synth-worklet.js, rendered offline at 44.1 kHz. A second complete 200-preset sweep was recorded at 48 kHz in the adjacent 48000 directory.</li><li>Dry output; default delay disabled to isolate transitions. Deterministic randomness. Ideal timers: this does not simulate browser load, message latency, CPU underruns or physical speakers.</li><li>Largest sample jump is a screening metric, not a click diagnosis. Noise, strong FM and the intentionally discontinuous quarter-sine waveform naturally score high.</li><li>Zero non-finite samples across the 200 baseline renders. __TAIL_COUNT__ presets still had active voices at the 14-second recording boundary; the end of those files is an audit cutoff, not evidence of an engine cutoff.</li><li>A separate synthetic patch exposed premature voice removal while the carrier was still attacking, because removal also checks the modulator stage. This did not occur in these default-preset recordings.</li><li>Existing checks passed: 16 sequence tests and 8 Swift package tests. Native app/AUv3 audio, notification renderer, WASM ringtone renderer and physical playback were not exhaustively recorded here.</li><li>Source hashes, preset values, individual cutoff times and sequence definitions are preserved in the JSON. No synthesis or preset behavior has been changed.</li></ul>
<a href="baseline/report.json">Full 44.1 kHz data</a> · <a href="48000/report.json">48 kHz data</a> · <a href="probe-results.txt">Controlled probe</a></details>
<script>const data=__DATA__;
const el=id=>document.getElementById(id);let current=null,buffer=null,ctx=null,source=null,offset=0,started=0,playing=false,loading=null,version=0;
function position(){return playing?Math.min(14,offset+ctx.currentTime-started):offset;}
function pause(){offset=position();playing=false;if(source){source.onended=null;source.stop();source=null;}el('play').textContent='Play';}
function select(r){pause();offset=0;current=r;buffer=null;loading=null;version++;el('name').textContent=`${r.bank}-${String(r.index).padStart(2,'0')} · ${r.name}`;el('shape').setAttribute('d',r.waveform);el('download').href='baseline/'+r.filename;el('detail').textContent=`${r.stolenVoices} voice cutoffs · peak ${r.peak.toFixed(3)} · ${r.nonfinite} non-finite samples`+(r.remainingVoices?' · recording ends with active voices':'');el('jump').disabled=r.firstSteal===null;el('status').textContent='Ready';}
async function play(){const v=version;el('status').textContent='Loading…';try{ctx ||= new AudioContext();await ctx.resume();if(!buffer){loading ||= fetch('baseline/'+current.filename).then(r=>{if(!r.ok)throw Error('WAV unavailable');return r.arrayBuffer();}).then(b=>ctx.decodeAudioData(b));const decoded=await loading;if(v!==version)return;buffer=decoded;}if(offset>=14)offset=0;source=ctx.createBufferSource();source.buffer=buffer;source.connect(ctx.destination);started=ctx.currentTime;playing=true;source.onended=()=>{playing=false;offset=0;source=null;el('play').textContent='Play';el('status').textContent='Finished';};source.start(0,offset);el('play').textContent='Pause';el('status').textContent='Playing';}catch(e){el('status').textContent='Could not play: '+e.message;}}
function seek(t){const resume=playing;pause();offset=Math.max(0,Math.min(14,t));if(resume)play();}
function list(){let q=el('search').value.toLowerCase(),f=el('filter').value;const rows=data.filter(r=>(r.name.toLowerCase().includes(q)||`${r.bank}-${r.index}`.toLowerCase().includes(q))&&(f==='all'||f==='steals'&&r.stolenVoices||r.bank===f));el('rows').replaceChildren();for(const r of rows){const tr=document.createElement('tr'),td=document.createElement('td'),b=document.createElement('button');b.textContent=`${r.bank}-${String(r.index).padStart(2,'0')} ${r.name}`;b.onclick=()=>select(r);td.append(b);tr.append(td);for(const v of [r.stolenVoices,r.maxDelta.toFixed(3),r.hasSequence?'Yes':'—']){const c=document.createElement('td');c.textContent=v;tr.append(c);}el('rows').append(tr);}el('count').textContent=rows.length+' presets';}
el('play').onclick=()=>{if(playing){pause();el('status').textContent='Paused';}else play();};
el('stop').onclick=()=>{pause();offset=0;el('status').textContent='Stopped';};
el('seek').oninput=()=>seek(Number(el('seek').value));
el('wave').onclick=e=>{const b=el('wave').getBoundingClientRect();seek((e.clientX-b.left)/b.width*14);};
el('jump').onclick=()=>{seek(current.firstSteal-.2);el('status').textContent='Positioned 0.2s before first cutoff';};
function tick(){const t=position();el('seek').value=t;el('time').textContent=t.toFixed(2)+' / 14.00 s';for(const a of ['x1','x2'])el('head').setAttribute(a,t/14*600);requestAnimationFrame(tick);}el('search').oninput=list;el('filter').onchange=list;list();select(data.find(r=>r.bank==='A'&&r.index===9));tick();
</script></html>'''.replace('__DATA__',data)
html=html.replace('__TAIL_COUNT__',str(sum(bool(r['remainingVoices']) for r in rows)))
html=html.replace('29 presets',str(sum(bool(r['stolenVoices']) for r in rows))+' presets').replace('cutoffs (29)','cutoffs ('+str(sum(bool(r['stolenVoices']) for r in rows))+')')
(root/'index.html').write_text(html)
print(root/'index.html')
