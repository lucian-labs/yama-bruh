#![cfg_attr(target_arch = "wasm32", no_std)]

#[cfg(target_arch = "wasm32")]
use core::panic::PanicInfo;
use libm::{log2f, powf, sinf};

#[cfg(target_arch = "wasm32")]
#[panic_handler]
fn panic(_: &PanicInfo) -> ! {
    loop {}
}

const TWO_PI: f32 = 6.28318530717959;
const HALF_PI: f32 = 1.5707963;
const MAX_SAMPLES: usize = 441000; // 10s @ 44100
const MAX_NOTES: usize = 10;

static mut SAMPLE_BUF: [f32; MAX_SAMPLES] = [0.0; MAX_SAMPLES];
static mut SAMPLE_LEN: u32 = 0;
static mut NOTE_BUF: [f32; MAX_NOTES * 2] = [0.0; MAX_NOTES * 2];
static mut NOTE_COUNT: u32 = 0;
static mut CUSTOM_PRESET: [f32; 16] = [1.0, 1.0, 2.0, 0.01, 0.3, 0.3, 0.2, 0.0, 0.0,0.0, 0.0,0.0, 0.0,0.0, 1.0,0.0];
static mut INPUT_BUF: [u8; 1024] = [0; 1024];

// Global effects state
static mut VIBRATO_ON: bool = false;
static mut VIBRATO_RATE: f32 = 5.5;
static mut VIBRATO_DEPTH: f32 = 0.004;
static mut SUSTAIN_ON: bool = false;
static mut SUSTAIN_MULT: f32 = 3.0;

// ── PRNG ──────────────────────────────────────────────────────────────
struct Rng(u32);

impl Rng {
    fn new(seed: u32) -> Self {
        Self(if seed == 0 { 1 } else { seed })
    }
    fn next(&mut self) -> u32 {
        self.0 ^= self.0 << 13;
        self.0 ^= self.0 >> 17;
        self.0 ^= self.0 << 5;
        self.0
    }
    fn range(&mut self, n: u32) -> u32 {
        self.next() % n
    }
}

// ── Helpers ───────────────────────────────────────────────────────────
fn midi_to_freq(note: f32) -> f32 {
    440.0 * powf(2.0, (note - 69.0) / 12.0)
}

// ── YM2413 Waveform Types ─────────────────────────────────────────────
// 0=sine, 1=half-sine (rectified +), 2=abs-sine (full-wave rect), 3=quarter-sine
fn waveform(phase: f32, wtype: u32) -> f32 {
    match wtype {
        1 => {
            let s = sinf(phase);
            if s > 0.0 { s } else { 0.0 }
        }
        2 => {
            let s = sinf(phase);
            if s < 0.0 { -s } else { s }
        }
        3 => {
            let p = phase % TWO_PI;
            let p = if p < 0.0 { p + TWO_PI } else { p };
            if p < HALF_PI { sinf(p) } else { 0.0 }
        }
        _ => sinf(phase),
    }
}

// ── 100 Presets — Yamaha PSS-170 Voice Map (YM2413 Extended) ──────────
// [carrier_ratio, mod_ratio, mod_index, attack, decay, sustain, release, feedback,
//  carrier_wave, mod_wave, tremolo_depth, chip_vibrato, ksr, ksl, mod_level, eg_type]
//
// Waveforms: 0=sine, 1=half-sine, 2=abs-sine, 3=quarter-sine
// Tremolo: AM depth at 3.7Hz (0=off, 0.3=subtle, 1.0=deep)
// Chip vibrato: pitch mod depth at 6.4Hz (0=off, 0.007=7cents, 0.014=14cents)
// KSR: envelope rate scaling with pitch (0=off, 0.3=subtle, 1.0=strong)
// KSL: volume attenuation dB/octave above A4 (0=off, 1.5/3.0/6.0)
// Mod level: modulator output scale 0-1 (1.0=full)
// EG type: 0=sustained (hold at sustain), 1=percussive (decay through sustain)
pub fn get_preset_data(index: u32) -> [f32; 16] {
    match index {
        // ── 00-09: Piano / Keys ──────────────────────────────────────
        //                cr    mr    mi    atk    dec   sus   rel   fb     cw  mw  trem  vib   ksr  ksl  mlvl  eg
        0  => [1.0,  1.0,  1.8,  0.001, 0.8,  0.15, 0.4,  0.0,   0.0,0.0, 0.0,0.0,  0.3,1.5, 1.0,0.0], // Piano 1
        1  => [1.0,  2.0,  2.5,  0.001, 0.6,  0.2,  0.35, 0.0,   0.0,0.0, 0.0,0.0,  0.3,1.5, 1.0,0.0], // Piano 2
        2  => [1.0,  3.0,  3.5,  0.001, 0.4,  0.25, 0.3,  0.05,  0.0,0.0, 0.0,0.0,  0.3,1.5, 1.0,0.0], // Honky-Tonk Piano
        3  => [1.0,  1.0,  1.2,  0.002, 1.0,  0.3,  0.5,  0.0,   0.0,0.0, 0.0,0.0,  0.2,1.0, 1.0,0.0], // Electric Piano 1
        4  => [1.0,  7.0,  2.0,  0.001, 0.7,  0.12, 0.6,  0.0,   0.0,0.0, 0.0,0.0,  0.2,1.0, 1.0,0.0], // Electric Piano 2
        5  => [1.0,  3.0,  3.0,  0.001, 0.3,  0.0,  0.2,  0.02,  1.0,0.0, 0.0,0.0,  0.4,1.5, 1.0,1.0], // Harpsichord 1
        6  => [1.0,  4.0,  3.5,  0.001, 0.25, 0.0,  0.18, 0.04,  1.0,0.0, 0.0,0.0,  0.4,1.5, 1.0,1.0], // Harpsichord 2
        7  => [1.0,  5.0,  2.8,  0.001, 0.35, 0.0,  0.22, 0.06,  1.0,0.0, 0.0,0.0,  0.4,1.5, 1.0,1.0], // Harpsichord 3
        8  => [1.0,  5.0,  4.5,  0.001, 0.15, 0.05, 0.08, 0.1,   1.0,1.0, 0.0,0.0,  0.5,1.5, 1.0,1.0], // Honky-Tonk Clavi
        9  => [1.0,  13.0, 1.5,  0.001, 1.5,  0.0,  2.0,  0.0,   0.0,0.0, 0.0,0.0,  0.0,0.0, 0.8,1.0], // Glass Celesta

        // ── 10-19: Organ ─────────────────────────────────────────────
        10 => [1.0,  1.0,  0.6,  0.01,  0.05, 0.85, 0.1,  0.05,  0.0,0.0, 0.35,0.0, 0.0,0.0, 1.0,0.0], // Reed Organ
        11 => [1.0,  1.0,  0.4,  0.015, 0.08, 0.75, 0.15, 0.03,  0.0,0.0, 0.3,0.0,  0.0,0.0, 1.0,0.0], // Pipe Organ 1
        12 => [1.0,  2.0,  0.8,  0.012, 0.06, 0.8,  0.12, 0.06,  0.0,0.0, 0.3,0.0,  0.0,0.0, 1.0,0.0], // Pipe Organ 2
        13 => [1.0,  2.0,  2.5,  0.003, 0.02, 0.95, 0.04, 0.2,   0.0,0.0, 0.4,0.0,  0.0,0.0, 1.0,0.0], // Electronic Organ 1
        14 => [1.0,  4.0,  2.2,  0.003, 0.02, 0.88, 0.04, 0.1,   0.0,0.0, 0.4,0.0,  0.0,0.0, 1.0,0.0], // Electronic Organ 2
        15 => [1.0,  1.0,  1.5,  0.005, 0.02, 0.9,  0.05, 0.12,  0.0,0.0, 0.5,0.0,  0.0,0.0, 1.0,0.0], // Jazz Organ
        16 => [1.0,  3.0,  1.2,  0.008, 0.05, 0.8,  0.08, 0.25,  0.0,0.0, 0.45,0.005, 0.0,0.0, 1.0,0.0], // Accordion
        17 => [1.0,  4.0,  2.0,  0.001, 2.5,  0.05, 3.0,  0.0,   0.0,0.0, 0.2,0.0,  0.0,0.0, 1.0,0.0], // Vibraphone
        18 => [1.0,  4.0,  4.0,  0.001, 0.6,  0.0,  0.5,  0.02,  2.0,0.0, 0.0,0.0,  0.4,1.5, 1.0,1.0], // Marimba 1
        19 => [1.0,  3.0,  3.5,  0.001, 0.5,  0.0,  0.4,  0.03,  2.0,0.0, 0.0,0.0,  0.4,1.5, 1.0,1.0], // Marimba 2

        // ── 20-29: Brass ─────────────────────────────────────────────
        20 => [1.0,  1.0,  4.0,  0.04,  0.15, 0.7,  0.2,  0.2,   0.0,1.0, 0.0,0.005, 0.0,0.0, 1.0,0.0], // Trumpet
        21 => [1.0,  1.0,  2.0,  0.03,  0.12, 0.4,  0.15, 0.1,   0.0,0.0, 0.0,0.0,  0.0,0.0, 0.7,0.0], // Mute Trumpet
        22 => [1.0,  1.0,  3.5,  0.06,  0.2,  0.65, 0.3,  0.25,  0.0,1.0, 0.0,0.005, 0.0,0.0, 1.0,0.0], // Trombone
        23 => [1.0,  1.0,  2.8,  0.07,  0.25, 0.55, 0.35, 0.2,   0.0,0.0, 0.0,0.003, 0.0,0.0, 0.8,0.0], // Soft Trombone
        24 => [1.0,  1.0,  2.5,  0.08,  0.25, 0.6,  0.4,  0.15,  0.0,0.0, 0.0,0.005, 0.0,0.0, 1.0,0.0], // Horn
        25 => [1.0,  1.0,  1.8,  0.12,  0.3,  0.5,  0.5,  0.08,  0.0,0.0, 0.0,0.007, 0.0,0.0, 1.0,0.0], // Alpenhorn
        26 => [0.5,  1.0,  3.0,  0.06,  0.2,  0.6,  0.3,  0.2,   0.0,1.0, 0.0,0.0,  0.0,0.0, 1.0,0.0], // Tuba
        27 => [1.0,  1.0,  5.0,  0.05,  0.15, 0.75, 0.25, 0.3,   1.0,1.0, 0.0,0.004, 0.0,0.0, 1.0,0.0], // Brass Ensemble 1
        28 => [1.0,  2.0,  4.5,  0.03,  0.1,  0.8,  0.2,  0.18,  1.0,0.0, 0.0,0.004, 0.0,0.0, 1.0,0.0], // Brass Ensemble 2
        29 => [1.0,  3.0,  6.0,  0.02,  0.08, 0.85, 0.15, 0.22,  1.0,0.0, 0.0,0.004, 0.0,0.0, 1.0,0.0], // Brass Ensemble 3

        // ── 30-39: Woodwind ──────────────────────────────────────────
        30 => [2.0,  1.0,  1.0,  0.02,  0.05, 0.7,  0.1,  0.05,  0.0,0.0, 0.0,0.005, 0.0,0.0, 1.0,0.0], // Flute
        31 => [2.0,  1.0,  0.5,  0.03,  0.06, 0.6,  0.12, 0.02,  0.0,0.0, 0.0,0.006, 0.0,0.0, 1.0,0.0], // Panflute
        32 => [2.0,  1.0,  1.8,  0.01,  0.04, 0.75, 0.08, 0.08,  0.0,0.0, 0.0,0.004, 0.0,0.0, 1.0,0.0], // Piccolo
        33 => [1.0,  3.0,  3.0,  0.015, 0.06, 0.65, 0.08, 0.2,   0.0,1.0, 0.0,0.005, 0.0,0.0, 1.0,0.0], // Clarinet
        34 => [0.5,  3.0,  2.5,  0.02,  0.08, 0.6,  0.1,  0.18,  0.0,1.0, 0.0,0.004, 0.0,0.0, 1.0,0.0], // Bass Clarinet
        35 => [1.0,  2.0,  4.0,  0.02,  0.08, 0.6,  0.1,  0.15,  0.0,1.0, 0.0,0.005, 0.0,0.0, 1.0,0.0], // Oboe
        36 => [0.5,  1.0,  3.5,  0.03,  0.1,  0.55, 0.12, 0.2,   0.0,1.0, 0.0,0.004, 0.0,0.0, 1.0,0.0], // Bassoon
        37 => [1.0,  2.0,  3.5,  0.025, 0.07, 0.65, 0.1,  0.22,  0.0,1.0, 0.0,0.006, 0.0,0.0, 1.0,0.0], // Saxophone
        38 => [1.0,  3.0,  2.0,  0.02,  0.04, 0.8,  0.08, 0.35,  0.0,1.0, 0.15,0.005, 0.0,0.0, 1.0,0.0], // Bagpipe
        39 => [1.0,  2.0,  2.5,  0.02,  0.06, 0.7,  0.1,  0.12,  0.0,0.0, 0.0,0.005, 0.0,0.0, 1.0,0.0], // Woodwinds

        // ── 40-49: Strings / Bass / Plucked ──────────────────────────
        40 => [1.0,  2.0,  1.0,  0.15,  0.5,  0.7,  0.8,  0.02,  0.0,0.0, 0.12,0.007, 0.0,0.0, 1.0,0.0], // Violin 1
        41 => [1.0,  2.0,  1.5,  0.12,  0.4,  0.65, 0.7,  0.04,  0.0,0.0, 0.12,0.007, 0.0,0.0, 1.0,0.0], // Violin 2
        42 => [0.5,  2.0,  1.2,  0.1,   0.5,  0.6,  0.8,  0.03,  0.0,0.0, 0.1,0.005, 0.0,0.0, 1.0,0.0], // Cello
        43 => [1.0,  2.0,  0.8,  0.2,   0.6,  0.7,  1.0,  0.02,  0.0,0.0, 0.15,0.006, 0.0,0.0, 1.0,0.0], // Strings
        44 => [1.0,  1.0,  2.0,  0.001, 0.3,  0.2,  0.12, 0.05,  0.0,0.0, 0.0,0.0,  0.0,3.0, 1.0,0.0], // Electric Bass
        45 => [1.0,  1.0,  5.0,  0.001, 0.08, 0.05, 0.06, 0.2,   1.0,0.0, 0.0,0.0,  0.5,3.0, 1.0,1.0], // Slap Bass
        46 => [1.0,  1.0,  0.8,  0.005, 0.4,  0.35, 0.2,  0.0,   0.0,0.0, 0.0,0.0,  0.0,1.5, 1.0,0.0], // Wood Bass
        47 => [0.5,  1.0,  4.0,  0.001, 0.2,  0.25, 0.1,  0.15,  0.0,1.0, 0.0,0.0,  0.0,3.0, 1.0,0.0], // Synth Bass
        48 => [1.0,  3.0,  3.5,  0.001, 0.15, 0.0,  0.08, 0.1,   1.0,0.0, 0.0,0.0,  0.5,1.5, 1.0,1.0], // Banjo
        49 => [1.0,  4.0,  2.5,  0.001, 0.2,  0.0,  0.1,  0.06,  0.0,0.0, 0.0,0.0,  0.4,1.5, 1.0,1.0], // Mandolin

        // ── 50-59: Guitar / Plucked / Folk ───────────────────────────
        50 => [1.0,  2.0,  1.8,  0.001, 0.5,  0.1,  0.3,  0.03,  0.0,0.0, 0.0,0.0,  0.3,1.5, 1.0,0.0], // Classic Guitar
        51 => [1.0,  3.0,  2.2,  0.001, 0.35, 0.08, 0.25, 0.06,  0.0,0.0, 0.0,0.0,  0.3,1.5, 1.0,0.0], // Jazz Guitar
        52 => [1.0,  2.0,  2.5,  0.001, 0.4,  0.05, 0.2,  0.04,  0.0,0.0, 0.0,0.0,  0.3,1.5, 1.0,0.0], // Folk Guitar
        53 => [1.0,  1.0,  1.5,  0.001, 0.8,  0.15, 0.5,  0.02,  0.0,0.0, 0.0,0.006, 0.0,1.0, 1.0,0.0], // Hawaiian Guitar
        54 => [1.0,  5.0,  2.0,  0.001, 0.2,  0.0,  0.15, 0.05,  0.0,0.0, 0.0,0.0,  0.4,1.5, 1.0,1.0], // Ukulele
        55 => [1.0,  2.0,  3.0,  0.001, 0.6,  0.0,  0.4,  0.08,  1.0,0.0, 0.0,0.0,  0.3,1.5, 1.0,1.0], // Koto
        56 => [1.0,  3.0,  4.0,  0.001, 0.3,  0.0,  0.2,  0.1,   1.0,0.0, 0.0,0.0,  0.4,1.5, 1.0,1.0], // Shamisen
        57 => [1.0,  7.0,  1.5,  0.001, 1.5,  0.0,  1.8,  0.01,  0.0,0.0, 0.0,0.0,  0.0,0.0, 0.8,1.0], // Harp
        58 => [1.0,  1.0,  2.5,  0.02,  0.08, 0.7,  0.1,  0.3,   0.0,0.0, 0.25,0.006, 0.0,0.0, 1.0,0.0], // Harmonica
        59 => [1.0,  7.0,  2.5,  0.001, 1.5,  0.0,  2.0,  0.01,  0.0,0.0, 0.0,0.0,  0.0,0.0, 0.7,1.0], // Music Box

        // ── 60-69: Combo / Synth ─────────────────────────────────────
        60 => [1.0,  4.0,  4.5,  0.03,  0.4,  0.5,  0.3,  0.15,  0.0,0.0, 0.2,0.0,  0.0,0.0, 1.0,0.0], // Brass & Marimba
        61 => [2.0,  3.0,  2.0,  0.01,  0.3,  0.4,  0.25, 0.05,  0.0,0.0, 0.0,0.0,  0.0,0.0, 1.0,0.0], // Flute & Harpsichord
        62 => [1.0,  4.0,  3.0,  0.02,  0.5,  0.3,  0.4,  0.1,   0.0,0.0, 0.15,0.0, 0.0,0.0, 1.0,0.0], // Oboe & Vibraphone
        63 => [1.0,  7.0,  2.0,  0.02,  0.6,  0.35, 0.5,  0.08,  0.0,0.0, 0.0,0.0,  0.0,0.0, 0.8,0.0], // Clarinet & Harp
        64 => [1.0,  1.41, 5.0,  0.1,   0.5,  0.5,  0.6,  0.06,  0.0,0.0, 0.1,0.006, 0.0,0.0, 1.0,0.0], // Violin & Steel Drum
        65 => [1.0,  1.0,  3.0,  0.05,  0.3,  0.7,  0.4,  0.4,   0.0,0.0, 0.0,0.015, 0.0,0.0, 1.0,0.0], // Handsaw
        66 => [1.0,  2.0,  4.5,  0.02,  0.06, 0.85, 0.12, 0.18,  1.0,1.0, 0.0,0.0,  0.0,0.0, 1.0,0.0], // Synth Brass
        67 => [1.0,  7.0,  6.0,  0.01,  0.08, 0.7,  0.15, 0.3,   0.0,2.0, 0.0,0.0,  0.0,0.0, 1.0,0.0], // Metallic Synth
        68 => [1.0,  1.0,  0.0,  0.01,  0.02, 0.9,  0.1,  0.0,   0.0,0.0, 0.0,0.0,  0.0,0.0, 1.0,0.0], // Sine Wave
        69 => [1.0,  1.0,  2.5,  0.001, 0.01, 0.8,  0.8,  0.1,   0.0,1.0, 0.0,0.0,  0.0,0.0, 1.0,0.0], // Reverse

        // ── 70-79: Human Voice / Nature ──────────────────────────────
        70 => [1.0,  1.0,  0.8,  0.08,  0.15, 0.65, 0.3,  0.5,   0.0,0.0, 0.15,0.008, 0.0,0.0, 1.0,0.0], // Human Voice 1
        71 => [1.0,  2.0,  1.2,  0.06,  0.2,  0.6,  0.35, 0.45,  0.0,1.0, 0.15,0.007, 0.0,0.0, 1.0,0.0], // Human Voice 2
        72 => [1.0,  3.0,  0.6,  0.1,   0.25, 0.55, 0.4,  0.55,  0.0,0.0, 0.2,0.007, 0.0,0.0, 1.0,0.0], // Human Voice 3
        73 => [1.0,  1.0,  0.3,  0.15,  0.3,  0.4,  0.5,  0.6,   0.0,0.0, 0.1,0.005, 0.0,0.0, 0.6,0.0], // Whisper
        74 => [2.0,  1.0,  0.8,  0.02,  0.05, 0.7,  0.1,  0.15,  0.0,0.0, 0.0,0.008, 0.0,0.0, 1.0,0.0], // Whistle
        75 => [1.0,  0.5,  4.0,  0.08,  0.3,  0.5,  0.4,  0.7,   0.0,0.0, 0.3,0.0,  0.0,0.0, 1.0,0.0], // Gurgle
        76 => [1.0,  0.25, 3.0,  0.05,  0.4,  0.3,  0.5,  0.6,   0.0,0.0, 0.25,0.0, 0.0,0.0, 1.0,0.0], // Bubble
        77 => [1.0,  13.0, 1.0,  0.001, 1.5,  0.0,  2.0,  0.0,   0.0,0.0, 0.0,0.0,  0.5,1.5, 0.8,1.0], // Raindrop
        78 => [1.0,  7.0,  5.0,  0.001, 0.06, 0.0,  0.04, 0.15,  3.0,0.0, 0.0,0.0,  0.5,0.0, 1.0,1.0], // Popcorn
        79 => [1.0,  11.0, 2.0,  0.001, 0.8,  0.0,  1.0,  0.0,   0.0,0.0, 0.0,0.0,  0.3,0.0, 0.8,1.0], // Drip

        // ── 80-89: SFX / Novelty ─────────────────────────────────────
        80 => [1.0,  0.99, 8.0,  0.01,  0.3,  0.5,  0.4,  0.8,   0.0,1.0, 0.3,0.01, 0.0,0.0, 1.0,0.0], // Dog Pianist
        81 => [2.0,  0.5,  6.0,  0.001, 0.08, 0.3,  0.06, 0.5,   1.0,0.0, 0.0,0.0,  0.5,0.0, 1.0,1.0], // Duck
        82 => [1.0,  5.0,  2.0,  0.001, 0.6,  0.0,  0.8,  0.02,  0.0,0.0, 0.0,0.0,  0.0,0.0, 0.7,1.0], // Babydoll
        83 => [1.0,  11.0, 3.0,  0.001, 0.05, 0.0,  0.02, 0.0,   2.0,0.0, 0.0,0.0,  0.6,0.0, 1.0,1.0], // Telephone Bell
        84 => [1.0,  1.0,  6.0,  0.001, 0.02, 0.9,  0.02, 0.4,   1.0,1.0, 0.5,0.0,  0.0,0.0, 1.0,0.0], // Emergency Alarm
        85 => [1.0,  0.1,  12.0, 0.001, 0.5,  0.0,  0.8,  0.7,   0.0,0.0, 0.0,0.02, 0.0,0.0, 1.0,1.0], // Leaf Spring
        86 => [1.0,  5.0,  4.0,  0.15,  1.0,  0.5,  2.0,  0.08,  0.0,0.0, 0.0,0.01, 0.0,0.0, 1.0,0.0], // Comet
        87 => [1.0,  0.5,  10.0, 0.001, 0.6,  0.0,  1.5,  0.6,   1.0,1.0, 0.0,0.0,  0.0,0.0, 1.0,1.0], // Fireworks
        88 => [1.0,  13.0, 2.5,  0.001, 2.0,  0.0,  2.5,  0.0,   0.0,0.0, 0.0,0.0,  0.0,0.0, 0.8,1.0], // Crystal
        89 => [1.0,  1.0,  5.0,  0.08,  0.8,  0.5,  1.5,  0.4,   0.0,1.0, 0.3,0.03, 0.0,0.0, 1.0,0.0], // Ghost — 6.4Hz chip vibrato = stepped pitch

        // ── 90-99: Percussion / FX ───────────────────────────────────
        90 => [1.0,  3.5,  5.0,  0.001, 2.0,  0.0,  2.5,  0.0,   2.0,0.0, 0.0,0.0,  0.5,0.0, 1.0,1.0], // Hand Bell
        91 => [1.0,  5.4,  3.0,  0.001, 1.5,  0.0,  2.0,  0.0,   2.0,0.0, 0.0,0.0,  0.4,0.0, 0.9,1.0], // Chimes
        92 => [1.0,  3.5,  4.0,  0.001, 1.8,  0.0,  2.2,  0.01,  2.0,0.0, 0.0,0.0,  0.4,0.0, 1.0,1.0], // Bell
        93 => [1.0,  1.41, 7.0,  0.001, 1.2,  0.0,  1.5,  0.05,  2.0,1.0, 0.0,0.0,  0.3,0.0, 1.0,1.0], // Steel Drum
        94 => [1.0,  0.7,  3.0,  0.001, 0.4,  0.0,  0.3,  0.02,  2.0,0.0, 0.0,0.0,  0.5,0.0, 1.0,1.0], // Cowbell
        95 => [1.0,  1.5,  8.0,  0.001, 0.3,  0.0,  0.2,  0.3,   0.0,1.0, 0.0,0.0,  0.5,0.0, 1.0,1.0], // Synth Tom 1
        96 => [0.5,  1.5,  6.0,  0.001, 0.4,  0.0,  0.25, 0.25,  0.0,1.0, 0.0,0.0,  0.5,0.0, 1.0,1.0], // Synth Tom 2
        97 => [1.0,  2.3,  10.0, 0.001, 0.12, 0.0,  0.08, 0.15,  3.0,1.0, 0.0,0.0,  0.6,0.0, 1.0,1.0], // Snare Drum
        98 => [1.0,  0.1,  15.0, 0.001, 0.04, 0.0,  0.03, 0.8,   3.0,1.0, 0.0,0.0,  0.8,0.0, 1.0,1.0], // Machine Gun
        99 => [1.0,  7.0,  3.0,  0.3,   2.0,  0.3,  3.0,  0.1,   0.0,0.0, 0.2,0.01, 0.0,0.0, 1.0,0.0], // Wave
        _  => [1.0,  1.0,  2.0,  0.01,  0.3,  0.3,  0.2,  0.0,   0.0,0.0, 0.0,0.0,  0.0,0.0, 1.0,0.0], // fallback
    }
}

// ── FM Synthesis Core (YM2413 Extended) ───────────────────────────────
fn render_fm_note(
    freq: f32,
    duration: f32,
    preset: &[f32; 16],
    sample_rate: f32,
    buf: &mut [f32],
    offset: usize,
    velocity: f32,
) -> usize {
    let cr = preset[0];
    let mr = preset[1];
    let mi = preset[2];
    let attack_base = preset[3];
    let decay_base = preset[4];
    let sustain = preset[5];
    let release_base = unsafe { if SUSTAIN_ON { preset[6] * SUSTAIN_MULT } else { preset[6] } };
    let feedback = preset[7];
    let c_wave = preset[8] as u32;
    let m_wave = preset[9] as u32;
    let trem_depth = preset[10];
    let chip_vib = preset[11];
    let ksr = preset[12];
    let ksl = preset[13];
    let mod_level = preset[14];
    let eg_type = preset[15];

    let (vibrato_on, vib_rate, vib_depth) = unsafe {
        (VIBRATO_ON, VIBRATO_RATE, VIBRATO_DEPTH)
    };

    // KSR: scale envelope times with pitch (higher pitch = faster envelopes)
    let ksr_factor = if ksr > 0.0 {
        let octave = log2f(freq / 440.0);
        powf(2.0, -ksr * octave)
    } else {
        1.0
    };
    let attack = attack_base * ksr_factor;
    let decay = decay_base * ksr_factor;
    let release = release_base * ksr_factor;

    // KSL: volume attenuation above A4 (dB per octave)
    let ksl_atten = if ksl > 0.0 {
        let octave = log2f(freq / 440.0);
        if octave > 0.0 {
            powf(10.0, -ksl * octave / 20.0)
        } else {
            1.0
        }
    } else {
        1.0
    };

    let carrier_freq = freq * cr;
    let mod_freq = freq * mr;

    let total_samples = ((duration + release) * sample_rate) as usize;
    let note_samples = (duration * sample_rate) as usize;
    let attack_samples = (attack * sample_rate) as usize;
    let decay_samples = (decay * sample_rate) as usize;

    let mut carrier_phase: f32 = 0.0;
    let mut mod_phase: f32 = 0.0;
    let mut prev_mod: f32 = 0.0;

    let available = if offset < buf.len() {
        buf.len() - offset
    } else {
        return 0;
    };
    let count = if total_samples < available {
        total_samples
    } else {
        available
    };

    let mut i = 0;
    while i < count {
        let t = i as f32 / sample_rate;

        // ADSR envelope
        let env = if i < attack_samples {
            i as f32 / (if attack_samples > 0 { attack_samples } else { 1 }) as f32
        } else if i < attack_samples + decay_samples {
            let dt = (i - attack_samples) as f32
                / (if decay_samples > 0 { decay_samples } else { 1 }) as f32;
            1.0 - (1.0 - sustain) * dt
        } else if i < note_samples {
            // EG type: 0=sustained (hold at sustain), 1=percussive (continue decaying)
            if eg_type > 0.5 {
                // Percussive: decay through sustain toward zero
                let elapsed = (i - attack_samples - decay_samples) as f32 / sample_rate;
                let perc_decay = sustain * powf(0.5, elapsed / (decay_base * 2.0 + 0.01));
                if perc_decay > 0.001 { perc_decay } else { 0.0 }
            } else {
                sustain
            }
        } else {
            let rel_max = if release * sample_rate > 1.0 {
                release * sample_rate
            } else {
                1.0
            };
            let dt = (i - note_samples) as f32 / rel_max;
            let r = sustain * (1.0 - dt);
            if r > 0.0 { r } else { 0.0 }
        };

        // YM2413 Tremolo: AM at 3.7Hz
        let trem = if trem_depth > 0.0 {
            1.0 - trem_depth * (1.0 + sinf(TWO_PI * 3.7 * t)) * 0.5
        } else {
            1.0
        };

        // YM2413 Chip Vibrato: pitch mod at 6.4Hz
        let chip_vib_mod = if chip_vib > 0.0 {
            chip_vib * sinf(TWO_PI * 6.4 * t)
        } else {
            0.0
        };

        // Global vibrato LFO (user-controlled, separate from chip vibrato)
        let global_vib = if vibrato_on {
            sinf(TWO_PI * vib_rate * t) * vib_depth
        } else {
            0.0
        };

        let freq_mult = 1.0 + chip_vib_mod + global_vib;

        // 2-op FM with YM2413 waveforms and mod level
        let mod_signal = waveform(mod_phase + feedback * prev_mod, m_wave) * mod_level;
        prev_mod = mod_signal;
        let carrier_signal = waveform(carrier_phase + mi * mod_signal, c_wave);

        buf[offset + i] += carrier_signal * env * velocity * 0.45 * trem * ksl_atten;

        carrier_phase += TWO_PI * carrier_freq * freq_mult / sample_rate;
        mod_phase += TWO_PI * mod_freq * freq_mult / sample_rate;

        if carrier_phase > TWO_PI {
            carrier_phase -= TWO_PI;
        }
        if mod_phase > TWO_PI {
            mod_phase -= TWO_PI;
        }

        i += 1;
    }

    count
}

// ── Exported API ──────────────────────────────────────────────────────

#[no_mangle]
pub extern "C" fn get_sample_buffer_ptr() -> *const f32 {
    unsafe { SAMPLE_BUF.as_ptr() }
}

#[no_mangle]
pub extern "C" fn get_note_buffer_ptr() -> *const f32 {
    unsafe { NOTE_BUF.as_ptr() }
}

#[no_mangle]
pub extern "C" fn get_input_buffer_ptr() -> *mut u8 {
    unsafe { INPUT_BUF.as_mut_ptr() }
}

#[no_mangle]
pub extern "C" fn get_sample_len() -> u32 {
    unsafe { SAMPLE_LEN }
}

#[no_mangle]
pub extern "C" fn get_note_count() -> u32 {
    unsafe { NOTE_COUNT }
}

#[no_mangle]
pub extern "C" fn get_preset_param(preset: u32, param: u32) -> f32 {
    let idx = if preset > 99 { 99 } else { preset };
    let pidx = if param > 15 { 15 } else { param };
    let p = get_preset_data(idx);
    p[pidx as usize]
}

#[no_mangle]
pub extern "C" fn set_custom_param(param: u32, value: f32) {
    let pidx = if param > 15 { 15 } else { param };
    unsafe {
        CUSTOM_PRESET[pidx as usize] = value;
    }
}

#[no_mangle]
pub extern "C" fn set_vibrato(on: u32, rate: f32, depth: f32) {
    unsafe {
        VIBRATO_ON = on != 0;
        if rate > 0.0 { VIBRATO_RATE = rate; }
        if depth >= 0.0 { VIBRATO_DEPTH = depth; }
    }
}

#[no_mangle]
pub extern "C" fn set_sustain(on: u32, mult: f32) {
    unsafe {
        SUSTAIN_ON = on != 0;
        if mult > 0.0 { SUSTAIN_MULT = mult; }
    }
}

/// Hash a string in INPUT_BUF to a u32 seed (djb2)
#[no_mangle]
pub extern "C" fn hash_input(len: u32) -> u32 {
    let n = if len > 1024 { 1024 } else { len };
    let mut hash: u32 = 5381;
    unsafe {
        let mut i: u32 = 0;
        while i < n {
            let c = INPUT_BUF[i as usize] as u32;
            hash = (hash.wrapping_shl(5).wrapping_add(hash)).wrapping_add(c);
            i += 1;
        }
    }
    hash
}

/// Generate a note sequence from seed. Returns note count.
/// Writes pairs of [midi_note, duration_beats] into NOTE_BUF.
#[no_mangle]
pub extern "C" fn generate_sequence(seed: u32, num_notes: u32) -> u32 {
    let n = if num_notes > MAX_NOTES as u32 {
        MAX_NOTES as u32
    } else if num_notes < 3 {
        3
    } else {
        num_notes
    };

    let mut rng = Rng::new(seed);

    // Start on F# in a random octave (F#3=54, F#4=66, F#5=78)
    let octave_offset = rng.range(3) * 12;
    let mut current_note: i32 = 54 + octave_offset as i32;

    // Relative movements: 0, ±2, ±3, ±4, ±6
    let movements: [i32; 9] = [0, 2, -2, 3, -3, 4, -4, 6, -6];
    // Duration options in beats
    let durations: [f32; 5] = [0.125, 0.25, 0.5, 1.0, 2.0];

    unsafe {
        let mut i: u32 = 0;
        while i < n {
            let mv = movements[rng.range(9) as usize];
            current_note += mv;

            // Clamp to reasonable MIDI range
            if current_note < 42 {
                current_note += 12;
            }
            if current_note > 84 {
                current_note -= 12;
            }

            let dur = durations[rng.range(5) as usize];

            NOTE_BUF[(i * 2) as usize] = current_note as f32;
            NOTE_BUF[(i * 2 + 1) as usize] = dur;
            i += 1;
        }
        NOTE_COUNT = n;
    }
    n
}

/// Render a complete ringtone into SAMPLE_BUF. Returns sample count.
#[no_mangle]
pub extern "C" fn render_ringtone(
    seed: u32,
    preset_idx: u32,
    bpm: f32,
    sample_rate: f32,
) -> u32 {
    // Generate 3-5 notes from seed
    let num_notes = 3 + (seed % 3);
    generate_sequence(seed, num_notes);

    let pidx = if preset_idx > 99 { 99 } else { preset_idx };
    let preset = get_preset_data(pidx);
    let beat_duration = 60.0 / bpm;

    unsafe {
        // Clear buffer
        let mut j = 0;
        while j < MAX_SAMPLES {
            SAMPLE_BUF[j] = 0.0;
            j += 1;
        }

        let mut offset: usize = 0;
        let mut i: u32 = 0;
        while i < NOTE_COUNT {
            let midi_note = NOTE_BUF[(i * 2) as usize];
            let duration_beats = NOTE_BUF[(i * 2 + 1) as usize];
            let freq = midi_to_freq(midi_note);
            let duration_secs = duration_beats * beat_duration;

            render_fm_note(
                freq,
                duration_secs,
                &preset,
                sample_rate,
                &mut SAMPLE_BUF,
                offset,
                0.8,
            );
            offset += (duration_secs * sample_rate) as usize;
            i += 1;
        }

        // Include release tail
        let total = offset as f32 + preset[6] * sample_rate;
        SAMPLE_LEN = if (total as u32) < MAX_SAMPLES as u32 {
            total as u32
        } else {
            MAX_SAMPLES as u32
        };
        SAMPLE_LEN
    }
}

/// Render a single note. Returns sample count.
#[no_mangle]
pub extern "C" fn render_note(
    freq: f32,
    duration: f32,
    preset_idx: u32,
    sample_rate: f32,
    velocity: f32,
) -> u32 {
    let preset = if preset_idx >= 200 {
        unsafe { CUSTOM_PRESET }
    } else {
        let idx = if preset_idx > 99 { 99 } else { preset_idx };
        get_preset_data(idx)
    };

    unsafe {
        let mut j = 0;
        while j < MAX_SAMPLES {
            SAMPLE_BUF[j] = 0.0;
            j += 1;
        }
        let count = render_fm_note(freq, duration, &preset, sample_rate, &mut SAMPLE_BUF, 0, velocity);
        SAMPLE_LEN = count as u32;
        count as u32
    }
}
