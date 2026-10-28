// Isolate voice stealing from normal release using a pure sine at its peak.
// Diagnostic baseline, not a passing regression test of desired behavior.
const fs = require('fs'), vm = require('vm'), path = require('path');
const math = Object.create(Math); math.random = () => 0.5;
let Processor;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../www/synth-worklet.js'),'utf8'), {
  Math: math, sampleRate: 48000, currentTime: 0,
  AudioWorkletProcessor: class { constructor() { this.port = {postMessage(){}}; } },
  registerProcessor: (_, p) => Processor = p,
});
const op = {mult:1, attack:0.001, decay:0.01, sustain:1, release:1, sustained:true};
const preset = {carrier:op, modulator:op, modDepth:0, feedback:0, modLevel:0};
function engine() {const p = new Processor(); p.delayMix = 0; return p;}
function note(p,n,velocity=1,patch=preset) {p._onMessage({type:'noteOn',note:n,freq:100,velocity,preset:patch});}
function render(p,n) {const b = new Float32Array(n); p.process([], [[b]]); return b;}
const p=engine(); p.maxVoices=1; note(p,1); const before=render(p,3000); note(p,2,0); const after=render(p,1);
console.log('Steal at sine peak:', {before:before.at(-1),after:after[0],jump:Math.abs(after[0]-before.at(-1))});
const q=engine(); note(q,1); const prior=render(q,3000); q._onMessage({type:'noteOff',note:1}); const released=render(q,1);
console.log('Ordinary note-off at same peak:', {before:prior.at(-1),after:released[0],jump:Math.abs(released[0]-prior.at(-1))});
const r=engine(); const slow={...preset,carrier:{...op,attack:10},modulator:{...op,attack:0,decay:0}}; note(r,1,1,slow); render(r,128);
console.log('Slow carrier / instant modulator after 128 samples:', {voices:r.voices.length,expected:1});
