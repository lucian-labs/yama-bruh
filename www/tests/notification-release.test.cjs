// Render every notification patch at two sample rates; check exact allocation.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const code=fs.readFileSync(path.join(__dirname,'../yamabruh-notify.js'),'utf8');
const Player=new Function(code+';return YamaBruhNotify;')();
let rendered=0;
for(const sr of [44100,48000])for(let preset=0;preset<100;preset++){
 const p=new Player({seed:'vr.elijahlucian.ca',volume:.5});p.sampleRate=sr;
 p.ctx={state:'running',destination:{},createBuffer(c,n){const data=new Float32Array(n);return {data,getChannelData(){return data;}};},createBufferSource(){return {connect(){},start(){},stop(){}};}};
 const render=p._renderNote;
 p._renderNote=function(freq,duration,patch,buf,offset,velocity){
  const factor=(patch[12]||0)>0?Math.pow(2,-patch[12]*Math.log2(freq/440)):1;
  const expected=Math.floor((duration+patch[6]*factor)*sr);
  assert.ok(buf.length-offset>=expected,`truncated preset ${preset}`);
  if(preset===72||preset===88){
   const isolated=new Float32Array(expected);
   render.call(this,freq,duration,patch,isolated,0,velocity);
   assert.ok(Math.abs(isolated[expected-1])<.0001,`audible endpoint preset ${preset}`);
  }
  return render.call(this,freq,duration,patch,buf,offset,velocity);
 };
 const ring=preset===72?'ringtones-22':preset===88?'ringtones-27':'release-test';
 const data=p.play(ring,{preset}).buffer.data;
 assert.ok(data.every(Number.isFinite));rendered++;
}
console.log(`${rendered} notification renders: finite PCM, complete release allocation; Crystal and Human Voice 3 endpoints below 0.0001.`);
