#!/usr/bin/env node
// Audit a captured VR manifest + notification engine without changing either site.
// node tools/audit-notify-packet.cjs PACKET_DIR [NEW_OUTPUT_DIR]
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
if(!process.argv[2]){console.error('Usage: node tools/audit-notify-packet.cjs PACKET_DIR [NEW_OUTPUT_DIR]');process.exit(2);}
const packet=path.resolve(process.argv[2]);
const out=process.argv[3]?path.resolve(process.argv[3]):fs.mkdtempSync(path.join(os.tmpdir(),'yama-vr-audit-'));
if(process.argv[3])fs.mkdirSync(out,{recursive:false});
const manifest=JSON.parse(fs.readFileSync(path.join(packet,'manifest.json'),'utf8'));
const source=fs.readFileSync(path.join(packet,'yamabruh-notify.js'),'utf8');
const hash=crypto.createHash('sha256').update(source).digest('hex');
if(hash!==manifest.cdn_sha256)throw Error('Engine hash differs from manifest');
const sr=manifest.sampleRate;
function wav(name,samples){
 const b=Buffer.alloc(44+samples.length*4);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(3,20);b.writeUInt16LE(1,22);b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*4,28);b.writeUInt16LE(4,32);b.writeUInt16LE(32,34);b.write('data',36);b.writeUInt32LE(samples.length*4,40);samples.forEach((x,i)=>b.writeFloatLE(x,44+i*4));fs.writeFileSync(path.join(out,name),b);
}
function stats(a){let peak=0,sum=0,nonfinite=0,overFullScale=0,maxDelta=0;for(let i=0;i<a.length;i++){const x=a[i];if(!Number.isFinite(x)){nonfinite++;continue;}peak=Math.max(peak,Math.abs(x));sum+=x*x;if(Math.abs(x)>1)overFullScale++;if(i)maxDelta=Math.max(maxDelta,Math.abs(x-a[i-1]));}return {peak,rms:Math.sqrt(sum/a.length),nonfinite,overFullScale,maxDelta,endJump:Math.abs(a.at(-1)||0)};}
function player(){
 let seed=123456789;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const Notify=new Function('Math',source+'\nreturn YamaBruhNotify;')(math);
 const p=new Notify({seed:manifest.seed,volume:manifest.volume});
 const operations=[];
 p.ctx={state:'running',destination:{},createBuffer(ch,n,rate){const data=new Float32Array(n);return {data,getChannelData(){return data;}};},createBufferSource(){return {connect(){operations.push('connect');},disconnect(){operations.push('disconnect');},start(){operations.push('start');},stop(){operations.push('stop');}};}};
 return {p,operations};
}
const results=[];
for(const use of manifest.uses){
 const {p,operations}=player();const actual=Array.from(p._getPreset(use.preset));
 if(JSON.stringify(actual)!==JSON.stringify(use.parameters))throw Error(`Patch mismatch: ${use.ring}`);
 const noteCalls=[];const render=p._renderNote;
 p._renderNote=function(freq,duration,preset,buf,offset,velocity){
  const isolated=new Float32Array(Math.ceil((duration+Math.max(preset[6],preset[19]||0)*8+1)*sr));
  const count=player().p._renderNote(freq,duration,preset,isolated,0,velocity);
  const ksr=preset[12]>0?Math.pow(2,-preset[12]*Math.log2(freq/440)):1;
  const afterEnd=offset+count>buf.length?isolated.subarray(Math.max(0,buf.length-offset),count):new Float32Array();
  const row={freq,duration,offset:offset/sr,renderedSamples:count,carrierAttackDecay:(preset[3]+preset[4])*ksr,carrierRelease:preset[6]*ksr,
   naturalEndJump:Math.abs(isolated[count-1]||0),allocationTruncatedSamples:Math.max(0,offset+count-buf.length),discardedTailPeak:afterEnd.length?stats(afterEnd).peak:0};
  noteCalls.push(row);
  return render.call(this,freq,duration,preset,buf,offset,velocity);
 };
 const node=p.play(use.ring,{preset:use.preset});const samples=node.buffer.data;
 const filename=`${use.ring}-${use.preset}.wav`;wav(filename,samples);
 // A new shared-player trigger hard-stops the old source. Concatenate its
 // truncated PCM with the new source's PCM; spatial graph gain is not simulated.
 const interrupts=[];
 for(const seconds of [.125,.5,1.2,6.5]){
  const n=Math.floor(seconds*sr);if(n>=samples.length)continue;
  const joined=new Float32Array(n+samples.length);joined.set(samples.subarray(0,n));joined.set(samples,n);
  const file=`${use.ring}-interrupt-${seconds}s.wav`;wav(file,joined);
  interrupts.push({seconds,file,jump:Math.abs(samples[n-1]-samples[0])});
 }
 const calls=noteCalls.slice();p.play(use.ring,{preset:use.preset});
 results.push({...use,filename,duration:samples.length/sr,metrics:stats(samples),notes:calls,interruptions:interrupts,retriggerOperations:operations});
 console.log(`${use.ring} ${use.name}: peak=${stats(samples).peak.toFixed(3)} max note end=${Math.max(...calls.map(n=>n.naturalEndJump)).toFixed(3)}`);
}
// Remove FM/noise as confounders: a pure 100 Hz sine with a 100 ms attack,
// 100 ms decay and 10 ms gate should release from its current level.
const {p}=player();const sine=[1,1,0,.1,.1,.5,.1,0,0,0,0,0,0,0,0,0,.1,.1,.5,.1,0];
const probe=new Float32Array(sr);const probeCount=p._renderNote(103,.01,sine,probe,0,.5);wav('short-gate-sine.wav',probe);
const findings={
 engineSha256:hash,packet,site:manifest.site,version:manifest.live_version,scope:'Exact captured notification engine, 32 ring uses. Offline PCM and source inspection; not physical playback or the VR spatial graph.',
 uses:results.length,uniquePresets:new Set(results.map(r=>r.preset)).size,
 overFullScaleUses:results.filter(r=>r.metrics.overFullScale).map(r=>r.ring),
 nonfiniteSamples:results.reduce((n,r)=>n+r.metrics.nonfinite,0),
 noteEndpointAbove005:results.filter(r=>r.notes.some(n=>n.naturalEndJump>.005)).map(r=>({ring:r.ring,preset:r.preset,name:r.name,max:Math.max(...r.notes.map(n=>n.naturalEndJump))})),
 truncatedAllocation:results.filter(r=>r.notes.some(n=>n.allocationTruncatedSamples)).map(r=>({ring:r.ring,notes:r.notes.filter(n=>n.allocationTruncatedSamples)})),
 pureSineProbe:{renderedSamples:probeCount,lastSample:probe[probeCount-1],jumpToZero:Math.abs(probe[probeCount-1]),gateSeconds:.01,attackSeconds:.1,releaseSeconds:.1},
 conclusions:[
 'Confirmed code defect: attack and decay branches take precedence over key-off. Short notes can stop rendering with a nonzero envelope. The pure-sine probe isolates this from FM/noise.',
 'Confirmed integration behavior: play() hard-stops the shared prior source with no gain ramp. Interruption WAVs simulate this raw source join, before VR spatial processing.',
 'Confirmed allocation mismatch: play() reserves unscaled carrier release, while renderNote scales release by pitch. Low notes can lose their release tail at the output buffer end.',
 'Large sample deltas alone do not establish an audible click, especially for intentional noise and quarter-sine waveforms. No perceptual claim is made.',
 'The keyboard worklet voice-limit diagnosis does not apply to this pre-rendered notification path.'
 ],results};
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(findings,null,2));
console.log(`Report and recordings: ${out}`);
