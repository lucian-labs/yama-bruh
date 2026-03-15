import Foundation

/// Encodes a float sample buffer as 16-bit PCM WAV data.
public enum WavWriter {

    /// Convert a float sample buffer (range -1…1) to WAV file data.
    /// - Parameters:
    ///   - samples: Audio samples in -1.0…1.0 range
    ///   - sampleRate: Sample rate in Hz (e.g. 44100)
    ///   - channels: Number of channels (1 = mono, 2 = stereo)
    /// - Returns: Complete WAV file as `Data`, ready to write to disk
    public static func encode(samples: [Float], sampleRate: Int = 44100, channels: Int = 1) -> Data {
        let bitsPerSample = 16
        let bytesPerSample = bitsPerSample / 8
        let dataSize = samples.count * bytesPerSample * channels
        let headerSize = 44

        var data = Data(capacity: headerSize + dataSize)

        // RIFF header
        data.append(contentsOf: "RIFF".utf8)
        appendUInt32(&data, UInt32(headerSize - 8 + dataSize))
        data.append(contentsOf: "WAVE".utf8)

        // fmt chunk
        data.append(contentsOf: "fmt ".utf8)
        appendUInt32(&data, 16)                                          // chunk size
        appendUInt16(&data, 1)                                           // PCM format
        appendUInt16(&data, UInt16(channels))
        appendUInt32(&data, UInt32(sampleRate))
        appendUInt32(&data, UInt32(sampleRate * channels * bytesPerSample)) // byte rate
        appendUInt16(&data, UInt16(channels * bytesPerSample))           // block align
        appendUInt16(&data, UInt16(bitsPerSample))

        // data chunk
        data.append(contentsOf: "data".utf8)
        appendUInt32(&data, UInt32(dataSize))

        // PCM samples
        for sample in samples {
            let clamped = max(-1.0, min(1.0, sample))
            let int16 = Int16(clamped * 32767)
            appendInt16(&data, int16)
        }

        return data
    }

    private static func appendUInt32(_ data: inout Data, _ value: UInt32) {
        var v = value.littleEndian
        data.append(Data(bytes: &v, count: 4))
    }

    private static func appendUInt16(_ data: inout Data, _ value: UInt16) {
        var v = value.littleEndian
        data.append(Data(bytes: &v, count: 2))
    }

    private static func appendInt16(_ data: inout Data, _ value: Int16) {
        var v = value.littleEndian
        data.append(Data(bytes: &v, count: 2))
    }
}
