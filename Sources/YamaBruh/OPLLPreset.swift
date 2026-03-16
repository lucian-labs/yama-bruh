import Foundation

/// Per-operator parameters matching the Yamaha YM2413 (OPLL) register set.
public struct OPLLOperator: Sendable, Codable, Equatable {
    public var mult: Float           // frequency multiplier (0.5, 1-15)
    public var attack: Float         // seconds
    public var decay: Float          // seconds
    public var sustainLevel: Float   // 0-1 linear amplitude
    public var release: Float        // seconds
    public var waveform: Int         // 0=sine, 1=half-rectified sine
    public var vibrato: Bool
    public var tremolo: Bool
    public var sustained: Bool       // true=sustained envelope, false=percussive

    public init(
        mult: Float = 1.0, attack: Float = 0.001, decay: Float = 0.5,
        sustainLevel: Float = 1.0, release: Float = 0.5,
        waveform: Int = 0, vibrato: Bool = false, tremolo: Bool = false,
        sustained: Bool = true
    ) {
        self.mult = mult; self.attack = attack; self.decay = decay
        self.sustainLevel = sustainLevel; self.release = release
        self.waveform = waveform; self.vibrato = vibrato
        self.tremolo = tremolo; self.sustained = sustained
    }

    /// "Always on" modulator (static timbre — matches legacy single-ADSR behavior)
    public static func staticMod(mult: Float) -> OPLLOperator {
        OPLLOperator(mult: mult, attack: 0.001, decay: 99, sustainLevel: 1,
                     release: 99, waveform: 0, vibrato: false, tremolo: false, sustained: true)
    }
}

/// Full 2-operator FM preset with per-operator envelopes (OPLL-style).
public struct OPLLPreset: Sendable, Codable, Equatable {
    public var modulator: OPLLOperator
    public var carrier: OPLLOperator
    public var modDepth: Float       // radians of max phase deviation
    public var feedback: Float       // radians of modulator self-feedback

    public init(
        modulator: OPLLOperator = OPLLOperator(),
        carrier: OPLLOperator = OPLLOperator(),
        modDepth: Float = 1.0,
        feedback: Float = 0.0
    ) {
        self.modulator = modulator; self.carrier = carrier
        self.modDepth = modDepth; self.feedback = feedback
    }

    /// Construct from a legacy FMPreset (modulator gets static envelope).
    public init(_ legacy: FMPreset) {
        modulator = .staticMod(mult: legacy.modRatio)
        carrier = OPLLOperator(
            mult: legacy.carrierRatio,
            attack: legacy.attack, decay: legacy.decay,
            sustainLevel: legacy.sustain, release: legacy.release
        )
        modDepth = legacy.modIndex
        feedback = legacy.feedback
    }

    /// Lossy conversion back to legacy FMPreset (drops per-op detail).
    public func toLegacy() -> FMPreset {
        FMPreset([carrier.mult, modulator.mult, modDepth,
                  carrier.attack, carrier.decay, carrier.sustainLevel,
                  carrier.release, feedback])
    }

    /// Convert raw YM2413 register bytes [R#00..R#07] to OPLLPreset.
    public static func fromRegisters(_ r: [UInt8]) -> OPLLPreset {
        func arTime(_ rate: Int) -> Float {
            [99, 5, 3, 1.8, 1.0, 0.6, 0.35, 0.2,
             0.12, 0.07, 0.04, 0.02, 0.01, 0.005, 0.003, 0.001][min(rate, 15)]
        }
        func drTime(_ rate: Int) -> Float {
            [99, 30, 18, 10, 6, 3.5, 2.0, 1.0,
             0.5, 0.3, 0.15, 0.08, 0.04, 0.02, 0.01, 0.005][min(rate, 15)]
        }
        func slLevel(_ sl: Int) -> Float { powf(10, Float(-3 * sl) / 20.0) }
        func multVal(_ m: Int) -> Float { m == 0 ? 0.5 : Float(m) }

        let modAM  = (r[0] & 0x80) != 0
        let modVIB = (r[0] & 0x40) != 0
        let modEG  = (r[0] & 0x20) != 0
        let modMULT = Int(r[0] & 0x0F)

        let carAM  = (r[1] & 0x80) != 0
        let carVIB = (r[1] & 0x40) != 0
        let carEG  = (r[1] & 0x20) != 0
        let carMULT = Int(r[1] & 0x0F)

        let modTL = Int(r[2] & 0x3F)
        let carWF = (r[3] & 0x20) != 0 ? 1 : 0
        let modWF = (r[3] & 0x10) != 0 ? 1 : 0
        let fbRaw = Int((r[3] >> 1) & 0x07)
        let fbTable: [Float] = [0, .pi/16, .pi/8, .pi/4, .pi/2, .pi, 2 * .pi, 4 * .pi]

        let modAR = Int((r[4] >> 4) & 0x0F); let modDR = Int(r[4] & 0x0F)
        let carAR = Int((r[5] >> 4) & 0x0F); let carDR = Int(r[5] & 0x0F)
        let modSL = Int((r[6] >> 4) & 0x0F); let modRR = Int(r[6] & 0x0F)
        let carSL = Int((r[7] >> 4) & 0x0F); let carRR = Int(r[7] & 0x0F)

        let tlLinear = powf(10, Float(-0.75 * Float(modTL)) / 20.0)

        let mod = OPLLOperator(
            mult: multVal(modMULT), attack: arTime(modAR), decay: drTime(modDR),
            sustainLevel: slLevel(modSL), release: drTime(modRR),
            waveform: modWF, vibrato: modVIB, tremolo: modAM, sustained: modEG)
        let car = OPLLOperator(
            mult: multVal(carMULT), attack: arTime(carAR), decay: drTime(carDR),
            sustainLevel: slLevel(carSL), release: drTime(carRR),
            waveform: carWF, vibrato: carVIB, tremolo: carAM, sustained: carEG)

        return OPLLPreset(modulator: mod, carrier: car,
                          modDepth: tlLinear * 4 * .pi, feedback: fbTable[fbRaw])
    }
}
