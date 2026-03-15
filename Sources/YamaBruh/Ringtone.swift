import Foundation

/// High-level API for generating ringtones as WAV data.
public enum Ringtone {

    /// Default sample rate for notification sounds (44.1kHz)
    public static let defaultSampleRate: Float = 44100

    /// Default BPM for generated ringtones
    public static let defaultBPM: Float = 120

    /// Maximum duration in seconds (iOS notification sounds must be ≤ 30s)
    public static let maxDuration: Float = 5.0

    /// Generate a complete ringtone as WAV `Data`.
    ///
    /// Deterministic: same seed + preset always produces identical audio.
    ///
    /// - Parameters:
    ///   - seed: Seed value for deterministic generation (e.g. hash of task ID)
    ///   - presetIndex: Index into the 99 FM presets (0-98)
    ///   - bpm: Tempo in beats per minute
    ///   - sampleRate: Output sample rate in Hz
    /// - Returns: WAV file data
    public static func generate(
        seed: UInt32,
        presetIndex: Int = 0,
        bpm: Float = defaultBPM,
        sampleRate: Float = defaultSampleRate
    ) -> Data {
        let preset = FMPresets.preset(at: presetIndex)
        let beatDuration = 60.0 / bpm
        let notes = SequenceGenerator.generate(seed: seed)

        // Calculate total duration
        var totalDuration: Float = 0
        for note in notes {
            totalDuration += note.durationBeats * beatDuration
        }
        totalDuration += preset.release
        totalDuration = min(totalDuration, maxDuration)

        let totalSamples = Int(totalDuration * sampleRate)
        var buffer = [Float](repeating: 0, count: totalSamples)

        var offset = 0
        for note in notes {
            let freq = FMSynth.midiToFreq(note.midiNote)
            let durationSecs = note.durationBeats * beatDuration

            FMSynth.renderNote(
                freq: freq,
                duration: durationSecs,
                preset: preset,
                sampleRate: sampleRate,
                buffer: &buffer,
                offset: offset,
                velocity: 0.8
            )
            offset += Int(durationSecs * sampleRate)
        }

        return WavWriter.encode(samples: buffer, sampleRate: Int(sampleRate))
    }

    /// Generate a ringtone from a string identifier (e.g. task ID, user ID).
    /// Uses DJB2 hash for cross-platform seed compatibility with the Rust/WASM engine.
    public static func generate(
        from identifier: String,
        presetIndex: Int = 0,
        bpm: Float = defaultBPM,
        sampleRate: Float = defaultSampleRate
    ) -> Data {
        let seed = SequenceGenerator.djb2Hash(identifier)
        return generate(seed: seed, presetIndex: presetIndex, bpm: bpm, sampleRate: sampleRate)
    }
}
