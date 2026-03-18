// ── YAMA-BRUH Bank B — 100 Experimental FM Presets ──────────────────────────
// Param order: [cRatio, mRatio, mDepth, cAttack, cDecay, cSustain, cRelease,
//               feedback, cWave, mWave, tremolo, vibrato, ksr, ksl,
//               modLevel, egType, mAttack, mDecay, mSustain, mRelease, mEgType]
//
// cWave/mWave: 0=sine 1=half-sine 2=abs-sine 3=quarter-sine 4=noise 5=tone+noise
// tremolo/vibrato: 0 or 0.5   |  ksr: 0 or 0.3  |  ksl: 0-3
// egType/mEgType: 0=sustained 1=percussive

const YAMABRUH_PRESETS_B = [
  // ── 00-09  Glitch Textures ─────────────────────────────────────────────────
  [1, 7, 9.42, 0.001, 0.02, 0.4, 0.02, 9.42, 4, 4, 0, 0, 0.3, 2, 1, 0, 0.001, 0.01, 0.3, 0.02, 1], // 00 Static Burst
  [3, 5, 6.28, 0.001, 0.05, 0.6, 0.03, 6.28, 5, 4, 0, 0, 0.3, 1, 1, 0, 0.001, 0.03, 0.5, 0.03, 0], // 01 Tone Shred
  [2, 9, 12.566, 0.001, 0.008, 0.2, 0.015, 12.566, 4, 3, 0, 0, 0, 3, 1, 1, 0.001, 0.006, 0.1, 0.01, 1], // 02 Bit Crush
  [1, 4, 8.0, 0.001, 0.015, 0.35, 0.02, 12.566, 5, 5, 0.5, 0, 0.3, 2, 1, 1, 0.001, 0.01, 0.2, 0.02, 1], // 03 Noise Shatter
  [7, 3, 7.5, 0.001, 0.04, 0.5, 0.025, 9.42, 4, 2, 0, 0, 0.3, 3, 1, 0, 0.001, 0.02, 0.4, 0.025, 0], // 04 FM Grinder
  [1, 1, 11.0, 0.001, 0.01, 0.3, 0.01, 12.566, 3, 4, 0, 0, 0.3, 2, 1, 1, 0.001, 0.008, 0.25, 0.015, 1], // 05 Quarter Noise
  [5, 7, 6.0, 0.001, 0.03, 0.45, 0.02, 6.28, 5, 0, 0.5, 0, 0, 2, 1, 0, 0.001, 0.025, 0.4, 0.02, 0], // 06 Tone+Noise Sine
  [2, 6, 10.0, 0.001, 0.012, 0.2, 0.018, 9.42, 2, 5, 0, 0, 0.3, 3, 1, 1, 0.001, 0.01, 0.15, 0.015, 1], // 07 AbsSine Crackle
  [4, 8, 4.71, 0.001, 0.02, 0.55, 0.015, 12.566, 1, 4, 0, 0, 0, 1, 1, 0, 0.001, 0.015, 0.4, 0.02, 0], // 08 Half-sine Grit
  [9, 2, 8.5, 0.001, 0.035, 0.3, 0.022, 6.28, 4, 3, 0.5, 0, 0.3, 2, 1, 1, 0.001, 0.02, 0.2, 0.018, 1], // 09 High-ratio Static

  // ── 10-19  Evolving Pads ───────────────────────────────────────────────────
  [1, 2, 1.5, 2.0, 0.5, 0.85, 0.8, 1.57, 0, 0, 0, 0.5, 0, 0, 1, 0, 1.5, 0.6, 0.8, 0.9, 0], // 10 Silk Pad
  [1, 3, 2.5, 1.8, 0.4, 0.9, 0.85, 0, 0, 1, 0, 0.5, 0, 0, 1, 0, 2.0, 0.5, 0.85, 0.95, 0],  // 11 Half Bloom
  [2, 1, 3.14, 2.5, 0.6, 0.8, 0.9, 3.14, 0, 2, 0.5, 0, 0, 1, 1, 0, 2.5, 0.7, 0.75, 0.85, 0], // 12 AbsSine Haze
  [1, 4, 1.8, 3.0, 0.8, 0.95, 0.9, 0.5, 0, 0, 0, 0.5, 0, 0, 1, 0, 2.0, 0.9, 0.9, 0.95, 0],  // 13 Slow Drift
  [3, 2, 2.0, 1.5, 0.5, 0.88, 0.88, 1.0, 1, 0, 0, 0, 0, 1, 1, 0, 1.8, 0.6, 0.85, 0.9, 0],   // 14 Half Carrier Pad
  [1, 5, 4.0, 2.2, 0.7, 0.9, 0.85, 2.0, 0, 3, 0.5, 0.5, 0, 0, 1, 0, 2.5, 0.8, 0.88, 0.92, 0], // 15 Quarter-mod Bloom
  [2, 3, 2.8, 2.8, 0.5, 0.92, 0.9, 1.57, 2, 0, 0, 0.5, 0, 0, 1, 0, 1.5, 0.4, 0.88, 0.88, 0], // 16 AbsSine Vapor
  [1, 2, 1.2, 1.2, 0.3, 0.95, 0.82, 0.3, 0, 1, 0, 0, 0, 0, 1, 0, 1.0, 0.4, 0.92, 0.88, 0],   // 17 Gentle Plume
  [4, 1, 3.5, 3.0, 0.9, 0.88, 0.88, 2.5, 0, 2, 0.5, 0, 0, 1, 1, 0, 3.0, 0.99, 0.85, 0.9, 0], // 18 AbsMod Cloud
  [1, 7, 5.0, 2.0, 0.6, 0.9, 0.9, 4.0, 0, 0, 0, 0.5, 0, 1, 1, 0, 2.2, 0.7, 0.88, 0.92, 0],   // 19 High-ratio Aura

  // ── 20-29  Aggressive Bass ─────────────────────────────────────────────────
  [0.5, 1, 6.28, 0.001, 0.15, 0.6, 0.12, 3.14, 0, 0, 0, 0, 0.3, 3, 1, 0, 0.001, 0.08, 0.55, 0.1, 0], // 20 Sub Thump
  [0.5, 2, 9.0, 0.001, 0.2, 0.55, 0.15, 6.28, 1, 0, 0, 0, 0.3, 2, 1, 0, 0.001, 0.12, 0.5, 0.12, 0],  // 21 Half Bass
  [0.5, 3, 8.0, 0.001, 0.18, 0.7, 0.14, 4.71, 0, 2, 0, 0, 0.3, 3, 1, 0, 0.001, 0.1, 0.65, 0.13, 0],  // 22 Abs Bass
  [0.5, 1, 12.0, 0.001, 0.25, 0.5, 0.18, 9.42, 2, 1, 0, 0, 0.3, 2, 1, 0, 0.001, 0.15, 0.45, 0.16, 0], // 23 Grit Bass
  [0.5, 4, 7.0, 0.001, 0.12, 0.65, 0.1, 3.14, 0, 3, 0, 0, 0.3, 3, 1, 0, 0.001, 0.07, 0.6, 0.09, 0],  // 24 Quarter Bass
  [0.5, 2, 10.0, 0.001, 0.3, 0.45, 0.2, 6.28, 4, 0, 0, 0, 0.3, 2, 1, 1, 0.001, 0.2, 0.4, 0.18, 0],   // 25 Noise Thud
  [0.5, 5, 11.0, 0.001, 0.22, 0.6, 0.16, 12.566, 0, 4, 0, 0, 0.3, 3, 1, 0, 0.001, 0.14, 0.55, 0.14, 0], // 26 Noise Mod Bass
  [0.5, 1, 5.5, 0.001, 0.09, 0.72, 0.08, 1.57, 1, 2, 0, 0, 0, 2, 1, 0, 0.001, 0.05, 0.68, 0.07, 0],  // 27 Round Bass
  [0.5, 3, 9.5, 0.001, 0.16, 0.58, 0.12, 7.0, 2, 5, 0, 0, 0.3, 3, 1, 0, 0.001, 0.1, 0.52, 0.11, 0],  // 28 Tone+Noise Bass
  [0.5, 7, 12.566, 0.001, 0.35, 0.4, 0.25, 12.566, 0, 0, 0, 0, 0.3, 3, 1, 0, 0.001, 0.22, 0.35, 0.22, 0], // 29 Distort Bass

  // ── 30-39  Metallic Chaos ──────────────────────────────────────────────────
  [7, 9, 9.42, 0.001, 0.3, 0.5, 0.25, 12.566, 2, 2, 0, 0, 0, 2, 1, 0, 0.001, 0.2, 0.45, 0.22, 0], // 30 Clash Metal
  [8, 7, 11.0, 0.001, 0.5, 0.6, 0.4, 12.566, 2, 3, 0, 0, 0.3, 3, 1, 0, 0.001, 0.35, 0.55, 0.38, 0], // 31 AnvilStrike
  [9, 8, 12.566, 0.001, 0.4, 0.45, 0.35, 9.42, 3, 2, 0, 0, 0.3, 2, 1, 1, 0.001, 0.25, 0.4, 0.3, 1], // 32 Chaos Bell
  [7, 3, 8.0, 0.001, 0.2, 0.55, 0.18, 12.566, 2, 2, 0, 0, 0, 3, 1, 0, 0.001, 0.12, 0.5, 0.15, 0],  // 33 Reactor Hum
  [8, 5, 10.0, 0.001, 0.35, 0.5, 0.28, 9.42, 3, 1, 0, 0, 0.3, 2, 1, 0, 0.001, 0.22, 0.45, 0.25, 0], // 34 Turbine Blade
  [9, 4, 7.5, 0.001, 0.28, 0.6, 0.22, 12.566, 1, 2, 0, 0, 0.3, 3, 1, 0, 0.001, 0.18, 0.55, 0.2, 0], // 35 Steel Rain
  [7, 7, 9.0, 0.001, 0.45, 0.4, 0.38, 9.42, 2, 3, 0, 0, 0, 1, 1, 0, 0.001, 0.3, 0.35, 0.32, 0],    // 36 Mirror Crash
  [8, 9, 12.0, 0.001, 0.55, 0.35, 0.45, 12.566, 2, 2, 0, 0, 0.3, 2, 1, 1, 0.001, 0.4, 0.3, 0.4, 1], // 37 Wreck Cymbal
  [9, 6, 11.5, 0.001, 0.38, 0.5, 0.3, 9.42, 3, 4, 0.5, 0, 0.3, 3, 1, 0, 0.001, 0.25, 0.45, 0.28, 0], // 38 Noise Metal
  [7, 8, 8.5, 0.001, 0.3, 0.55, 0.25, 12.566, 2, 5, 0, 0, 0, 2, 1, 0, 0.001, 0.2, 0.5, 0.22, 0],   // 39 Tone-Metal Grind

  // ── 40-49  Noise Sculptures ────────────────────────────────────────────────
  [1, 1, 6.28, 0.001, 0.5, 0.7, 0.4, 12.566, 4, 4, 0, 0, 0, 2, 1, 0, 0.001, 0.3, 0.65, 0.38, 0],   // 40 White Wall
  [2, 3, 8.0, 0.001, 0.3, 0.6, 0.25, 9.42, 5, 5, 0.5, 0, 0, 3, 1, 0, 0.001, 0.2, 0.55, 0.22, 0],   // 41 Tone+Noise Sculpt
  [3, 1, 4.71, 0.001, 0.4, 0.5, 0.35, 12.566, 4, 0, 0, 0, 0.3, 2, 1, 0, 0.001, 0.25, 0.45, 0.3, 0], // 42 Noise Carrier Sine
  [1, 5, 9.42, 0.001, 0.6, 0.65, 0.5, 6.28, 4, 4, 0.5, 0, 0, 2, 1, 0, 0.001, 0.4, 0.6, 0.45, 0],   // 43 Full Noise
  [4, 2, 12.0, 0.001, 0.2, 0.55, 0.18, 9.42, 5, 2, 0, 0, 0.3, 3, 1, 0, 0.001, 0.12, 0.5, 0.15, 0], // 44 Tone+Noise Abs
  [2, 4, 7.0, 0.001, 0.35, 0.6, 0.28, 12.566, 4, 3, 0, 0, 0, 1, 1, 0, 0.001, 0.22, 0.55, 0.25, 0], // 45 Noise Qtr
  [1, 7, 10.0, 0.001, 0.5, 0.45, 0.4, 9.42, 5, 4, 0.5, 0, 0.3, 2, 1, 1, 0.001, 0.35, 0.4, 0.38, 1], // 46 Scatter Noise
  [5, 1, 11.0, 0.001, 0.4, 0.5, 0.32, 12.566, 4, 5, 0, 0, 0, 3, 1, 0, 0.001, 0.28, 0.45, 0.3, 0],  // 47 Tone+Noise High
  [3, 6, 8.5, 0.001, 0.3, 0.6, 0.22, 6.28, 5, 1, 0, 0, 0.3, 2, 1, 0, 0.001, 0.2, 0.55, 0.2, 0],    // 48 Noise Half-Mod
  [2, 2, 9.0, 0.001, 0.45, 0.55, 0.38, 12.566, 4, 4, 0.5, 0, 0.3, 3, 1, 0, 0.001, 0.32, 0.5, 0.35, 0], // 49 Double Noise

  // ── 50-59  Percussive Hits ─────────────────────────────────────────────────
  [1, 2, 3.14, 0.001, 0.08, 0.006, 0.06, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0.001, 0.04, 0.006, 0.05, 1],  // 50 Sine Kick
  [1, 7, 6.28, 0.001, 0.12, 0.006, 0.08, 6.28, 0, 2, 0, 0, 0.3, 2, 1, 1, 0.001, 0.06, 0.006, 0.06, 1], // 51 Abs Snare
  [2, 5, 9.42, 0.001, 0.06, 0.006, 0.04, 9.42, 2, 4, 0, 0, 0.3, 3, 1, 1, 0.001, 0.03, 0.006, 0.03, 1], // 52 Noise Hat
  [3, 1, 4.71, 0.001, 0.15, 0.006, 0.1, 3.14, 1, 0, 0, 0, 0, 1, 1, 1, 0.001, 0.08, 0.006, 0.08, 1],  // 53 Half Tom
  [1, 9, 12.566, 0.001, 0.04, 0.006, 0.03, 12.566, 4, 4, 0, 0, 0.3, 2, 1, 1, 0.001, 0.02, 0.006, 0.02, 1], // 54 Noise Blip
  [5, 3, 7.5, 0.001, 0.2, 0.006, 0.15, 4.71, 3, 2, 0, 0, 0, 3, 1, 1, 0.001, 0.12, 0.006, 0.12, 1], // 55 Qtr Tom
  [2, 8, 8.0, 0.001, 0.09, 0.006, 0.07, 6.28, 0, 3, 0, 0, 0.3, 2, 1, 1, 0.001, 0.05, 0.006, 0.05, 1], // 56 Clave Hit
  [1, 4, 5.5, 0.001, 0.05, 0.006, 0.04, 0, 2, 1, 0, 0, 0, 0, 1, 1, 0.001, 0.025, 0.006, 0.03, 1],  // 57 Abs Tick
  [4, 2, 10.0, 0.001, 0.18, 0.006, 0.14, 9.42, 5, 0, 0, 0, 0.3, 3, 1, 1, 0.001, 0.1, 0.006, 0.11, 1], // 58 Tone+Noise Perc
  [7, 1, 9.0, 0.001, 0.25, 0.006, 0.2, 12.566, 2, 4, 0, 0, 0, 2, 1, 1, 0.001, 0.15, 0.006, 0.15, 1], // 59 Abs Crash

  // ── 60-69  Frequency Sweeps ────────────────────────────────────────────────
  [1, 2, 3.14, 0.001, 0.4, 0.7, 0.3, 1.57, 0, 0, 0, 0, 0, 0, 1, 0, 0.001, 0.25, 0.65, 0.28, 0],   // 60 Sine Rise
  [1, 3, 6.28, 0.001, 0.5, 0.65, 0.4, 3.14, 1, 0, 0, 0.5, 0, 1, 1, 0, 0.001, 0.35, 0.6, 0.38, 0], // 61 Half-sine Sweep
  [2, 1, 4.0, 0.001, 0.6, 0.6, 0.5, 6.28, 0, 2, 0, 0.5, 0, 0, 1, 0, 0.001, 0.4, 0.55, 0.45, 0],   // 62 Abs Glide
  [1, 5, 7.0, 0.001, 0.45, 0.7, 0.38, 4.71, 2, 3, 0, 0, 0, 2, 1, 0, 0.001, 0.3, 0.65, 0.35, 0],   // 63 Abs-Qtr Swoop
  [3, 2, 5.5, 0.001, 0.55, 0.6, 0.45, 9.42, 0, 1, 0.5, 0, 0, 1, 1, 0, 0.001, 0.38, 0.55, 0.42, 0], // 64 Trem Sweep
  [1, 4, 8.0, 0.001, 0.7, 0.55, 0.55, 6.28, 3, 0, 0, 0.5, 0, 0, 1, 0, 0.001, 0.5, 0.5, 0.5, 0],   // 65 Qtr Rise
  [2, 7, 9.42, 0.001, 0.35, 0.65, 0.28, 3.14, 0, 4, 0, 0, 0, 2, 1, 0, 0.001, 0.22, 0.6, 0.25, 0], // 66 Noise Streak
  [1, 1, 6.0, 0.001, 0.5, 0.7, 0.4, 9.42, 5, 0, 0, 0, 0, 1, 1, 0, 0.001, 0.35, 0.65, 0.38, 0],    // 67 Tone+Noise Swoop
  [4, 3, 7.5, 0.001, 0.6, 0.6, 0.5, 12.566, 2, 2, 0, 0, 0.3, 3, 1, 0, 0.001, 0.42, 0.55, 0.45, 0], // 68 AbsAbs Crash Sweep
  [1, 9, 11.0, 0.001, 0.8, 0.5, 0.65, 6.28, 0, 3, 0.5, 0.5, 0, 0, 1, 0, 0.001, 0.55, 0.45, 0.6, 0], // 69 Max Ratio Dive

  // ── 70-79  Algorithmic Sequences ──────────────────────────────────────────
  [1, 2, 2.0, 0.001, 0.1, 0.7, 0.08, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0.001, 0.06, 0.65, 0.07, 0],       // 70 Arp Motor
  [2, 3, 4.0, 0.001, 0.15, 0.65, 0.12, 1.57, 0, 1, 0, 0, 0, 1, 1, 0, 0.001, 0.1, 0.6, 0.1, 0],     // 71 Half Stepper
  [1, 4, 3.14, 0.001, 0.12, 0.72, 0.09, 3.14, 1, 0, 0, 0, 0, 0, 1, 0, 0.001, 0.08, 0.68, 0.08, 0], // 72 Ping Pong Half
  [3, 2, 5.0, 0.001, 0.2, 0.6, 0.15, 4.71, 2, 2, 0, 0, 0.3, 2, 1, 0, 0.001, 0.14, 0.55, 0.13, 0], // 73 Abs Step
  [1, 5, 6.28, 0.001, 0.08, 0.75, 0.06, 6.28, 0, 3, 0, 0.5, 0, 0, 1, 0, 0.001, 0.05, 0.7, 0.05, 0], // 74 Qtr Stutter
  [2, 1, 2.5, 0.001, 0.18, 0.65, 0.14, 0, 3, 0, 0, 0, 0, 1, 1, 0, 0.001, 0.12, 0.6, 0.12, 0],       // 75 Qtr Carrier Seq
  [1, 3, 4.71, 0.001, 0.1, 0.78, 0.08, 1.57, 0, 2, 0, 0, 0, 0, 1, 0, 0.001, 0.06, 0.72, 0.07, 0],  // 76 Abs Pattern
  [4, 2, 7.0, 0.001, 0.14, 0.7, 0.11, 9.42, 4, 0, 0, 0, 0.3, 2, 1, 0, 0.001, 0.09, 0.65, 0.1, 0],  // 77 Noise Walk
  [2, 5, 5.5, 0.001, 0.16, 0.68, 0.13, 3.14, 0, 5, 0, 0, 0, 1, 1, 0, 0.001, 0.11, 0.63, 0.12, 0],  // 78 Tone+Noise Step
  [1, 6, 8.0, 0.001, 0.12, 0.75, 0.09, 6.28, 5, 4, 0.5, 0, 0, 0, 1, 0, 0.001, 0.08, 0.7, 0.08, 0], // 79 Scatter Step

  // ── 80-89  Layered/Combo ───────────────────────────────────────────────────
  [1, 2, 2.0, 0.01, 0.2, 0.8, 0.18, 1.57, 0, 0, 0, 0.5, 0, 0, 1, 0, 0.008, 0.12, 0.75, 0.15, 0],   // 80 Vibrato Pad+Bass
  [2, 1, 3.14, 0.001, 0.1, 0.72, 0.08, 3.14, 1, 2, 0, 0, 0, 1, 1, 0, 0.001, 0.06, 0.68, 0.07, 0],  // 81 Half+Abs Layer
  [1, 3, 4.0, 0.005, 0.25, 0.75, 0.2, 4.71, 0, 1, 0.5, 0, 0, 0, 1, 0, 0.004, 0.15, 0.7, 0.16, 0],  // 82 Trem Layer
  [3, 2, 2.5, 0.001, 0.15, 0.78, 0.12, 0, 2, 0, 0, 0.5, 0, 1, 1, 0, 0.001, 0.1, 0.72, 0.11, 0],    // 83 Abs+Vib Combo
  [1, 4, 5.0, 0.002, 0.3, 0.7, 0.25, 6.28, 0, 3, 0, 0, 0, 0, 1, 0, 0.001, 0.2, 0.65, 0.22, 0],     // 84 Qtr Mod Blend
  [2, 5, 3.14, 0.001, 0.2, 0.8, 0.16, 9.42, 3, 0, 0, 0, 0.3, 2, 1, 0, 0.001, 0.14, 0.75, 0.15, 0], // 85 Qtr Carrier Blend
  [1, 2, 6.28, 0.001, 0.18, 0.72, 0.15, 3.14, 5, 4, 0.5, 0, 0, 1, 1, 0, 0.001, 0.12, 0.68, 0.13, 0], // 86 Noise+Tone Dual
  [4, 3, 4.71, 0.003, 0.25, 0.76, 0.2, 6.28, 2, 1, 0, 0.5, 0, 0, 1, 0, 0.002, 0.16, 0.72, 0.18, 0], // 87 Abs-Half Vib
  [1, 6, 7.5, 0.001, 0.35, 0.68, 0.28, 4.71, 0, 2, 0.5, 0, 0, 2, 1, 0, 0.001, 0.22, 0.62, 0.25, 0], // 88 Trem Abs Spread
  [2, 4, 9.0, 0.002, 0.28, 0.74, 0.22, 9.42, 1, 3, 0, 0.5, 0.3, 1, 1, 0, 0.001, 0.18, 0.7, 0.2, 0], // 89 Half+Qtr KSR Vib

  // ── 90-99  Extreme Experiments ─────────────────────────────────────────────
  [9, 9, 12.566, 0.001, 0.005, 0.006, 0.005, 12.566, 4, 4, 0.5, 0, 0.3, 3, 1, 1, 0.001, 0.003, 0.006, 0.004, 1], // 90 Singularity
  [0.5, 9, 12.566, 0.001, 0.99, 1.0, 0.99, 12.566, 0, 0, 0, 0.5, 0, 0, 1, 0, 0.001, 0.99, 1.0, 0.99, 0],        // 91 Infinite Sustain
  [9, 0.5, 0.055, 0.001, 0.005, 0.006, 0.005, 0, 3, 3, 0, 0, 0, 3, 1, 1, 0.001, 0.003, 0.006, 0.003, 1],         // 92 Qtr Spark
  [1, 1, 12.566, 5.0, 0.99, 1.0, 0.99, 6.28, 0, 0, 0.5, 0.5, 0, 0, 1, 0, 5.0, 0.99, 1.0, 0.99, 0],              // 93 Slow Bloom Max
  [7, 7, 6.28, 0.001, 0.2, 0.5, 0.18, 12.566, 2, 2, 0, 0, 0.3, 3, 1, 0, 0.001, 0.12, 0.45, 0.15, 0],            // 94 Abs Mirror Max
  [3, 7, 11.5, 0.001, 0.015, 0.3, 0.012, 12.566, 5, 4, 0.5, 0, 0.3, 3, 1, 1, 0.001, 0.008, 0.25, 0.01, 1],       // 95 Noise+Tone Extreme
  [0.5, 9, 12.566, 0.001, 0.08, 0.006, 0.06, 9.42, 4, 4, 0, 0, 0.3, 2, 1, 1, 0.001, 0.04, 0.006, 0.05, 1],       // 96 Sub Noise Perc
  [9, 0.5, 9.42, 0.001, 0.5, 0.8, 0.4, 12.566, 3, 5, 0.5, 0.5, 0.3, 3, 1, 0, 0.001, 0.35, 0.75, 0.38, 0],        // 97 Qtr Sub Drone
  [4, 6, 12.566, 0.001, 0.3, 0.006, 0.25, 12.566, 2, 2, 0, 0, 0.3, 3, 1, 1, 0.001, 0.2, 0.006, 0.2, 1],          // 98 Abs Perc Extreme
  [1, 1, 12.566, 0.001, 0.01, 1.0, 0.01, 12.566, 5, 5, 0.5, 0.5, 0.3, 3, 1, 0, 0.001, 0.008, 1.0, 0.009, 0],     // 99 Full Chaos Drone
];

const PRESET_NAMES_B = [
  // 00-09 Glitch Textures
  'Static Burst', 'Tone Shred', 'Bit Crush', 'Noise Shatter', 'FM Grinder',
  'Quarter Noise', 'Tone+Noise Sine', 'AbsSine Crackle', 'Half-sine Grit', 'High-ratio Static',
  // 10-19 Evolving Pads
  'Silk Pad', 'Half Bloom', 'AbsSine Haze', 'Slow Drift', 'Half Carrier Pad',
  'Quarter-mod Bloom', 'AbsSine Vapor', 'Gentle Plume', 'AbsMod Cloud', 'High-ratio Aura',
  // 20-29 Aggressive Bass
  'Sub Thump', 'Half Bass', 'Abs Bass', 'Grit Bass', 'Quarter Bass',
  'Noise Thud', 'Noise Mod Bass', 'Round Bass', 'Tone+Noise Bass', 'Distort Bass',
  // 30-39 Metallic Chaos
  'Clash Metal', 'Anvil Strike', 'Chaos Bell', 'Reactor Hum', 'Turbine Blade',
  'Steel Rain', 'Mirror Crash', 'Wreck Cymbal', 'Noise Metal', 'Tone-Metal Grind',
  // 40-49 Noise Sculptures
  'White Wall', 'Tone+Noise Sculpt', 'Noise Carrier Sine', 'Full Noise', 'Tone+Noise Abs',
  'Noise Quarter', 'Scatter Noise', 'Tone+Noise High', 'Noise Half-Mod', 'Double Noise',
  // 50-59 Percussive Hits
  'Sine Kick', 'Abs Snare', 'Noise Hat', 'Half Tom', 'Noise Blip',
  'Quarter Tom', 'Clave Hit', 'Abs Tick', 'Tone+Noise Perc', 'Abs Crash',
  // 60-69 Frequency Sweeps
  'Sine Rise', 'Half-sine Sweep', 'Abs Glide', 'Abs-Qtr Swoop', 'Trem Sweep',
  'Quarter Rise', 'Noise Streak', 'Tone+Noise Swoop', 'AbsAbs Crash Sweep', 'Max Ratio Dive',
  // 70-79 Algorithmic Sequences
  'Arp Motor', 'Half Stepper', 'Ping Pong Half', 'Abs Step', 'Quarter Stutter',
  'Quarter Carrier Seq', 'Abs Pattern', 'Noise Walk', 'Tone+Noise Step', 'Scatter Step',
  // 80-89 Layered/Combo
  'Vibrato Pad+Bass', 'Half+Abs Layer', 'Trem Layer', 'Abs+Vib Combo', 'Quarter Mod Blend',
  'Quarter Carrier Blend', 'Noise+Tone Dual', 'Abs-Half Vib', 'Trem Abs Spread', 'Half+Qtr KSR Vib',
  // 90-99 Extreme Experiments
  'Singularity', 'Infinite Sustain', 'Quarter Spark', 'Slow Bloom Max', 'Abs Mirror Max',
  'Noise+Tone Extreme', 'Sub Noise Perc', 'Quarter Sub Drone', 'Abs Perc Extreme', 'Full Chaos Drone',
];

// ── Default Sequence Definitions for Bank B ──────────────────────────────────
// Each entry: { enabled: true, name: 'Name', source: '{ ... }' }
//
// noteAlgo args: { time, i, freq, v, n, dt, feedback, mDepth, cRatio, mRatio, cWave, mWave }
// noteAlgo returns overrides applied per-sample: { cents, feedback, mDepth, cRatio, mRatio, cWave, mWave }
// algorithm args: { n, v, i, t, g, cents, sus, dt, time, rootN, rootV }
// algorithm returns next step: { n, v, t, g, cents, cRatio, mDepth, mFeedback, ... }

const DEFAULT_SEQUENCE_DEFS_B = {

  // ── 00 Static Burst — glitchy random scatter ─────────────────────────────
  0: {
    enabled: true, name: 'Burst Scatter',
    source: `{
  g: 0.15,
  t: 0.06,
  algorithm: ({ n, v, i }) => ({
    n: n + floor(random() * 24 - 8),
    v: v - 0.04,
    t: 0.04 + random() * 0.08,
    g: 0.1 + random() * 0.2,
  }),
}`,
  },

  // ── 01 Tone Shred — rapid chromatic descent ──────────────────────────────
  1: {
    enabled: true, name: 'Shred Descent',
    source: `{
  gated: true,
  g: 0.2,
  t: 0.04,
  algorithm: ({ n, v, i, t, g }) => ({
    n: n - 1,
    v: max(0.05, v - 0.02),
    t,
    g,
    mDepth: 6.28 + sin(i * 0.5) * 3.0,
  }),
}`,
  },

  // ── 02 Bit Crush — stutter with waveform morphing (noteAlgo) ─────────────
  2: {
    enabled: true, name: 'Bit Stutter',
    source: `{
  gated: true,
  g: 0.3,
  t: 0.05,
  noteAlgo: ({ time, i, v }) => ({
    mDepth: clamp(12.566 * abs(sin(time * 8.0)), 0.055, 12.566),
    feedback: clamp(12.566 * abs(cos(time * 3.0)), 0, 12.566),
  }),
  algorithm: ({ n, v, t, g, i }) => ({
    n: n + (i % 3 === 0 ? floor(random() * 8 - 4) : 0),
    v: max(0.05, v - 0.015),
    t,
    g: 0.2 + random() * 0.3,
  }),
}`,
  },

  // ── 03 Noise Shatter — exploding shards ──────────────────────────────────
  3: {
    enabled: true, name: 'Shard Blast',
    source: `{
  g: 0.1,
  t: 0.08,
  algorithm: ({ n, v, i }) => ({
    n: n + floor(random() * 36 - 12),
    v: max(0.02, v - 0.06),
    t: 0.05 + random() * 0.12,
    g: 0.08 + random() * 0.15,
  }),
}`,
  },

  // ── 04 FM Grinder — high ratio sweep with mDepth LFO (noteAlgo) ──────────
  4: {
    enabled: true, name: 'Grinder LFO',
    source: `{
  gated: true,
  noteAlgo: ({ time, freq }) => ({
    mDepth: clamp(4.71 + sin(time * 2.5) * 4.71, 0.055, 12.566),
    mRatio: clamp(3.0 + sin(time * 0.7) * 4.0, 0.5, 9),
    feedback: clamp(9.42 + sin(time * 1.3) * 3.0, 0, 12.566),
  }),
}`,
  },

  // ── 05 Quarter Noise — triplet stutter ───────────────────────────────────
  5: {
    enabled: true, name: 'Triplet Stutter',
    source: `{
  gated: true,
  g: 0.4,
  offsets: [0, 3, -2, 0, 5, -3],
  times: [0.083, 0.083, 0.083, 0.167, 0.083, 0.25],
  levels: [1, 0.7, 0.5, 0.9, 0.6, 0.4],
}`,
  },

  // ── 06 Tone+Noise Sine — tremolo wave (noteAlgo) ─────────────────────────
  6: {
    enabled: true, name: 'Tremolo Wave',
    source: `{
  gated: true,
  noteAlgo: ({ time, v }) => ({
    mDepth: clamp(6.0 + sin(time * 6.28) * 4.0, 0.055, 12.566),
    cRatio: clamp(5.0 + cos(time * 3.14) * 2.5, 0.5, 9),
  }),
}`,
  },

  // ── 07 AbsSine Crackle — random crackle bursts ───────────────────────────
  7: {
    enabled: true, name: 'Crackle Burst',
    source: `{
  g: 0.12,
  t: 0.07,
  algorithm: ({ n, v, i }) => ({
    n: n + (random() > 0.7 ? floor(random() * 12 - 6) : 0),
    v: max(0.03, v - 0.05 + random() * 0.02),
    t: 0.04 + random() * 0.1,
    g: 0.08 + random() * 0.18,
    mDepth: 4.0 + random() * 6.0,
  }),
}`,
  },

  // ── 08 Half-sine Grit — ascending power chords ───────────────────────────
  8: {
    enabled: true, name: 'Power Climb',
    source: `{
  g: 0.85,
  offsets: [0, 7, 12, 7, 19, 12],
  times: [0.125, 0.125, 0.125, 0.125, 0.25, 0.25],
  levels: [1, 0.9, 0.8, 0.7, 0.85, 0.6],
}`,
  },

  // ── 09 High-ratio Static — random high-note scatter ──────────────────────
  9: {
    enabled: true, name: 'High Scatter',
    source: `{
  g: 0.2,
  t: 0.09,
  algorithm: ({ n, v, i }) => ({
    n: n + floor(random() * 18),
    v: max(0.05, v - 0.07),
    t: 0.06 + random() * 0.1,
    g: 0.15 + random() * 0.2,
    mDepth: 4.0 + random() * 8.0,
    feedback: random() * 12.566,
  }),
}`,
  },

  // ── 10 Silk Pad — slow vibrato drift (noteAlgo) ──────────────────────────
  10: {
    enabled: true, name: 'Silk Drift',
    source: `{
  gated: true,
  noteAlgo: ({ time }) => ({
    cents: sin(time * 0.4) * 18,
    mDepth: clamp(1.5 + sin(time * 0.25) * 0.8, 0.055, 6.0),
  }),
}`,
  },

  // ── 11 Half Bloom — slow pad swell with subtle pitch ─────────────────────
  11: {
    enabled: true, name: 'Bloom Swell',
    source: `{
  gated: true,
  noteAlgo: ({ time }) => ({
    cents: cos(time * 0.35) * 12,
    mDepth: clamp(2.5 + sin(time * 0.18) * 1.5, 0.055, 6.0),
    feedback: clamp(sin(time * 0.1) * 1.57, 0, 3.14),
  }),
}`,
  },

  // ── 12 AbsSine Haze — evolving waveform (noteAlgo oscillates mRatio) ─────
  12: {
    enabled: true, name: 'Ratio Morph',
    source: `{
  gated: true,
  noteAlgo: ({ time }) => ({
    mRatio: clamp(1.0 + abs(sin(time * 0.15)) * 6.0, 0.5, 9),
    mDepth: clamp(3.14 + sin(time * 0.22) * 2.5, 0.055, 9.0),
    cents: sin(time * 0.5) * 8,
  }),
}`,
  },

  // ── 13 Slow Drift — long pad with feedback self-oscillation ──────────────
  13: {
    enabled: true, name: 'Self Oscillate',
    source: `{
  gated: true,
  noteAlgo: ({ time }) => ({
    feedback: clamp(0.5 + time * 0.08, 0, 12.566),
    mDepth: clamp(1.8 + sin(time * 0.12) * 1.2, 0.055, 6.0),
    cents: sin(time * 0.3) * 15,
  }),
}`,
  },

  // ── 14 Half Carrier Pad — slow chord cascade ─────────────────────────────
  14: {
    enabled: true, name: 'Chord Bloom',
    source: `{
  g: 0.95,
  offsets: [0, 7, 12, 4, 9, 16],
  times: [0.5, 0.5, 0.5, 0.5, 0.5, 1.0],
  levels: [1, 0.85, 0.7, 0.6, 0.5, 0.35],
}`,
  },

  // ── 15 Quarter-mod Bloom — lush pad with LFO pitch + mod (noteAlgo) ──────
  15: {
    enabled: true, name: 'LFO Bloom',
    source: `{
  gated: true,
  noteAlgo: ({ time }) => ({
    cents: sin(time * 0.6) * 22,
    mDepth: clamp(4.0 + cos(time * 0.4) * 2.5, 0.055, 9.0),
    mRatio: clamp(5.0 + sin(time * 0.2) * 2.0, 0.5, 9),
  }),
}`,
  },

  // ── 16 AbsSine Vapor — subtle chorus-like cents drift (noteAlgo) ─────────
  16: {
    enabled: true, name: 'Vapor Chorus',
    source: `{
  gated: true,
  noteAlgo: ({ time }) => ({
    cents: sin(time * 0.55) * 14 + cos(time * 0.82) * 8,
    mDepth: clamp(2.8 + sin(time * 0.3) * 1.2, 0.055, 6.0),
  }),
}`,
  },

  // ── 19 High-ratio Aura — orbiting overtone (noteAlgo) ────────────────────
  19: {
    enabled: true, name: 'Overtone Orbit',
    source: `{
  gated: true,
  noteAlgo: ({ time }) => ({
    mRatio: clamp(7.0 + sin(time * 0.25) * 2.0, 0.5, 9),
    mDepth: clamp(5.0 + cos(time * 0.18) * 3.0, 0.055, 12.566),
    feedback: clamp(4.0 + sin(time * 0.1) * 4.0, 0, 12.566),
    cents: cos(time * 0.45) * 20,
  }),
}`,
  },

  // ── 20 Sub Thump — bass + upper octave layer ─────────────────────────────
  20: {
    enabled: true, name: 'Sub Octave',
    source: `{
  g: 0.9,
  offsets: [0, 12],
  times: [0.25, 0.5],
  levels: [1, 0.5],
}`,
  },

  // ── 21 Half Bass — mod depth wobble (noteAlgo) ───────────────────────────
  21: {
    enabled: true, name: 'Wobble Bass',
    source: `{
  gated: true,
  noteAlgo: ({ time }) => ({
    mDepth: clamp(9.0 + sin(time * 4.0) * 5.0, 0.055, 12.566),
    feedback: clamp(6.28 + sin(time * 2.5) * 3.0, 0, 12.566),
  }),
}`,
  },

  // ── 22 Abs Bass — pulsing bass line ──────────────────────────────────────
  22: {
    enabled: true, name: 'Pulse Bass',
    source: `{
  gated: true,
  g: 0.7,
  offsets: [0, 0, -5, 0],
  times: [0.25, 0.25, 0.25, 0.5],
  levels: [1, 0.8, 0.6, 0.9],
  noteAlgo: ({ time }) => ({
    mDepth: clamp(8.0 + sin(time * 3.14) * 4.0, 0.055, 12.566),
  }),
}`,
  },

  // ── 24 Quarter Bass — funky rhythmic pattern ─────────────────────────────
  24: {
    enabled: true, name: 'Funky Qtr',
    source: `{
  g: 0.65,
  offsets: [0, 0, 3, -2, 0, 5],
  times: [0.25, 0.125, 0.125, 0.25, 0.125, 0.375],
  levels: [1, 0.6, 0.75, 0.5, 0.9, 0.7],
}`,
  },

  // ── 30 Clash Metal — clanging metal sequence ─────────────────────────────
  30: {
    enabled: true, name: 'Metal Clang',
    source: `{
  g: 0.4,
  offsets: [0, 7, 14, 2, 9],
  times: [0.2, 0.15, 0.15, 0.1, 0.3],
  levels: [1, 0.8, 0.65, 0.9, 0.5],
  noteAlgo: ({ time }) => ({
    feedback: clamp(12.566 * abs(sin(time * 0.5)), 0, 12.566),
  }),
}`,
  },

  // ── 31 Anvil Strike — dropping decay pattern ─────────────────────────────
  31: {
    enabled: true, name: 'Anvil Drop',
    source: `{
  g: 0.5,
  t: 0.3,
  algorithm: ({ n, v, t, g, i }) => ({
    n: n - floor(i * 0.5),
    v: max(0.05, v - 0.08),
    t: max(0.05, t * 0.9),
    g,
  }),
}`,
  },

  // ── 32 Chaos Bell — inharmonic overtone spread ───────────────────────────
  32: {
    enabled: true, name: 'Chaos Bell',
    source: `{
  g: 0.8,
  offsets: [0, 11, 18, 5, 14, 21],
  times: [0.4, 0.35, 0.3, 0.25, 0.2, 0.5],
  levels: [1, 0.7, 0.55, 0.8, 0.5, 0.35],
  noteAlgo: ({ time }) => ({
    mDepth: clamp(12.566 * abs(sin(time * 0.3)), 0.055, 12.566),
  }),
}`,
  },

  // ── 40 White Wall — sustained noise swell (noteAlgo) ─────────────────────
  40: {
    enabled: true, name: 'Noise Swell',
    source: `{
  gated: true,
  noteAlgo: ({ time }) => ({
    mDepth: clamp(time * 1.5, 0.055, 12.566),
    feedback: clamp(time * 2.0, 0, 12.566),
  }),
}`,
  },

  // ── 41 Tone+Noise Sculpt — morphing noise texture (noteAlgo) ─────────────
  41: {
    enabled: true, name: 'Noise Morph',
    source: `{
  gated: true,
  noteAlgo: ({ time }) => ({
    mDepth: clamp(8.0 + sin(time * 1.2) * 4.0, 0.055, 12.566),
    mRatio: clamp(3.0 + abs(sin(time * 0.4)) * 5.0, 0.5, 9),
    feedback: clamp(9.42 + cos(time * 0.8) * 3.0, 0, 12.566),
  }),
}`,
  },

  // ── 43 Full Noise — slow random note cloud ───────────────────────────────
  43: {
    enabled: true, name: 'Noise Cloud',
    source: `{
  g: 0.6,
  t: 0.25,
  algorithm: ({ n, v, i }) => ({
    n: n + floor(random() * 16 - 6),
    v: max(0.08, v - 0.03),
    t: 0.15 + random() * 0.4,
    g: 0.5 + random() * 0.4,
    mDepth: 4.0 + random() * 8.0,
  }),
}`,
  },

  // ── 50 Sine Kick — classic kick pattern ──────────────────────────────────
  50: {
    enabled: true, name: 'Kick Pattern',
    source: `{
  g: 0.9,
  offsets: [0, 0, 0, 0],
  times: [0.5, 0.5, 0.25, 0.25],
  levels: [1, 0.9, 0.7, 0.8],
}`,
  },

  // ── 51 Abs Snare — snare + rim shot ──────────────────────────────────────
  51: {
    enabled: true, name: 'Snare Rim',
    source: `{
  g: 0.3,
  offsets: [0, 5, 0, 3],
  times: [0.25, 0.125, 0.25, 0.125],
  levels: [1, 0.5, 0.9, 0.4],
}`,
  },

  // ── 52 Noise Hat — rolling hi-hat ────────────────────────────────────────
  52: {
    enabled: true, name: 'Hat Roll',
    source: `{
  gated: true,
  g: 0.2,
  offsets: [0, 0, 0, 0],
  times: [0.0625, 0.0625, 0.0625, 0.0625],
  levels: [1, 0.6, 0.8, 0.5],
}`,
  },

  // ── 55 Quarter Tom — tom fill (noteAlgo pitch sweep) ─────────────────────
  55: {
    enabled: true, name: 'Tom Fill',
    source: `{
  g: 0.85,
  t: 0.18,
  algorithm: ({ n, v, t, g, i }) => ({
    n: n - 2,
    v: max(0.1, v - 0.07),
    t: max(0.1, t * 0.92),
    g,
    noteAlgo: ({ time }) => ({ cents: -time * 80 }),
  }),
}`,
  },

  // ── 59 Abs Crash — crash decay sequence ──────────────────────────────────
  59: {
    enabled: true, name: 'Crash Decay',
    source: `{
  g: 0.9,
  t: 0.3,
  algorithm: ({ n, v, t, g, i }) => ({
    n: n + floor(random() * 6 - 2),
    v: max(0.02, v - 0.09),
    t: t * 1.08,
    g,
  }),
}`,
  },

  // ── 60 Sine Rise — 4-octave ascent then crash (noteAlgo) ─────────────────
  60: {
    enabled: true, name: '4-Oct Rise',
    source: `{
  gated: true,
  noteAlgo: ({ time }) => ({
    cents: clamp(time * 240, 0, 4800),
    mDepth: clamp(3.14 + time * 0.5, 0.055, 9.0),
  }),
}`,
  },

  // ── 61 Half-sine Sweep — oscillating pitch sweep (noteAlgo) ──────────────
  61: {
    enabled: true, name: 'Osc Sweep',
    source: `{
  gated: true,
  noteAlgo: ({ time }) => ({
    cents: sin(time * 1.5) * 600,
    mDepth: clamp(6.28 + cos(time * 2.0) * 3.0, 0.055, 12.566),
  }),
}`,
  },

  // ── 62 Abs Glide — glide then descend (algorithm) ────────────────────────
  62: {
    enabled: true, name: 'Glide Crash',
    source: `{
  g: 0.95,
  t: 0.15,
  algorithm: ({ n, v, i, t, g }) => {
    const rising = i < 16;
    return {
      n: rising ? n + 3 : n - 5,
      v: max(0.05, v - (rising ? 0.01 : 0.06)),
      t: rising ? t : t * 0.85,
      g,
      cents: rising ? i * 25 : -(i - 16) * 40,
    };
  },
}`,
  },

  // ── 65 Quarter Rise — quarter-sine sweep algorithm ───────────────────────
  65: {
    enabled: true, name: 'Qtr Climb',
    source: `{
  gated: true,
  g: 0.9,
  t: 0.12,
  algorithm: ({ n, v, i, t, g }) => ({
    n: n + 2,
    v: max(0.05, v - 0.015),
    t,
    g,
    cents: sin(i * 0.4) * 50,
    mDepth: clamp(8.0 - i * 0.1, 0.055, 8.0),
  }),
}`,
  },

  // ── 66 Noise Streak — rising noise streak ────────────────────────────────
  66: {
    enabled: true, name: 'Noise Streak',
    source: `{
  g: 0.85,
  t: 0.1,
  algorithm: ({ n, v, i, t, g }) => ({
    n: n + 1,
    v: max(0.05, v - 0.025),
    t: t * 0.95,
    g,
    feedback: clamp(i * 0.5, 0, 12.566),
  }),
}`,
  },

  // ── 67 Tone+Noise Swoop — swoop then scatter ─────────────────────────────
  67: {
    enabled: true, name: 'Swoop Scatter',
    source: `{
  g: 0.7,
  t: 0.12,
  algorithm: ({ n, v, i, t, g }) => {
    const swooping = i < 12;
    return {
      n: swooping ? n + 4 : n + floor(random() * 12 - 6),
      v: max(0.04, v - (swooping ? 0.02 : 0.08)),
      t: swooping ? t : 0.06 + random() * 0.1,
      g: swooping ? g : 0.2 + random() * 0.3,
      cents: swooping ? i * 30 : random() * 100 - 50,
    };
  },
}`,
  },

  // ── 69 Max Ratio Dive — 4-octave dive with chaos (noteAlgo + algo) ────────
  69: {
    enabled: true, name: '4-Oct Dive',
    source: `{
  gated: true,
  noteAlgo: ({ time }) => ({
    cents: clamp(-time * 280, -4800, 0),
    mDepth: clamp(11.0 - time * 0.3, 0.055, 12.566),
    feedback: clamp(6.28 + time * 1.0, 0, 12.566),
  }),
}`,
  },

  // ── 70 Arp Motor — fast motorized arpeggio ───────────────────────────────
  70: {
    enabled: true, name: 'Motor Arp',
    source: `{
  gated: true,
  g: 0.7,
  offsets: [0, 4, 7, 12, 7, 4],
  t: 0.1,
  levels: [1, 0.8, 0.7, 0.9, 0.65, 0.75],
}`,
  },

  // ── 71 Half Stepper — euclidean-feel step pattern ────────────────────────
  71: {
    enabled: true, name: 'Euclidean Steps',
    source: `{
  gated: true,
  g: 0.75,
  offsets: [0, 0, 7, 0, 5, 0, 3, 7],
  times: [0.25, 0.125, 0.125, 0.25, 0.125, 0.125, 0.25, 0.5],
  levels: [1, 0.5, 0.8, 0.6, 0.9, 0.4, 0.7, 0.85],
}`,
  },

  // ── 72 Ping Pong Half — pingpong interval bounce ─────────────────────────
  72: {
    enabled: true, name: 'Ping Pong',
    source: `{
  gated: true,
  g: 0.8,
  t: 0.125,
  algorithm: ({ n, v, i, t, g }) => ({
    n: i % 2 === 0 ? n + 7 : n - 7,
    v: max(0.1, v - 0.01),
    t,
    g,
    cents: (i % 2 === 0 ? 1 : -1) * 15,
  }),
}`,
  },

  // ── 73 Abs Step — chromatic abs-sine walk ────────────────────────────────
  73: {
    enabled: true, name: 'Chromatic Walk',
    source: `{
  gated: true,
  g: 0.6,
  t: 0.1,
  algorithm: ({ n, v, i, t, g }) => ({
    n: n + (i % 7 < 4 ? 1 : -2),
    v: max(0.1, v - 0.008),
    t,
    g,
    mDepth: clamp(5.0 + sin(i * 0.5) * 3.0, 0.055, 9.0),
  }),
}`,
  },

  // ── 74 Quarter Stutter — gated stutter with mDepth LFO (noteAlgo + algo) ─
  74: {
    enabled: true, name: 'Stutter LFO',
    source: `{
  gated: true,
  g: 0.35,
  t: 0.075,
  noteAlgo: ({ time }) => ({
    mDepth: clamp(6.28 + sin(time * 8.0) * 4.0, 0.055, 12.566),
  }),
  algorithm: ({ n, v, i, t, g }) => ({
    n: n + (i % 4 === 0 ? floor(random() * 6 - 3) : 0),
    v: max(0.05, v - 0.01),
    t,
    g: 0.25 + random() * 0.3,
  }),
}`,
  },

  // ── 75 Quarter Carrier Seq — melodic quarter-wave sequence ───────────────
  75: {
    enabled: true, name: 'Qtr Melody',
    source: `{
  gated: true,
  g: 0.82,
  offsets: [0, 2, 5, 7, 9, 12, 9, 7],
  t: 0.15,
  levels: [1, 0.9, 0.85, 0.8, 0.75, 1.0, 0.7, 0.6],
}`,
  },

  // ── 76 Abs Pattern — pentatonic abs-sine loop ────────────────────────────
  76: {
    enabled: true, name: 'Penta Abs',
    source: `{
  gated: true,
  g: 0.78,
  offsets: [0, 3, 5, 7, 10, 12, 10, 7, 5, 3],
  t: 0.12,
  levels: [1, 0.85, 0.9, 0.8, 0.75, 1.0, 0.7, 0.8, 0.85, 0.9],
}`,
  },

  // ── 77 Noise Walk — random drunkard's walk ───────────────────────────────
  77: {
    enabled: true, name: 'Drunk Walk',
    source: `{
  gated: true,
  g: 0.5,
  t: 0.18,
  algorithm: ({ n, v, i, t, g }) => ({
    n: clamp(n + floor(random() * 5 - 2), 36, 96),
    v: max(0.05, v - 0.005),
    t: 0.12 + random() * 0.18,
    g: 0.4 + random() * 0.4,
    mDepth: clamp(7.0 + random() * 5.0 - 2.5, 0.055, 12.566),
  }),
}`,
  },

  // ── 78 Tone+Noise Step — syncopated noise steps ──────────────────────────
  78: {
    enabled: true, name: 'Noise Sync',
    source: `{
  gated: true,
  g: 0.6,
  offsets: [0, 0, 5, 0, 3, 7, 0, -2],
  times: [0.25, 0.125, 0.125, 0.25, 0.25, 0.125, 0.125, 0.5],
  levels: [1, 0.4, 0.7, 0.5, 0.85, 0.6, 0.35, 0.9],
  noteAlgo: ({ time }) => ({
    mDepth: clamp(5.5 + sin(time * 4.0) * 3.0, 0.055, 12.566),
  }),
}`,
  },

  // ── 79 Scatter Step — random scatter with mDepth modulation ─────────────
  79: {
    enabled: true, name: 'Scatter Mod',
    source: `{
  g: 0.3,
  t: 0.1,
  algorithm: ({ n, v, i }) => ({
    n: n + floor(random() * 20 - 8),
    v: max(0.04, v - 0.04),
    t: 0.07 + random() * 0.15,
    g: 0.2 + random() * 0.4,
    mDepth: 2.0 + random() * 10.0,
    feedback: random() * 9.0,
  }),
}`,
  },

  // ── 80 Vibrato Pad+Bass — layered pad with vibrato LFO (noteAlgo) ─────────
  80: {
    enabled: true, name: 'Pad+Bass Layer',
    source: `{
  gated: true,
  layer: [20],
  noteAlgo: ({ time }) => ({
    cents: sin(time * 5.5) * 25,
    mDepth: clamp(2.0 + sin(time * 0.35) * 1.0, 0.055, 6.0),
  }),
}`,
  },

  // ── 81 Half+Abs Layer — combined half and abs-sine with step ─────────────
  81: {
    enabled: true, name: 'Half+Abs Step',
    source: `{
  g: 0.85,
  offsets: [0, 4, 7, 11],
  t: 0.2,
  levels: [1, 0.8, 0.7, 0.6],
  layer: [12],
}`,
  },

  // ── 82 Trem Layer — tremolo pad over bass ────────────────────────────────
  82: {
    enabled: true, name: 'Trem Bass Layer',
    source: `{
  gated: true,
  layer: [22],
  noteAlgo: ({ time }) => ({
    mDepth: clamp(4.0 + sin(time * 6.28) * 2.5, 0.055, 9.0),
    cents: cos(time * 3.14) * 10,
  }),
}`,
  },

  // ── 83 Abs+Vib Combo — abs-sine melody with vibrato (noteAlgo) ───────────
  83: {
    enabled: true, name: 'Abs Vib Melody',
    source: `{
  gated: true,
  g: 0.88,
  offsets: [0, 5, 7, 12, 7, 5],
  t: 0.18,
  levels: [1, 0.85, 0.9, 0.75, 0.7, 0.8],
  noteAlgo: ({ time }) => ({
    cents: sin(time * 7.0) * 20,
  }),
}`,
  },

  // ── 84 Quarter Mod Blend — two-voice counterpoint ────────────────────────
  84: {
    enabled: true, name: 'Counterpoint',
    source: `{
  gated: true,
  g: 0.9,
  t: 0.2,
  algorithm: ({ n, v, i, t, g }) => ({
    n: i % 2 === 0 ? n + 2 : n - 1,
    v: max(0.1, v - 0.005),
    t,
    g,
    cents: sin(i * 0.3) * 15,
    mDepth: clamp(5.0 + cos(i * 0.4) * 2.5, 0.055, 9.0),
  }),
}`,
  },

  // ── 86 Noise+Tone Dual — noise swell + melodic tones (noteAlgo + algo) ───
  86: {
    enabled: true, name: 'Noise+Tone Dual',
    source: `{
  gated: true,
  g: 0.7,
  t: 0.15,
  noteAlgo: ({ time }) => ({
    mDepth: clamp(6.28 + sin(time * 2.0) * 4.0, 0.055, 12.566),
    feedback: clamp(3.14 + cos(time * 1.5) * 3.14, 0, 12.566),
  }),
  algorithm: ({ n, v, i, t, g }) => ({
    n: n + [0, 3, 7, 5, 2, 7, 0, -2][i % 8],
    v: max(0.05, v - 0.01),
    t,
    g,
  }),
}`,
  },

  // ── 87 Abs-Half Vib — vibrato abs half layer ─────────────────────────────
  87: {
    enabled: true, name: 'Vib Abs Half',
    source: `{
  gated: true,
  layer: [11, 16],
  noteAlgo: ({ time }) => ({
    cents: sin(time * 6.5) * 22 + cos(time * 3.2) * 10,
    mDepth: clamp(4.71 + sin(time * 0.5) * 2.5, 0.055, 9.0),
  }),
}`,
  },

  // ── 88 Trem Abs Spread — tremolo cascade ─────────────────────────────────
  88: {
    enabled: true, name: 'Trem Cascade',
    source: `{
  g: 0.88,
  offsets: [0, 7, 12, 4, 9, 16, 14, 21],
  times: [0.3, 0.25, 0.25, 0.2, 0.2, 0.3, 0.25, 0.5],
  levels: [1, 0.85, 0.75, 0.9, 0.7, 0.65, 0.6, 0.4],
  noteAlgo: ({ time }) => ({
    mDepth: clamp(7.5 + sin(time * 3.0) * 3.5, 0.055, 12.566),
  }),
}`,
  },

  // ── 90 Singularity — everything maxed, random scatter ────────────────────
  90: {
    enabled: true, name: 'Singularity',
    source: `{
  g: 0.08,
  t: 0.04,
  algorithm: ({ n, v, i }) => ({
    n: n + floor(random() * 48 - 24),
    v: max(0.01, v - 0.03 + random() * 0.02),
    t: 0.02 + random() * 0.08,
    g: 0.05 + random() * 0.15,
    mDepth: random() * 12.566,
    feedback: random() * 12.566,
    cRatio: 0.5 + random() * 8.5,
    mRatio: 0.5 + random() * 8.5,
  }),
}`,
  },

  // ── 91 Infinite Sustain — extremely slow morphing drone (noteAlgo) ────────
  91: {
    enabled: true, name: 'Infinite Drone',
    source: `{
  gated: true,
  noteAlgo: ({ time }) => ({
    mRatio: clamp(1.0 + abs(sin(time * 0.05)) * 8.0, 0.5, 9),
    mDepth: clamp(1.0 + time * 0.15, 0.055, 12.566),
    feedback: clamp(sin(time * 0.03) * 6.28, 0, 12.566),
    cents: sin(time * 0.08) * 30 + cos(time * 0.13) * 20,
  }),
}`,
  },

  // ── 93 Slow Bloom Max — maximum attack bloom with ratio morph (noteAlgo) ──
  93: {
    enabled: true, name: 'Max Bloom Morph',
    source: `{
  gated: true,
  noteAlgo: ({ time }) => ({
    mRatio: clamp(1.0 + abs(sin(time * 0.08)) * 8.0, 0.5, 9),
    mDepth: clamp(12.566 * abs(sin(time * 0.06)), 0.055, 12.566),
    feedback: clamp(6.28 * abs(cos(time * 0.07)), 0, 12.566),
    cents: sin(time * 0.15) * 50,
  }),
}`,
  },

  // ── 94 Abs Mirror Max — dual abs mirrors (noteAlgo) ──────────────────────
  94: {
    enabled: true, name: 'Abs Mirror',
    source: `{
  gated: true,
  noteAlgo: ({ time }) => ({
    cRatio: clamp(7.0 + sin(time * 0.2) * 2.0, 0.5, 9),
    mRatio: clamp(7.0 + cos(time * 0.2) * 2.0, 0.5, 9),
    mDepth: clamp(6.28 + sin(time * 0.35) * 6.0, 0.055, 12.566),
    feedback: clamp(12.566 * abs(sin(time * 0.12)), 0, 12.566),
    cents: sin(time * 0.6) * 40 + cos(time * 0.9) * 25,
  }),
}`,
  },

  // ── 95 Noise+Tone Extreme — noise chaos algo ─────────────────────────────
  95: {
    enabled: true, name: 'Extreme Chaos',
    source: `{
  g: 0.12,
  t: 0.05,
  algorithm: ({ n, v, i }) => ({
    n: n + floor(random() * 36 - 18),
    v: max(0.01, v - 0.08 + random() * 0.05),
    t: 0.03 + random() * 0.1,
    g: 0.08 + random() * 0.2,
    mDepth: random() * 12.566,
    feedback: random() * 12.566,
    cRatio: 0.5 + random() * 8.5,
  }),
}`,
  },

  // ── 97 Quarter Sub Drone — orbiting sub drone (noteAlgo) ─────────────────
  97: {
    enabled: true, name: 'Sub Orbit',
    source: `{
  gated: true,
  noteAlgo: ({ time }) => ({
    mRatio: clamp(0.5 + abs(sin(time * 0.07)) * 8.5, 0.5, 9),
    mDepth: clamp(9.42 + sin(time * 0.25) * 3.0, 0.055, 12.566),
    feedback: clamp(12.566 * abs(sin(time * 0.09)), 0, 12.566),
    cents: sin(time * 0.18) * 35 + cos(time * 0.31) * 18,
    cRatio: clamp(0.5 + abs(cos(time * 0.06)) * 0.5, 0.5, 1.0),
  }),
}`,
  },

  // ── 99 Full Chaos Drone — maximally wild sustained drone ─────────────────
  99: {
    enabled: true, name: 'Full Chaos',
    source: `{
  gated: true,
  noteAlgo: ({ time }) => ({
    mRatio: clamp(0.5 + abs(sin(time * 0.11)) * 8.5, 0.5, 9),
    cRatio: clamp(0.5 + abs(cos(time * 0.09)) * 8.5, 0.5, 9),
    mDepth: clamp(12.566 * abs(sin(time * 0.13)), 0.055, 12.566),
    feedback: clamp(12.566 * abs(cos(time * 0.17)), 0, 12.566),
    cents: sin(time * 0.22) * 60 + cos(time * 0.37) * 35 + sin(time * 0.71) * 15,
  }),
}`,
  },
};
