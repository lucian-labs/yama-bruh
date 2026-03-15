import Foundation

/// FM preset parameters: [carrierRatio, modRatio, modIndex, attack, decay, sustain, release, feedback]
public struct FMPreset: Sendable {
    public let carrierRatio: Float
    public let modRatio: Float
    public let modIndex: Float
    public let attack: Float
    public let decay: Float
    public let sustain: Float
    public let release: Float
    public let feedback: Float

    public init(_ params: [Float]) {
        carrierRatio = params[0]
        modRatio = params[1]
        modIndex = params[2]
        attack = params[3]
        decay = params[4]
        sustain = params[5]
        release = params[6]
        feedback = params[7]
    }
}

// swiftlint:disable line_length
public enum FMPresets {
    /// All 99 hand-tuned presets ported from yama-bruh Rust/WASM engine
    public static let all: [FMPreset] = [
        // 00-09: Piano / Keys
        FMPreset([1.0,  1.0,  1.8,  0.001, 0.8,  0.15, 0.4,  0.0  ]), // 0  Grand Piano
        FMPreset([1.0,  2.0,  2.5,  0.001, 0.6,  0.2,  0.35, 0.0  ]), // 1  Bright Piano
        FMPreset([1.0,  3.0,  3.5,  0.001, 0.4,  0.25, 0.3,  0.05 ]), // 2  Honky-Tonk
        FMPreset([1.0,  1.0,  1.2,  0.002, 1.0,  0.3,  0.5,  0.0  ]), // 3  E.Piano 1
        FMPreset([1.0,  7.0,  2.0,  0.001, 0.7,  0.12, 0.6,  0.0  ]), // 4  E.Piano 2
        FMPreset([1.0,  5.0,  4.5,  0.001, 0.15, 0.05, 0.08, 0.1  ]), // 5  Clav
        FMPreset([1.0,  3.0,  3.0,  0.001, 0.3,  0.0,  0.2,  0.02 ]), // 6  Harpsichord
        FMPreset([1.0,  14.0, 1.5,  0.001, 0.5,  0.1,  0.4,  0.0  ]), // 7  DX Piano
        FMPreset([1.0,  2.0,  1.5,  0.001, 0.9,  0.25, 0.45, 0.0  ]), // 8  Stage Piano
        FMPreset([1.0,  4.0,  2.8,  0.002, 0.7,  0.18, 0.5,  0.03 ]), // 9  Vintage Keys

        // 10-19: Organ
        FMPreset([1.0,  1.0,  1.5,  0.005, 0.02, 0.9,  0.05, 0.12 ]), // 10 Jazz Organ
        FMPreset([1.0,  2.0,  2.5,  0.003, 0.02, 0.95, 0.04, 0.2  ]), // 11 Rock Organ
        FMPreset([1.0,  1.0,  0.6,  0.01,  0.05, 0.85, 0.1,  0.05 ]), // 12 Church Organ
        FMPreset([1.0,  3.0,  1.2,  0.008, 0.05, 0.8,  0.08, 0.15 ]), // 13 Reed Organ
        FMPreset([1.0,  1.0,  0.4,  0.015, 0.08, 0.75, 0.15, 0.03 ]), // 14 Pipe Organ
        FMPreset([1.0,  2.0,  1.8,  0.003, 0.02, 0.9,  0.04, 0.08 ]), // 15 Drawbar 1
        FMPreset([1.0,  4.0,  2.2,  0.003, 0.02, 0.88, 0.04, 0.1  ]), // 16 Drawbar 2
        FMPreset([1.0,  6.0,  1.0,  0.001, 0.3,  0.6,  0.05, 0.15 ]), // 17 Perc Organ
        FMPreset([1.0,  3.0,  1.5,  0.005, 0.02, 0.92, 0.06, 0.3  ]), // 18 Rotary Organ
        FMPreset([1.0,  5.0,  3.0,  0.003, 0.03, 0.85, 0.05, 0.25 ]), // 19 Full Organ

        // 20-29: Brass
        FMPreset([1.0,  1.0,  4.0,  0.04,  0.15, 0.7,  0.2,  0.2  ]), // 20 Trumpet
        FMPreset([1.0,  1.0,  3.5,  0.06,  0.2,  0.65, 0.3,  0.25 ]), // 21 Trombone
        FMPreset([1.0,  1.0,  2.5,  0.08,  0.25, 0.6,  0.4,  0.15 ]), // 22 French Horn
        FMPreset([1.0,  1.0,  5.0,  0.05,  0.15, 0.75, 0.25, 0.3  ]), // 23 Brass Sect
        FMPreset([1.0,  2.0,  4.5,  0.03,  0.1,  0.8,  0.2,  0.18 ]), // 24 Synth Brass 1
        FMPreset([1.0,  3.0,  6.0,  0.02,  0.08, 0.85, 0.15, 0.22 ]), // 25 Synth Brass 2
        FMPreset([1.0,  1.0,  2.0,  0.03,  0.12, 0.4,  0.15, 0.1  ]), // 26 Mute Trumpet
        FMPreset([1.0,  2.0,  3.0,  0.1,   0.3,  0.7,  0.6,  0.2  ]), // 27 Brass Pad
        FMPreset([1.0,  1.0,  7.0,  0.04,  0.12, 0.8,  0.2,  0.35 ]), // 28 Power Brass
        FMPreset([1.0,  1.0,  8.0,  0.02,  0.08, 0.85, 0.3,  0.4  ]), // 29 Fanfare

        // 30-39: Strings / Pads
        FMPreset([1.0,  2.0,  1.0,  0.15,  0.5,  0.7,  0.8,  0.02 ]), // 30 Strings
        FMPreset([1.0,  2.0,  0.8,  0.4,   0.8,  0.65, 1.2,  0.01 ]), // 31 Slow Strings
        FMPreset([1.0,  3.0,  1.5,  0.08,  0.4,  0.75, 0.6,  0.05 ]), // 32 Syn Strings 1
        FMPreset([1.0,  1.0,  2.0,  0.12,  0.5,  0.7,  0.8,  0.08 ]), // 33 Syn Strings 2
        FMPreset([1.0,  2.0,  0.5,  0.2,   0.6,  0.8,  1.5,  0.03 ]), // 34 Warm Pad
        FMPreset([1.0,  1.0,  0.3,  0.3,   1.0,  0.7,  1.8,  0.01 ]), // 35 Choir Pad
        FMPreset([1.0,  5.0,  1.2,  0.25,  0.8,  0.6,  2.0,  0.06 ]), // 36 Atmosphere
        FMPreset([1.0,  7.0,  2.0,  0.15,  0.4,  0.75, 1.0,  0.04 ]), // 37 Brightness Pad
        FMPreset([1.0,  3.0,  3.0,  0.5,   1.5,  0.5,  2.5,  0.1  ]), // 38 Sweep Pad
        FMPreset([1.0,  9.0,  1.0,  0.2,   0.6,  0.6,  2.0,  0.02 ]), // 39 Ice Pad

        // 40-49: Bass
        FMPreset([1.0,  1.0,  2.0,  0.001, 0.3,  0.2,  0.12, 0.05 ]), // 40 Finger Bass
        FMPreset([1.0,  3.0,  3.5,  0.001, 0.15, 0.1,  0.08, 0.1  ]), // 41 Pick Bass
        FMPreset([1.0,  1.0,  5.0,  0.001, 0.08, 0.05, 0.06, 0.2  ]), // 42 Slap Bass
        FMPreset([1.0,  1.0,  0.8,  0.005, 0.4,  0.35, 0.2,  0.0  ]), // 43 Fretless
        FMPreset([0.5,  1.0,  4.0,  0.001, 0.2,  0.25, 0.1,  0.15 ]), // 44 Synth Bass 1
        FMPreset([0.5,  2.0,  6.0,  0.001, 0.12, 0.2,  0.08, 0.3  ]), // 45 Synth Bass 2
        FMPreset([0.5,  3.0,  8.0,  0.001, 0.1,  0.15, 0.06, 0.4  ]), // 46 Acid Bass
        FMPreset([1.0,  1.0,  3.0,  0.001, 0.25, 0.3,  0.15, 0.5  ]), // 47 Rubber Bass
        FMPreset([0.5,  0.5,  1.5,  0.001, 0.5,  0.4,  0.2,  0.0  ]), // 48 Sub Bass
        FMPreset([0.5,  1.0,  7.0,  0.001, 0.08, 0.3,  0.1,  0.6  ]), // 49 Wobble Bass

        // 50-59: Lead
        FMPreset([1.0,  1.0,  0.5,  0.01,  0.08, 0.8,  0.15, 0.0  ]), // 50 Square Lead
        FMPreset([1.0,  1.0,  2.5,  0.01,  0.08, 0.85, 0.15, 0.1  ]), // 51 Saw Lead
        FMPreset([1.0,  2.0,  5.0,  0.005, 0.06, 0.9,  0.1,  0.15 ]), // 52 Sync Lead
        FMPreset([2.0,  1.0,  1.5,  0.01,  0.1,  0.7,  0.2,  0.0  ]), // 53 Calliope
        FMPreset([1.0,  4.0,  3.0,  0.001, 0.05, 0.6,  0.1,  0.08 ]), // 54 Chiffer
        FMPreset([1.0,  1.0,  6.0,  0.005, 0.06, 0.85, 0.12, 0.25 ]), // 55 Charang
        FMPreset([1.0,  1.0,  1.0,  0.02,  0.15, 0.75, 0.3,  0.02 ]), // 56 Solo Vox
        FMPreset([1.5,  1.0,  3.0,  0.01,  0.08, 0.8,  0.15, 0.12 ]), // 57 Fifth Lead
        FMPreset([0.5,  1.0,  4.0,  0.005, 0.1,  0.8,  0.15, 0.2  ]), // 58 Bass+Lead
        FMPreset([1.0,  3.0,  2.0,  0.01,  0.08, 0.85, 0.12, 0.08 ]), // 59 Poly Lead

        // 60-69: Bell / Mallet
        FMPreset([1.0,  3.5,  5.0,  0.001, 2.0,  0.0,  2.5,  0.0  ]), // 60 Tubular Bell
        FMPreset([1.0,  5.4,  3.0,  0.001, 1.0,  0.0,  1.5,  0.0  ]), // 61 Glockenspiel
        FMPreset([1.0,  7.0,  2.5,  0.001, 1.5,  0.0,  2.0,  0.01 ]), // 62 Music Box
        FMPreset([1.0,  4.0,  2.0,  0.001, 2.5,  0.05, 3.0,  0.0  ]), // 63 Vibraphone
        FMPreset([1.0,  4.0,  4.0,  0.001, 0.6,  0.0,  0.5,  0.02 ]), // 64 Marimba
        FMPreset([1.0,  3.0,  6.0,  0.001, 0.4,  0.0,  0.3,  0.03 ]), // 65 Xylophone
        FMPreset([1.0,  1.41, 7.0,  0.001, 1.2,  0.0,  1.5,  0.05 ]), // 66 Steel Drums
        FMPreset([1.0,  13.0, 1.5,  0.001, 3.0,  0.0,  3.5,  0.0  ]), // 67 Crystal
        FMPreset([1.0,  5.19, 3.5,  0.001, 0.8,  0.0,  0.6,  0.02 ]), // 68 Kalimba
        FMPreset([1.0,  11.0, 2.0,  0.001, 2.0,  0.0,  2.5,  0.01 ]), // 69 Tinkle Bell

        // 70-79: Reed / Pipe
        FMPreset([1.0,  1.0,  2.5,  0.02,  0.08, 0.7,  0.1,  0.3  ]), // 70 Harmonica
        FMPreset([1.0,  2.0,  2.0,  0.02,  0.08, 0.75, 0.1,  0.25 ]), // 71 Accordion
        FMPreset([1.0,  3.0,  3.0,  0.015, 0.06, 0.65, 0.08, 0.2  ]), // 72 Clarinet
        FMPreset([1.0,  2.0,  4.0,  0.02,  0.08, 0.6,  0.1,  0.15 ]), // 73 Oboe
        FMPreset([0.5,  1.0,  3.5,  0.03,  0.1,  0.55, 0.12, 0.2  ]), // 74 Bassoon
        FMPreset([2.0,  1.0,  1.0,  0.02,  0.05, 0.7,  0.1,  0.05 ]), // 75 Flute
        FMPreset([2.0,  1.0,  1.5,  0.015, 0.05, 0.65, 0.08, 0.08 ]), // 76 Recorder
        FMPreset([2.0,  1.0,  0.5,  0.03,  0.06, 0.6,  0.12, 0.02 ]), // 77 Pan Flute
        FMPreset([2.0,  1.0,  0.3,  0.04,  0.08, 0.5,  0.15, 0.01 ]), // 78 Bottle
        FMPreset([1.0,  2.0,  3.5,  0.03,  0.06, 0.55, 0.15, 0.35 ]), // 79 Shakuhachi

        // 80-89: SFX / Atmosphere
        FMPreset([1.0,  0.5,  1.0,  0.5,   2.0,  0.0,  3.0,  0.0  ]), // 80 Rain
        FMPreset([1.0,  1.41, 2.0,  0.3,   1.5,  0.4,  2.5,  0.1  ]), // 81 Soundtrack
        FMPreset([1.0,  7.0,  8.0,  0.01,  0.5,  0.6,  1.5,  0.5  ]), // 82 Sci-Fi
        FMPreset([1.0,  0.25, 3.0,  0.4,   1.0,  0.5,  2.0,  0.15 ]), // 83 Atmosphere 2
        FMPreset([1.0,  0.5,  10.0, 0.2,   0.8,  0.3,  1.5,  0.7  ]), // 84 Goblin
        FMPreset([1.0,  3.0,  2.0,  0.1,   3.0,  0.0,  4.0,  0.05 ]), // 85 Echo Drop
        FMPreset([1.0,  5.0,  4.0,  0.15,  1.0,  0.5,  2.0,  0.08 ]), // 86 Star Theme
        FMPreset([1.0,  1.5,  6.0,  0.05,  0.3,  0.4,  0.5,  0.4  ]), // 87 Sitar
        FMPreset([1.0,  11.0, 3.0,  0.001, 0.05, 0.0,  0.02, 0.0  ]), // 88 Telephone
        FMPreset([0.1,  0.3,  12.0, 0.8,   2.0,  0.3,  1.0,  0.9  ]), // 89 Helicopter

        // 90-98: Retro / Digital
        FMPreset([1.0,  2.0,  1.0,  0.001, 0.05, 0.4,  0.05, 0.3  ]), // 90 Chiptune 1
        FMPreset([1.0,  1.0,  0.3,  0.001, 0.04, 0.5,  0.04, 0.0  ]), // 91 Chiptune 2
        FMPreset([1.0,  3.0,  2.5,  0.001, 0.06, 0.35, 0.06, 0.4  ]), // 92 Chiptune 3
        FMPreset([1.0,  8.0,  1.5,  0.001, 0.03, 0.0,  0.03, 0.0  ]), // 93 Retro Beep
        FMPreset([1.0,  0.1,  15.0, 0.001, 0.15, 0.3,  0.1,  0.8  ]), // 94 Bit Crush
        FMPreset([1.0,  4.0,  3.0,  0.001, 0.08, 0.2,  0.05, 0.5  ]), // 95 Arcade
        FMPreset([1.0,  1.0,  5.0,  0.001, 1.5,  0.0,  2.0,  0.3  ]), // 96 Game Over
        FMPreset([2.0,  1.0,  2.0,  0.001, 0.4,  0.0,  0.3,  0.0  ]), // 97 Power Up
        FMPreset([1.0,  7.0,  3.0,  0.01,  0.1,  0.6,  0.15, 0.15 ]), // 98 Digital Vox
    ]
    // swiftlint:enable line_length

    public static func preset(at index: Int) -> FMPreset {
        all[min(max(index, 0), all.count - 1)]
    }
}
