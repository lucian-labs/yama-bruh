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
    /// Two-tier seeding: `appSeed` selects the timbre (preset), `seed` selects the melody.
    /// Same app + same ID = identical audio across restarts/reinstalls.
    ///
    /// Renders through the OPLL engine (per-operator envelopes, waveform select, LFOs).
    ///
    /// - Parameters:
    ///   - seed: Per-item seed (e.g. hash of task ID) — determines the note sequence
    ///   - appSeed: Per-app seed (e.g. hash of bundle ID) — prefixes patch + melody seeds
    ///   - patchSeed: Patch seed — determines timbre. If 0, derived from appSeed alone.
    ///   - presetIndex: Explicit preset override. If nil, derived from appSeed + patchSeed.
    ///   - mood: Sequence mood (pretty, spooky, etc.). Defaults to .experimental.
    ///   - bpm: Tempo in beats per minute
    ///   - sampleRate: Output sample rate in Hz
    /// - Returns: WAV file data
    public static func generate(
        seed: UInt32,
        appSeed: UInt32 = 0,
        patchSeed: UInt32 = 0,
        presetIndex: Int? = nil,
        mood: SequenceGenerator.Mood = .experimental,
        bpm: Float = defaultBPM,
        sampleRate: Float = defaultSampleRate
    ) -> Data {
        let effectivePreset: Int
        if let presetIndex {
            effectivePreset = presetIndex
        } else if appSeed != 0 || patchSeed != 0 {
            // Combine app + patch seeds for deterministic preset
            let combined = (appSeed &* 2654435761) ^ (patchSeed &* 2246822519)
            effectivePreset = Int(combined % UInt32(FMPresets.all.count))
        } else {
            effectivePreset = 0
        }

        let melodySeed = appSeed == 0 ? seed : seed ^ (appSeed &* 2654435761)

        let legacy = FMPresets.preset(at: effectivePreset)
        let preset = OPLLPreset(legacy)

        return renderSequence(preset: preset, melodySeed: melodySeed, mood: mood, bpm: bpm, sampleRate: sampleRate)
    }

    /// Generate a ringtone using a specific OPLLPreset (e.g. a PSS-170 patch).
    public static func generate(
        seed: UInt32,
        appSeed: UInt32 = 0,
        preset: OPLLPreset,
        mood: SequenceGenerator.Mood = .experimental,
        bpm: Float = defaultBPM,
        sampleRate: Float = defaultSampleRate
    ) -> Data {
        let melodySeed = appSeed == 0 ? seed : seed ^ (appSeed &* 2654435761)
        return renderSequence(preset: preset, melodySeed: melodySeed, mood: mood, bpm: bpm, sampleRate: sampleRate)
    }

    /// Generate a ringtone from string identifiers.
    public static func generate(
        from identifier: String,
        appIdentifier: String = "",
        patchIdentifier: String = "",
        presetIndex: Int? = nil,
        mood: SequenceGenerator.Mood = .experimental,
        bpm: Float = defaultBPM,
        sampleRate: Float = defaultSampleRate
    ) -> Data {
        let seed = SequenceGenerator.djb2Hash(identifier)
        let appSeed = appIdentifier.isEmpty ? 0 : SequenceGenerator.djb2Hash(appIdentifier)
        let patchSeed = patchIdentifier.isEmpty ? 0 : SequenceGenerator.djb2Hash(patchIdentifier)
        return generate(seed: seed, appSeed: appSeed, patchSeed: patchSeed, presetIndex: presetIndex, mood: mood, bpm: bpm, sampleRate: sampleRate)
    }

    /// Generate a ringtone from string identifiers with a specific OPLLPreset.
    public static func generate(
        from identifier: String,
        appIdentifier: String = "",
        preset: OPLLPreset,
        mood: SequenceGenerator.Mood = .experimental,
        bpm: Float = defaultBPM,
        sampleRate: Float = defaultSampleRate
    ) -> Data {
        let seed = SequenceGenerator.djb2Hash(identifier)
        let appSeed = appIdentifier.isEmpty ? 0 : SequenceGenerator.djb2Hash(appIdentifier)
        return generate(seed: seed, appSeed: appSeed, preset: preset, mood: mood, bpm: bpm, sampleRate: sampleRate)
    }

    // MARK: - Internal

    private static func renderSequence(
        preset: OPLLPreset, melodySeed: UInt32,
        mood: SequenceGenerator.Mood = .experimental,
        bpm: Float, sampleRate: Float
    ) -> Data {
        let beatDuration = 60.0 / bpm
        let notes = SequenceGenerator.generate(seed: melodySeed, mood: mood)

        var totalDuration: Float = 0
        for note in notes {
            totalDuration += note.durationBeats * beatDuration
        }
        totalDuration += preset.carrier.release
        totalDuration = min(totalDuration, maxDuration)

        let totalSamples = Int(totalDuration * sampleRate)
        var buffer = [Float](repeating: 0, count: totalSamples)

        var offset = 0
        for note in notes {
            let freq = FMSynth.midiToFreq(note.midiNote)
            let durationSecs = note.durationBeats * beatDuration

            OPLLSynth.renderNote(
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
}
