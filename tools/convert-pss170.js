#!/usr/bin/env node
/**
 * Convert PSS-170 patch bank JSON to 16-param arrays for the web synth engine.
 *
 * 21-param format:
 * [carrier_ratio, mod_ratio, mod_index, attack, decay, sustain, release,
 *  feedback, carrier_wave, mod_wave, tremolo_depth, chip_vibrato,
 *  ksr, ksl, mod_level, eg_type,
 *  mod_attack, mod_decay, mod_sustain, mod_release, mod_eg_type]
 */

const fs = require('fs');
const path = require('path');

const bankPath = path.resolve(__dirname, '..', 'app', 'YamaBruh', 'Banks', 'pss170.json');
const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'));

// Categories that get ksl = 1.5 (piano/keyboard family)
const PIANO_CATEGORIES = new Set([
  'Piano', 'Keyboard', 'Keys', 'Clavichord', 'Harpsichord', 'Celesta',
  'Vibraphone', 'Marimba', 'Xylophone', 'Bells', 'Music Box',
]);

// Categories that get ksl = 0 (synth/organ family)
const SYNTH_CATEGORIES = new Set([
  'Organ', 'Synth', 'Synthesizer', 'Pad', 'Lead',
]);

function getKsl(preset) {
  const cat = (preset.category || '').trim();
  const name = (preset.name || '').toLowerCase();

  // Check category first
  if (PIANO_CATEGORIES.has(cat)) return 1.5;
  if (SYNTH_CATEGORIES.has(cat)) return 0;

  // Fallback: check name keywords
  if (/piano|clav|harpsi|celest|vibra|marimba|xylo|bell|music.?box/i.test(name)) return 1.5;
  if (/organ|synth|pad|lead/i.test(name)) return 0;

  return 1.0; // default
}

function convertPreset(preset) {
  const p = preset.params;
  const c = p.carrier;
  const m = p.modulator;

  return [
    c.mult,                                          // carrier_ratio
    m.mult,                                          // mod_ratio
    p.modDepth,                                      // mod_index
    c.attack,                                        // attack
    Math.min(c.decay, 4.0),                          // decay (capped)
    c.sustainLevel,                                  // sustain
    Math.min(c.release, 1.5),                        // release (capped)
    p.feedback,                                      // feedback
    c.waveform,                                      // carrier_wave
    m.waveform,                                      // mod_wave
    c.tremolo ? 0.5 : 0,                             // tremolo_depth
    c.vibrato ? 0.01 : 0,                            // chip_vibrato
    0.3,                                             // ksr (default)
    getKsl(preset),                                  // ksl
    1.0,                                             // mod_level
    c.sustained ? 0 : 1,                             // eg_type (carrier)
    m.attack,                                        // mod_attack
    Math.min(m.decay, 4.0),                          // mod_decay (capped)
    m.sustainLevel,                                  // mod_sustain
    Math.min(m.release, 1.5),                        // mod_release (capped)
    m.sustained ? 0 : 1,                             // mod_eg_type
  ];
}

function fmt(val) {
  // Format number: integers stay integer-looking with .0, floats keep precision
  if (Number.isInteger(val) || val === Math.floor(val)) {
    return val.toFixed(1);
  }
  // Trim trailing zeros but keep at least one decimal
  let s = val.toString();
  if (!s.includes('.')) s += '.0';
  return s;
}

function arrayToString(arr) {
  return arr.map(fmt).join(', ');
}

// --- Build output ---
const lines = { rust: [], js: [], names: [] };

bank.presets.forEach((preset, i) => {
  const arr = convertPreset(preset);
  const arrStr = arrayToString(arr);
  const name = preset.name;

  lines.rust.push(`            ${i} => [${arrStr}], // ${name}`);
  lines.js.push(`  [${arrStr}], // ${name}`);
  lines.names.push(`  "${name}",`);
});

const output = `
===============================================================================
  PSS-170 CONVERTED PRESETS — ${bank.presets.length} voices
  Generated ${new Date().toISOString()}
===============================================================================

────────────────────────────────────────────────────────────────────────────────
  RUST ARRAY (for lib.rs match arms)
  Format: [carrier_ratio, mod_ratio, mod_index, attack, decay, sustain, release,
           feedback, carrier_wave, mod_wave, tremolo_depth, chip_vibrato,
           ksr, ksl, mod_level, eg_type]
────────────────────────────────────────────────────────────────────────────────

${lines.rust.join('\n')}

────────────────────────────────────────────────────────────────────────────────
  JS PRESET ARRAY (for yamabruh-notify.js)
────────────────────────────────────────────────────────────────────────────────

const PSS170_PRESETS = [
${lines.js.join('\n')}
];

────────────────────────────────────────────────────────────────────────────────
  JS PRESET NAMES
────────────────────────────────────────────────────────────────────────────────

const PSS170_NAMES = [
${lines.names.join('\n')}
];
`.trimStart();

// Write to file and also print
const outPath = path.resolve(__dirname, 'pss170-converted.txt');
fs.writeFileSync(outPath, output, 'utf8');
console.log(`Written to ${outPath}`);
console.log(output);
