import Foundation

/// XORShift PRNG — identical to Rust implementation for deterministic cross-platform output.
struct Rng {
    var state: UInt32

    init(seed: UInt32) {
        state = seed == 0 ? 1 : seed
    }

    mutating func next() -> UInt32 {
        state ^= state << 13
        state ^= state >> 17
        state ^= state << 5
        return state
    }

    mutating func range(_ n: UInt32) -> UInt32 {
        next() % n
    }
}

/// Deterministic note sequence generator from a seed value.
public enum SequenceGenerator {

    /// A single note in a generated sequence.
    public struct Note {
        public let midiNote: Float
        public let durationBeats: Float
    }

    /// DJB2 hash — matches the Rust/WASM `hash_input` for cross-platform seed compatibility.
    public static func djb2Hash(_ string: String) -> UInt32 {
        var hash: UInt32 = 5381
        for byte in string.utf8 {
            hash = hash &* 33 &+ UInt32(byte)
        }
        return hash
    }

    // MARK: - Scales (semitone intervals within one octave)

    static let scales: [String: [Int]] = [
        "major":          [0,2,4,5,7,9,11],
        "dorian":         [0,2,3,5,7,9,10],
        "phrygian":       [0,1,3,5,7,8,10],
        "lydian":         [0,2,4,6,7,9,11],
        "mixolydian":     [0,2,4,5,7,9,10],
        "aeolian":        [0,2,3,5,7,8,10],
        "locrian":        [0,1,3,5,6,8,10],
        "harmonicMinor":  [0,2,3,5,7,8,11],
        "melodicMinor":   [0,2,3,5,7,9,11],
        "pentMajor":      [0,2,4,7,9],
        "pentMinor":      [0,3,5,7,10],
        "blues":          [0,3,5,6,7,10],
        "wholeTone":      [0,2,4,6,8,10],
        "doubleHarmonic": [0,1,4,5,7,8,11],
        "hungarianMinor": [0,2,3,6,7,8,11],
        "phrygianDom":    [0,1,4,5,7,8,10],
        "neapolitanMin":  [0,1,3,4,7,8,10],
        "neapolitanMaj":  [0,1,3,5,7,9,11],
        "altered":        [0,1,3,5,6,8,10],
        "prometheus":     [0,2,4,6,9,10],
        "kumoi":          [0,2,3,7,8],
        "japanese":       [0,2,3,7,9],
        "hirajoshi":      [0,1,5,7,10],
        "iwato":          [0,1,3,7,8],
        "enigmatic":      [0,1,3,6,7,9,10],
        "persian":        [0,1,4,6,8,10,11],
        "arabian":        [0,2,4,5,6,8,10],
        "pelog":          [0,1,3,4,7,9,10],
        "gypsy":          [0,2,3,6,7,8,10],
        "flamenco":       [0,1,4,5,7,8,11],
        "bebopDom":       [0,2,4,5,7,9,10,11],
        "lydianDom":      [0,2,4,6,7,9,10],
        "bluesMajor":     [0,3,4,7,9,10],
        "dimWH":          [0,2,3,5,6,8,9,11],
        "dimHW":          [0,1,3,4,6,7,9,10],
        "augmented":      [0,4,6,7,11],
        "egyptian":       [0,2,5,7,10],
        "balinese":       [0,1,5,7,8],
        "bebopMinor":     [0,2,3,5,7,8,10,11],
    ]

    // Stable key ordering so RNG picks are deterministic across runs
    static let scaleKeys: [String] = [
        "major","dorian","phrygian","lydian","mixolydian","aeolian","locrian",
        "harmonicMinor","melodicMinor","pentMajor","pentMinor","blues","wholeTone",
        "doubleHarmonic","hungarianMinor","phrygianDom","neapolitanMin","neapolitanMaj",
        "altered","prometheus","kumoi","japanese","hirajoshi","iwato","enigmatic",
        "persian","arabian","pelog","gypsy","flamenco","bebopDom","lydianDom",
        "bluesMajor","dimWH","dimHW","augmented","egyptian","balinese","bebopMinor",
    ]

    // MARK: - Moods

    public enum Mood: String, CaseIterable {
        case pretty, experimental, depressing, spooky, dreamy
        case aggressive, exotic, jazzy, ethereal, mechanical
    }

    struct MoodConfig {
        let scalePool: [String]?   // nil = all scales
        let movements: [Int32]
        let durations: [Float]
        let noteRange: (Int, Int)  // (min, max) inclusive
        let rootBase: Int32
        let rootSpread: UInt32     // number of octave offsets to pick from
        let resolve: Bool
    }

    static func moodConfig(for mood: Mood) -> MoodConfig {
        switch mood {
        case .pretty:
            return MoodConfig(
                scalePool: ["pentMajor","pentMinor","major","lydian","mixolydian"],
                movements: [1,-1,2,-2,1,-1,2,-2,0,3,-3],
                durations: [0.25,0.25,0.5,0.5,1.0],
                noteRange: (4,6), rootBase: 60, rootSpread: 3, resolve: true)
        case .experimental:
            return MoodConfig(
                scalePool: nil,
                movements: [0,2,-2,3,-3,4,-4,6,-6],
                durations: [0.125,0.25,0.5,1.0,2.0],
                noteRange: (3,5), rootBase: 54, rootSpread: 3, resolve: false)
        case .depressing:
            return MoodConfig(
                scalePool: ["aeolian","harmonicMinor","phrygian","pentMinor","locrian","neapolitanMin"],
                movements: [-1,-2,1,-1,-2,-3,0,-1,2],
                durations: [0.5,0.5,1.0,1.0,2.0],
                noteRange: (3,5), rootBase: 48, rootSpread: 2, resolve: false)
        case .spooky:
            return MoodConfig(
                scalePool: ["dimWH","dimHW","wholeTone","locrian","altered","hungarianMinor","iwato","enigmatic"],
                movements: [1,-1,3,-3,6,-6,4,-4,0],
                durations: [0.25,0.5,0.5,1.0,0.125],
                noteRange: (3,5), rootBase: 48, rootSpread: 4, resolve: false)
        case .dreamy:
            return MoodConfig(
                scalePool: ["lydian","pentMajor","wholeTone","major","mixolydian"],
                movements: [1,-1,2,-2,0,1,-1,3,2],
                durations: [0.5,0.5,1.0,1.0,2.0],
                noteRange: (4,6), rootBase: 60, rootSpread: 2, resolve: true)
        case .aggressive:
            return MoodConfig(
                scalePool: ["phrygian","phrygianDom","blues","dimHW","flamenco","hungarianMinor"],
                movements: [2,-2,3,-3,4,-4,6,-6,1],
                durations: [0.125,0.125,0.25,0.25,0.5],
                noteRange: (4,6), rootBase: 42, rootSpread: 3, resolve: false)
        case .exotic:
            return MoodConfig(
                scalePool: ["doubleHarmonic","persian","arabian","pelog","gypsy","flamenco","hirajoshi","kumoi","japanese","balinese"],
                movements: [1,-1,2,-2,3,-3,0,1,4],
                durations: [0.25,0.25,0.5,0.5,1.0],
                noteRange: (3,5), rootBase: 54, rootSpread: 3, resolve: false)
        case .jazzy:
            return MoodConfig(
                scalePool: ["dorian","mixolydian","lydianDom","bebopDom","bebopMinor","melodicMinor","bluesMajor","blues"],
                movements: [1,-1,2,-2,3,-3,4,0,-4],
                durations: [0.25,0.25,0.5,0.125,0.5],
                noteRange: (4,6), rootBase: 54, rootSpread: 3, resolve: true)
        case .ethereal:
            return MoodConfig(
                scalePool: ["wholeTone","pentMajor","lydian","augmented","prometheus"],
                movements: [2,-2,3,-3,1,-1,0,4,5],
                durations: [0.5,1.0,1.0,2.0,0.5],
                noteRange: (3,5), rootBase: 60, rootSpread: 3, resolve: true)
        case .mechanical:
            return MoodConfig(
                scalePool: ["dimWH","dimHW","wholeTone","augmented"],
                movements: [1,1,-1,-1,2,-2,3,0,0],
                durations: [0.125,0.25,0.125,0.25,0.5],
                noteRange: (5,8), rootBase: 54, rootSpread: 2, resolve: false)
        }
    }

    // MARK: - Generation

    /// Generate a deterministic note sequence from a seed, using a mood to shape the output.
    public static func generate(seed: UInt32, mood: Mood = .experimental) -> [Note] {
        var rng = Rng(seed: seed)
        let cfg = moodConfig(for: mood)

        // Pick scale from pool
        let pool = cfg.scalePool ?? scaleKeys
        let baseScale = scales[pool[Int(rng.range(UInt32(pool.count)))]]!

        // Pick a random mode (rotate the scale)
        let modeIdx = Int(rng.range(UInt32(baseScale.count)))
        let root12 = baseScale[modeIdx]
        var scale: [Int] = []
        for i in 0..<baseScale.count {
            let idx = (modeIdx + i) % baseScale.count
            var semitone = baseScale[idx] - root12
            if semitone < 0 { semitone += 12 }
            scale.append(semitone)
        }
        scale.sort()

        // Map a scale degree (can span octaves) to semitones from root
        func degToSemitone(_ deg: Int) -> Int {
            let len = scale.count
            let oct = deg >= 0 ? deg / len : (deg - len + 1) / len
            var idx = deg % len
            if idx < 0 { idx += len }
            return oct * 12 + scale[idx]
        }

        let noteRangeSpan = cfg.noteRange.1 - cfg.noteRange.0 + 1
        let numNotes = cfg.noteRange.0 + Int(seed % UInt32(noteRangeSpan))
        let octaveOffset = Int32(rng.range(cfg.rootSpread)) * 12
        let rootMidi = cfg.rootBase + octaveOffset
        var currentDeg = Int(rng.range(UInt32(scale.count)))

        var notes: [Note] = []
        for i in 0..<numNotes {
            if cfg.resolve && i == numNotes - 1 {
                // Resolve to consonant degree: root, 3rd, or octave
                let targets = [0, 2, scale.count]
                currentDeg = targets[Int(rng.range(UInt32(targets.count)))]
            } else {
                let mv = cfg.movements[Int(rng.range(UInt32(cfg.movements.count)))]
                currentDeg += Int(mv)
            }

            var note = rootMidi + Int32(degToSemitone(currentDeg))
            if note < 42 { note += 12 }
            if note > 84 { note -= 12 }

            let dur = cfg.durations[Int(rng.range(UInt32(cfg.durations.count)))]
            notes.append(Note(midiNote: Float(note), durationBeats: dur))
        }
        return notes
    }

    /// Legacy overload — defaults to experimental mood for backwards compatibility.
    public static func generate(seed: UInt32) -> [Note] {
        generate(seed: seed, mood: .experimental)
    }
}
