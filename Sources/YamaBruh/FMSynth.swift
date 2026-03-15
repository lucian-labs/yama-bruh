import Foundation

private let TWO_PI: Float = .pi * 2

/// 2-operator FM synthesis engine. Stateless — all state lives in the sample buffer.
public enum FMSynth {

    /// Convert MIDI note number to frequency in Hz
    public static func midiToFreq(_ note: Float) -> Float {
        440.0 * powf(2.0, (note - 69.0) / 12.0)
    }

    /// Render a single FM note into a buffer, additively (+=).
    /// Returns the number of samples written.
    @discardableResult
    public static func renderNote(
        freq: Float,
        duration: Float,
        preset: FMPreset,
        sampleRate: Float,
        buffer: inout [Float],
        offset: Int,
        velocity: Float = 0.8
    ) -> Int {
        let carrierFreq = freq * preset.carrierRatio
        let modFreq = freq * preset.modRatio
        let mi = preset.modIndex
        let feedback = preset.feedback

        let totalSamples = Int((duration + preset.release) * sampleRate)
        let noteSamples = Int(duration * sampleRate)
        let attackSamples = Int(preset.attack * sampleRate)
        let decaySamples = Int(preset.decay * sampleRate)

        let available = max(buffer.count - offset, 0)
        let count = min(totalSamples, available)
        guard count > 0 else { return 0 }

        var carrierPhase: Float = 0
        var modPhase: Float = 0
        var prevMod: Float = 0

        for i in 0..<count {
            // ADSR envelope
            let env: Float
            if i < attackSamples {
                env = Float(i) / Float(max(attackSamples, 1))
            } else if i < attackSamples + decaySamples {
                let t = Float(i - attackSamples) / Float(max(decaySamples, 1))
                env = 1.0 - (1.0 - preset.sustain) * t
            } else if i < noteSamples {
                env = preset.sustain
            } else {
                let relMax = max(preset.release * sampleRate, 1.0)
                let t = Float(i - noteSamples) / relMax
                env = max(preset.sustain * (1.0 - t), 0)
            }

            // 2-op FM
            let modSignal = sinf(modPhase + feedback * prevMod)
            prevMod = modSignal
            let carrierSignal = sinf(carrierPhase + mi * modSignal)

            buffer[offset + i] += carrierSignal * env * velocity * 0.45

            carrierPhase += TWO_PI * carrierFreq / sampleRate
            modPhase += TWO_PI * modFreq / sampleRate

            if carrierPhase > TWO_PI { carrierPhase -= TWO_PI }
            if modPhase > TWO_PI { modPhase -= TWO_PI }
        }

        return count
    }
}
