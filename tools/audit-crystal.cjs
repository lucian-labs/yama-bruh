#!/usr/bin/env node
// Isolate Crystal's notification envelope with an offline-only repair candidate.
// node tools/audit-crystal.cjs PACKET_DIR OUTPUT_DIR [crystal|human-voice-3]
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const packet=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);fs.mkdirSync(out,{recursive:true});
const manifest=JSON.parse(fs.readFileSync(path.join(packet,'manifest.json'))),src=fs.readFileSync(path.join(packet,'yamabruh-notify.js'),'utf8');
if(crypto.createHash('sha256').update(src).digest('hex')!==manifest.cdn_sha256)throw Error('Source hash mismatch');
const sr=44100;
const target=process.argv[4]||'crystal';
const config={crystal:{preset:88,ring:'ringtones-27'},'human-voice-3':{preset:72,ring:'ringtones-22'}}[target];
if(!config)throw Error('Unknown diagnostic preset');
function wav(name,a){const b=Buffer.alloc(44+a.length*4);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(3,20);b.writeUInt16LE(1,22);b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*4,28);b.writeUInt16LE(4,32);b.writeUInt16LE(32,34);b.write('data',36);b.writeUInt32LE(a.length*4,40);a.forEach((v,i)=>b.writeFloatLE(v,44+4*i));fs.writeFileSync(path.join(out,name.replace(/^crystal/,target)),b);}
function load(code){const Cls=new Function(code+';return YamaBruhNotify;')();const p=new Cls({seed:manifest.seed,volume:manifest.volume});p.ctx={state:'running',destination:{},createBuffer(c,n){const data=new Float32Array(n);return {data,getChannelData(){return data;}};},createBufferSource(){return {connect(){},start(){},stop(){}};}};return p;}
const original=load(src),calls=[],render=original._renderNote;
original._renderNote=function(...args){calls.push(args.slice(0,3).concat(args[4],args[5]));return render.apply(this,args);};
const baseline=original.play(config.ring,{preset:config.preset}).buffer.data;
wav('crystal-original.wav',baseline);
const begin=src.indexOf('      // ── Modulator ADSR envelope');const end=src.indexOf('      // YM2413 Tremolo',begin);
if(begin<0||end<0)throw Error('Envelope markers missing');
const replacement=`      // Diagnostic-only envelope: release from the actual key-off level.
      const held = (j, a, d, sustain, eg, decayBase) => {
        if(j<a)return j/(a||1);
        if(j<a+d)return 1-(1-sustain)*(j-a)/(d||1);
        if(eg>0.5){const e=sustain*Math.pow(0.5,((j-a-d)/sr)/(decayBase*2+0.01));return e<0.001?0:e;}
        return sustain;
      };
      const mEnv = i < noteSamples
        ? held(i,mAttackSamples,mDecaySamples,mSustain,mEgType,mDecBase)
        : held(noteSamples,mAttackSamples,mDecaySamples,mSustain,mEgType,mDecBase)*Math.max(0,1-(i-noteSamples)/Math.max(mRelease*sr,1));
      const env = i < noteSamples
        ? held(i,attackSamples,decaySamples,sustain,egType,decBase)
        : held(noteSamples,attackSamples,decaySamples,sustain,egType,decBase)*Math.max(0,1-(i-noteSamples)/Math.max(release*sr,1));

`;
const fixed=load(src.slice(0,begin)+replacement+src.slice(end));
const parts=[],evidence=[];let length=baseline.length;
for(let i=0;i<calls.length;i++){
 const [freq,dur,preset,offset,velocity]=calls[i];const a=new Float32Array(sr*5),b=new Float32Array(sr*5);
 const count=render.call(original,freq,dur,preset,a,0,velocity);const fixedCount=fixed._renderNote(freq,dur,preset,b,0,velocity);
 if(count!==fixedCount)throw Error('Candidate changed oscillator lifetime');
 length=Math.max(length,offset+count);parts.push({a,b,offset,count});
 const endSample=offset+count;
 evidence.push({note:i+1,freq,duration:dur,offset:offset/sr,endTime:endSample/sr,
   originalLastSample:a[count-1],candidateLastSample:b[count-1],
   fullMixJump:endSample<baseline.length?baseline[endSample]-baseline[endSample-1]:null,
   omittedSamples:Math.max(0,endSample-baseline.length)});
 wav(`crystal-note-${i+1}-original.wav`,a.subarray(0,count+Math.round(.05*sr)));
 wav(`crystal-note-${i+1}-candidate.wav`,b.subarray(0,count+Math.round(.05*sr)));
}
const repaired=new Float32Array(length),fadeOnly=new Float32Array(baseline.length),ramp=Math.round(.006*sr);
for(const part of parts){for(let i=0;i<part.count;i++){
 repaired[part.offset+i]+=part.b[i];
 if(part.offset+i<fadeOnly.length)fadeOnly[part.offset+i]+=part.a[i]*Math.min(1,(part.count-1-i)/ramp);
}}
wav('crystal-envelope-candidate.wav',repaired);wav('crystal-endfade-only.wav',fadeOnly);
let max=0;for(const x of repaired){if(!Number.isFinite(x))throw Error('Nonfinite candidate');max=Math.max(max,Math.abs(x));}
const report={scope:`${target} preset ${config.preset} / VR ${config.ring}, captured notification renderer. Candidate changes exist only inside this audit process, not production.`,sourceSha256:manifest.cdn_sha256,
 baselineDuration:baseline.length/sr,candidateDuration:repaired.length/sr,candidatePeak:max,evidence,
 finding:'See per-note endpoints: nonzero termination during attack/decay produces discontinuities without interruption or polyphony exhaustion.',
 candidate:'Release both operators from their actual key-off level; allocate the full pitch-scaled tail. Compare the separate 6 ms end-fade-only version to isolate the termination discontinuity while preserving preceding envelope behavior.',
 caveat:'Offline waveform evidence and listening previews; user listening is needed to match the reported audible click. No production changes.'};
fs.writeFileSync(path.join(out,target+'-audit.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
