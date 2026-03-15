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

    /// Generate a deterministic note sequence from a seed.
    /// Produces 3-5 notes starting from F# in a random octave, with relative interval movements.
    public static func generate(seed: UInt32) -> [Note] {
        let numNotes = 3 + (seed % 3)
        var rng = Rng(seed: seed)

        // Start on F# in a random octave (F#3=54, F#4=66, F#5=78)
        let octaveOffset = Int(rng.range(3)) * 12
        var currentNote: Int32 = 54 + Int32(octaveOffset)

        let movements: [Int32] = [0, 2, -2, 3, -3, 4, -4, 6, -6]
        let durations: [Float] = [0.125, 0.25, 0.5, 1.0, 2.0]

        var notes: [Note] = []
        for _ in 0..<numNotes {
            let mv = movements[Int(rng.range(9))]
            currentNote += mv
            if currentNote < 42 { currentNote += 12 }
            if currentNote > 84 { currentNote -= 12 }

            let dur = durations[Int(rng.range(5))]
            notes.append(Note(midiNote: Float(currentNote), durationBeats: dur))
        }
        return notes
    }
}
