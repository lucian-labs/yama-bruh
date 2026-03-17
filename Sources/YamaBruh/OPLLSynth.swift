import Foundation

private let TWO_PI: Float = .pi * 2

/// 2-operator FM synthesis with per-operator OPLL envelopes.
/// Drop-in replacement for FMSynth when using OPLLPreset.
public enum OPLLSynth {

    /// Render a single FM note into a buffer, additively (+=).
    @discardableResult
    public static func renderNote(
        freq: Float,
        duration: Float,
        preset: OPLLPreset,
        sampleRate: Float,
        buffer: inout [Float],
        offset: Int,
        velocity: Float = 0.8
    ) -> Int {
        let mOp = preset.modulator
        let cOp = preset.carrier

        let mFreqBase = freq * mOp.mult
        let cFreqBase = freq * cOp.mult

        // Envelope sample counts
        let mAS = max(Int(mOp.attack * sampleRate), 1)
        let mDS = max(Int(mOp.decay * sampleRate), 1)
        let mRS = max(Int(mOp.release * sampleRate), 1)
        let cAS = max(Int(cOp.attack * sampleRate), 1)
        let cDS = max(Int(cOp.decay * sampleRate), 1)
        let cRS = max(Int(cOp.release * sampleRate), 1)

        let noteSamples = Int(duration * sampleRate)
        let releaseDur = max(cOp.release, mOp.release)
        let totalSamples = Int((duration + releaseDur) * sampleRate)

        let available = max(buffer.count - offset, 0)
        let count = min(totalSamples, available)
        guard count > 0 else { return 0 }

        var cPhase: Float = 0
        var mPhase: Float = 0
        var prevMod: Float = 0
        var vibPhase: Float = 0
        var tremPhase: Float = 0

        for i in 0..<count {
            let released = i >= noteSamples
            let relOffset = released ? (i - noteSamples) : 0

            // LFOs
            let vibMod = sinf(vibPhase) * 0.008
            let tremMod = 1.0 - (1.0 + sinf(tremPhase)) * 0.055

            // Modulator envelope
            let modEnv = opEnvelope(
                op: mOp, sampleIndex: i, noteReleased: released,
                releaseOffset: relOffset, aS: mAS, dS: mDS, rS: mRS)

            // Carrier envelope
            let carEnv = opEnvelope(
                op: cOp, sampleIndex: i, noteReleased: released,
                releaseOffset: relOffset, aS: cAS, dS: cDS, rS: cRS)

            if i > 0 && carEnv <= 0 && modEnv <= 0 { break }

            // Frequencies with vibrato
            let mFreq = mFreqBase * (mOp.vibrato ? (1.0 + vibMod) : 1.0)
            let cFreq = cFreqBase * (cOp.vibrato ? (1.0 + vibMod) : 1.0)

            // Modulator
            let modRaw = wave(mPhase + preset.feedback * prevMod, mOp.waveform)
            let modTrem = mOp.tremolo ? tremMod : 1.0
            let modOut = modRaw * modEnv * modTrem
            prevMod = modRaw

            // Carrier
            let carRaw = wave(cPhase + preset.modDepth * modOut, cOp.waveform)
            let carTrem = cOp.tremolo ? tremMod : 1.0

            buffer[offset + i] += carRaw * carEnv * carTrem * velocity * 0.45

            cPhase += TWO_PI * cFreq / sampleRate
            mPhase += TWO_PI * mFreq / sampleRate
            if cPhase > TWO_PI { cPhase -= TWO_PI }
            if mPhase > TWO_PI { mPhase -= TWO_PI }

            vibPhase += TWO_PI * 6.4 / sampleRate
            tremPhase += TWO_PI * 3.7 / sampleRate
            if vibPhase > TWO_PI { vibPhase -= TWO_PI }
            if tremPhase > TWO_PI { tremPhase -= TWO_PI }
        }
        return count
    }

    @inline(__always)
    private static func wave(_ phase: Float, _ wf: Int) -> Float {
        let s = sinf(phase)
        return wf == 1 ? max(s, 0) : s
    }

    @inline(__always)
    private static func opEnvelope(
        op: OPLLOperator, sampleIndex: Int, noteReleased: Bool,
        releaseOffset: Int, aS: Int, dS: Int, rS: Int
    ) -> Float {
        let inRelease: Bool
        let rOff: Int
        let noteOffSample: Int
        if op.sustained {
            inRelease = noteReleased
            rOff = releaseOffset
            noteOffSample = sampleIndex - releaseOffset
        } else {
            let autoStart = aS + dS
            inRelease = sampleIndex >= autoStart
            rOff = sampleIndex - autoStart
            noteOffSample = autoStart
        }

        if inRelease {
            let t = Float(rOff) / Float(rS)
            if t >= 1.0 { return 0 }
            // Compute the level at the moment of release, fade from there
            let levelAtRelease: Float
            if noteOffSample < aS {
                levelAtRelease = Float(noteOffSample) / Float(aS)
            } else if noteOffSample < aS + dS {
                let dt = Float(noteOffSample - aS) / Float(dS)
                levelAtRelease = 1.0 - (1.0 - op.sustainLevel) * dt
            } else {
                levelAtRelease = op.sustainLevel
            }
            return levelAtRelease * (1.0 - t)
        } else if sampleIndex < aS {
            return Float(sampleIndex) / Float(aS)
        } else if sampleIndex < aS + dS {
            let t = Float(sampleIndex - aS) / Float(dS)
            return 1.0 - (1.0 - op.sustainLevel) * t
        } else {
            return op.sustainLevel
        }
    }
}
