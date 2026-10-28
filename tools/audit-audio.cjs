#!/usr/bin/env node
// Offline PCM audit of the real browser synth, banks, key-sequence scheduler,
// and AudioWorklet. No listening-device/browser underrun claims are made.
// node tools/audit-audio.cjs OUTPUT_DIR [BANK] [INDEX] [SAMPLE_RATE]
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const WWW = path.resolve(__dirname, '../www');
const output = path.resolve(process.argv[2] || '/tmp/yama-bruh-audio-audit');
const sr = Number(process.env.AUDIT_SR || process.argv[5] || 44100);
fs.mkdirSync(output, {recursive:true});
const read = name => fs.readFileSync(path.join(WWW, name), 'utf8');
const app = read('app.js');
const defs = app.slice(app.indexOf('  const DEFAULT_SEQUENCE_DEFS ='), app.indexOf('  // ── Visual Config State'));
const source = ['yamabruh-notify.js','yamabruh-bank-b.js','synth.js','synth-worklet.js','app.js'];
const hashes = Object.fromEntries(source.map(f => [f, crypto.createHash('sha256').update(read(f)).digest('hex')]));
function wav(file, samples) {
  const b = Buffer.alloc(44 + samples.length * 4);
  b.write('RIFF'); b.writeUInt32LE(b.length-8,4); b.write('WAVEfmt ',8);
  b.writeUInt32LE(16,16); b.writeUInt16LE(3,20); b.writeUInt16LE(1,22);
  b.writeUInt32LE(sr,24); b.writeUInt32LE(sr*4,28); b.writeUInt16LE(4,32); b.writeUInt16LE(32,34);
  b.write('data',36); b.writeUInt32LE(samples.length*4,40);
  for(let i=0;i<samples.length;i++) b.writeFloatLE(samples[i],44+i*4);
  fs.writeFileSync(file,b);
}
function scopedFunction(math) {
  return function(...parts) {
    const body=parts.pop();
    return new Function('Math', `return function(${parts.join(',')}) {${body}\n};`)(math);
  };
}
function run(bank, index) {
  let now=0, id=0, seed=123456789;
  const math = Object.create(Math);
  math.random = () => {seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  // The audio worklet has its own random stream, independent of sequence timing.
  let audioSeed=987654321;
  const audioMath=Object.create(Math);
  audioMath.random=()=>{audioSeed=(Math.imul(audioSeed,1664525)+1013904223)>>>0;return audioSeed/4294967296;};
  const timers = new Map();
  const setTimer = (fn, ms=0) => {const key=++id;timers.set(key,{at:now+Math.max(0,ms),fn});return key;};
  const clearTimer = key=>timers.delete(key);
  const scope = new Function('window','performance','setTimeout','clearTimeout','setInterval','clearInterval','Math','Function',
    read('yamabruh-notify.js')+'\n'+read('yamabruh-bank-b.js')+'\n'+read('synth.js')+'\n'+defs+
    '\nreturn {Synth:YamaBruhSynth,names:{A:PRESET_NAMES,B:PRESET_NAMES_B},defs:{A:DEFAULT_SEQUENCE_DEFS,B:DEFAULT_SEQUENCE_DEFS_B}};'
  )({}, {now:()=>now},setTimer,clearTimer,()=>0,()=>{},math,scopedFunction(math));
  const crashes=[];
  const Processor = new Function('AudioWorkletProcessor','registerProcessor','sampleRate','currentTime','Math','Function',
    read('synth-worklet.js')+'\nreturn YamaBruhProcessor;'
  )(class {constructor(){this.port={postMessage:m=>crashes.push(m)};}},()=>{},sr,0,audioMath,scopedFunction(audioMath));
  const p=new Processor();
  // Dry rendering makes transitions measurable; presets and noise remain intact.
  p.delayMix=0;
  const synth=new scope.Synth(); synth.bank=bank; synth.ready=true;
  const events=[], steals=[]; let peakVoices=0;
  synth.workletNode={port:{postMessage(msg){
    if(msg.type==='noteOn' && p.voices.length>=p.maxVoices) {
      const v=p.voices[0]; steals.push({time:now/1000,note:v.note,envelope:v.el,velocity:v.velocity});
    }
    events.push({sample:Math.round(now*sr/1000),type:msg.type,note:msg.note});
    p._onMessage(msg);
    peakVoices=Math.max(peakVoices,p.voices.length);
  }}};
  synth.setBpm(140);
  const preset=synth.getPresetParams(index);
  let token;
  setTimer(()=>{synth.setSequenceDef(index,null);token=synth.playNote(60,0.8,index);},0);
  setTimer(()=>synth.stopNote(token),1000);
  const def=scope.defs[bank][index];
  setTimer(()=>{synth.setSequenceDef(index,def);token=synth.playNote(60,0.8,index);},3000);
  setTimer(()=>synth.stopNote(token),6000);
  for(let k=0;k<12;k++)setTimer(()=>{
    const t=synth.playNote([48,60,67,72][k%4],0.8,index);
    setTimer(()=>synth.stopNote(t),35);
  },7000+k*100);
  const samples=new Float32Array(sr*14);
  const earlyRemovals=[];
  let pos=0;
  while(pos<samples.length){
    now=pos*1000/sr;
    while(true){
      let key=null,at=Infinity;
      for(const [k,t] of timers)if(t.at<at){key=k;at=t.at;}
      if(key===null || at>now+0.000001)break;
      const t=timers.get(key);timers.delete(key);t.fn();
    }
    let next=Infinity;for(const t of timers.values())next=Math.min(next,t.at);
    const end=Math.min(samples.length,pos+128,Math.max(pos+1,Math.ceil(next*sr/1000)));
    const before=p.voices.filter(v=>v.es===0).map(v=>({v,note:v.note,el:v.el}));
    p.process([],[[samples.subarray(pos,end)]]);
    for(const b of before)if(!p.voices.includes(b.v)&&b.v.es===0)
      earlyRemovals.push({time:pos/sr,note:b.note,envelope:b.v.el,modulatorStage:b.v.mes});
    pos=end;
  }
  let peak=0,energy=0,maxDelta=0,nonfinite=0,largeDeltas=0;
  for(let i=0;i<samples.length;i++){
    const x=samples[i];if(!Number.isFinite(x)){nonfinite++;continue;}
    peak=Math.max(peak,Math.abs(x));energy+=x*x;
    if(i){const d=Math.abs(x-samples[i-1]);maxDelta=Math.max(maxDelta,d);if(d>0.15)largeDeltas++;}
  }
  const boundaries=events.filter(e=>e.sample>0&&e.sample<samples.length).map(e=>{
    let localPeak=0;for(let j=e.sample;j<Math.min(samples.length,e.sample+Math.ceil(sr*.003));j++)localPeak=Math.max(localPeak,Math.abs(samples[j]-samples[j-1]));
    return {...e,time:e.sample/sr,delta:Math.abs(samples[e.sample]-samples[e.sample-1]),next3msMaxDelta:localPeak};
  }).sort((a,b)=>b.delta-a.delta);
  const name=scope.names[bank][index];
  const filename=`${bank}-${String(index).padStart(2,'0')}-${name.replace(/[^a-z0-9]+/gi,'-')}.wav`;
  wav(path.join(output,filename),samples);
  return {bank,index,name,filename,preset,hasSequence:!!def,sequence:def||null,peak,rms:Math.sqrt(energy/samples.length),maxDelta,largeDeltas,nonfinite,peakVoices,steals,earlyRemovals,crashes,remainingVoices:p.voices.length,tailPeak:samples.subarray(samples.length-Math.ceil(sr*.1)).reduce((peak,x)=>Math.max(peak,Math.abs(x)),0),worstBoundaries:boundaries.slice(0,12)};
}
const results=[];
for(const bank of process.argv[3]?[process.argv[3]]:['A','B']){
  for(const index of process.argv[4]!==undefined?[Number(process.argv[4])]:Array.from({length:100},(_,i)=>i)){
    const r=run(bank,index);results.push(r);
    console.log(`${bank}-${String(index).padStart(2,'0')} ${r.name}: delta=${r.maxDelta.toFixed(3)} steals=${r.steals.length} early=${r.earlyRemovals.length}`);
    fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({sampleRate:sr,hashes,timeline:'0s plain C4, 1s release; 3s default sequence C4, 6s key release; 7-8.1s repeated keys C3/C4/G4/C5, 35ms gates; render to 14s. Dry, deterministic noise, ideal main-thread timers. Abrupt-delta counts are not proof of clicks in noise/FM presets.',results},null,2));
  }
}
