#!/usr/bin/env node
// Repeatable identity probe, not an audible-click regression test.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=f=>fs.readFileSync(path.join(__dirname,'../www',f),'utf8');
const Synth=new Function('window',read('synth.js')+';return YamaBruhSynth;')({});
const Processor=new Function('AudioWorkletProcessor','registerProcessor','sampleRate',read('synth-worklet.js')+';return YamaBruhProcessor;')(class{constructor(){this.port={postMessage(){}};}},()=>{},44100);
function probe(ids){const p=new Processor(),s=new Synth();p.chokeSameNotes=true;s.workletNode={port:{postMessage:m=>p._onMessage(m)}};for(const id of ids)s._postNoteOn(id,60,.8);return {voices:p.voices.length,choking:p.voices.filter(v=>v.choking).length,keys:p.voices.map(v=>v.key)};}
const plain=probe([60,60]),sequence=probe(['seq:1:0:0','seq:1:0:1']);
assert.equal(plain.choking,1);assert.equal(sequence.choking,0);
console.log(JSON.stringify({plain,sequence,finding:'Same pitch: plain IDs choke, unique sequence IDs do not. _postNoteOn omits sourceNote. This diagnoses identity handling, not audible output or external hardware.'},null,2));
