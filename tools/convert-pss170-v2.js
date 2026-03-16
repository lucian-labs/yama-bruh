#!/usr/bin/env node
// Convert pss170.json raw register dumps to 21-param YAMABRUH_PRESETS format
// Passes through values directly — no clamping or reinterpretation

const data = require('../app/YamaBruh/Banks/pss170.json');

// 21-param format:
// [cr, mr, mi, atk, dec, sus, rel, fb, c_wave, m_wave, trem, chip_vib, ksr, ksl, mod_lvl, eg_type, m_atk, m_dec, m_sus, m_rel, m_eg_type]

const presets = [];
const names = [];

for (const p of data.presets) {
  const c = p.params.carrier;
  const m = p.params.modulator;

  const params = [
    c.mult,                           // 0: carrier ratio
    m.mult,                           // 1: mod ratio
    p.params.modDepth,                // 2: mod index (FM depth)
    c.attack,                         // 3: carrier attack
    c.decay,                          // 4: carrier decay
    c.sustainLevel,                   // 5: carrier sustain level
    c.release,                        // 6: carrier release
    p.params.feedback,                // 7: feedback
    c.waveform,                       // 8: carrier waveform
    m.waveform,                       // 9: mod waveform
    c.tremolo ? 0.5 : 0,             // 10: tremolo depth
    c.vibrato ? 0.5 : 0,             // 11: chip vibrato
    0.3,                              // 12: KSR (fixed)
    c.sustained ? 1.5 : (c.mult >= 3 ? 1.5 : 1.0), // 13: KSL
    1.0,                              // 14: mod level (fixed)
    c.sustained ? 0 : 1,             // 15: eg type (0=sustained, 1=percussive)
    m.attack,                         // 16: mod attack
    m.decay,                          // 17: mod decay
    m.sustainLevel,                   // 18: mod sustain level
    m.release,                        // 19: mod release
    m.sustained ? 0 : 1,             // 20: mod eg type
  ];

  presets.push(params);
  names.push(p.name);
}

// Output JS format
console.log('// ── YAMABRUH_PRESETS (PSS-170 raw values) ──');
console.log('// [cr, mr, mi, atk, dec, sus, rel, fb, c_wave, m_wave, trem, chip_vib, ksr, ksl, mod_lvl, eg_type, m_atk, m_dec, m_sus, m_rel, m_eg_type]');
console.log('const YAMABRUH_PRESETS = [');
presets.forEach((p, i) => {
  console.log('  [' + p.join(', ') + '], // ' + names[i]);
});
console.log('];');

console.log('\n// ── PRESET_NAMES ──');
console.log('const PRESET_NAMES = [');
for (let i = 0; i < names.length; i += 10) {
  const chunk = names.slice(i, i + 10).map(n => "'" + n + "'").join(',');
  console.log('  ' + chunk + ',');
}
console.log('];');

// Min/max analysis for fader ranges
console.log('\n// ── MIN/MAX ANALYSIS ──');
const labels = ['cr','mr','mi','atk','dec','sus','rel','fb','cWave','mWave','trem','chipVib','ksr','ksl','modLvl','egType','mAtk','mDec','mSus','mRel','mEgType'];
for (let i = 0; i < 21; i++) {
  const vals = presets.map(p => p[i]);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const unique = [...new Set(vals)].sort((a,b) => a-b);
  console.log(`// ${labels[i]}: min=${min} max=${max} (${unique.length} unique)`);
}
