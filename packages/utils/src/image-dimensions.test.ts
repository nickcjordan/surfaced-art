import { describe, it, expect } from 'vitest'
import { readImageDimensions } from './image-dimensions'

// ─── Helper: build minimal image buffers for testing ─────────────────

/** Build a minimal valid PNG buffer with given dimensions. */
function makePng(width: number, height: number): Buffer {
  const buf = Buffer.alloc(24)
  // PNG signature
  buf[0] = 0x89
  buf[1] = 0x50 // P
  buf[2] = 0x4e // N
  buf[3] = 0x47 // G
  buf[4] = 0x0d
  buf[5] = 0x0a
  buf[6] = 0x1a
  buf[7] = 0x0a
  // IHDR chunk length (placeholder)
  buf.writeUInt32BE(13, 8)
  // IHDR chunk type
  buf.write('IHDR', 12, 'ascii')
  // Width at offset 16, height at offset 20
  buf.writeUInt32BE(width, 16)
  buf.writeUInt32BE(height, 20)
  return buf
}

/** Build a minimal valid JPEG buffer with SOF0 marker at given dimensions. */
function makeJpeg(width: number, height: number): Buffer {
  // SOI + APP0 (minimal) + SOF0 with dimensions
  const buf = Buffer.alloc(20)
  // SOI marker
  buf[0] = 0xff
  buf[1] = 0xd8
  // APP0 marker
  buf[2] = 0xff
  buf[3] = 0xe0
  // APP0 segment length (small)
  buf.writeUInt16BE(4, 4)
  // SOF0 marker at offset 8 (after SOI + APP0)
  buf[8] = 0xff
  buf[9] = 0xc0
  // SOF0 segment length
  buf.writeUInt16BE(8, 10)
  // Precision byte
  buf[12] = 8
  // Height at offset 13, width at offset 15
  buf.writeUInt16BE(height, 13)
  buf.writeUInt16BE(width, 15)
  return buf
}

/** Build a minimal valid JPEG buffer with SOF2 (progressive) marker. */
function makeJpegProgressive(width: number, height: number): Buffer {
  const buf = Buffer.alloc(20)
  buf[0] = 0xff
  buf[1] = 0xd8
  buf[2] = 0xff
  buf[3] = 0xe0
  buf.writeUInt16BE(4, 4)
  buf[8] = 0xff
  buf[9] = 0xc2 // SOF2
  buf.writeUInt16BE(8, 10)
  buf[12] = 8
  buf.writeUInt16BE(height, 13)
  buf.writeUInt16BE(width, 15)
  return buf
}

/** Build a minimal VP8 (lossy) WebP buffer. */
function makeWebpVp8(width: number, height: number): Buffer {
  const buf = Buffer.alloc(30)
  buf.write('RIFF', 0, 'ascii')
  buf.writeUInt32LE(22, 4) // file size - 8
  buf.write('WEBP', 8, 'ascii')
  buf.write('VP8 ', 12, 'ascii')
  buf.writeUInt32LE(10, 16) // chunk size
  // VP8 bitstream header (3 bytes frame tag + 3 bytes sync code)
  buf[20] = 0x9d
  buf[21] = 0x01
  buf[22] = 0x2a
  // Width and height at offsets 26 and 28 (LE, 14-bit)
  buf.writeUInt16LE(width & 0x3fff, 26)
  buf.writeUInt16LE(height & 0x3fff, 28)
  return buf
}

/** Build a minimal VP8L (lossless) WebP buffer. */
function makeWebpVp8l(width: number, height: number): Buffer {
  const buf = Buffer.alloc(25)
  buf.write('RIFF', 0, 'ascii')
  buf.writeUInt32LE(17, 4)
  buf.write('WEBP', 8, 'ascii')
  buf.write('VP8L', 12, 'ascii')
  buf.writeUInt32LE(5, 16) // chunk size
  // Signature byte
  buf[20] = 0x2f
  // Encoded dimensions: (width-1) in bits 0-13, (height-1) in bits 14-27
  const bits = ((width - 1) & 0x3fff) | (((height - 1) & 0x3fff) << 14)
  buf.writeUInt32LE(bits, 21)
  return buf
}

/** Build a minimal VP8X (extended) WebP buffer. */
function makeWebpVp8x(width: number, height: number): Buffer {
  const buf = Buffer.alloc(30)
  buf.write('RIFF', 0, 'ascii')
  buf.writeUInt32LE(22, 4)
  buf.write('WEBP', 8, 'ascii')
  buf.write('VP8X', 12, 'ascii')
  buf.writeUInt32LE(10, 16) // chunk size
  // Flags byte at offset 20
  buf[20] = 0x00
  // Reserved bytes 21-23
  // Canvas width - 1 at offset 24 (3 bytes LE)
  const w = width - 1
  buf[24] = w & 0xff
  buf[25] = (w >> 8) & 0xff
  buf[26] = (w >> 16) & 0xff
  // Canvas height - 1 at offset 27 (3 bytes LE)
  const h = height - 1
  buf[27] = h & 0xff
  buf[28] = (h >> 8) & 0xff
  buf[29] = (h >> 16) & 0xff
  return buf
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('readImageDimensions', () => {
  describe('PNG', () => {
    it('should read dimensions from a PNG buffer', () => {
      const result = readImageDimensions(makePng(1920, 1080))
      expect(result).toEqual({ width: 1920, height: 1080 })
    })

    it('should handle small PNG dimensions', () => {
      const result = readImageDimensions(makePng(1, 1))
      expect(result).toEqual({ width: 1, height: 1 })
    })

    it('should handle large PNG dimensions', () => {
      const result = readImageDimensions(makePng(4096, 3072))
      expect(result).toEqual({ width: 4096, height: 3072 })
    })
  })

  describe('JPEG', () => {
    it('should read dimensions from a JPEG with SOF0 marker', () => {
      const result = readImageDimensions(makeJpeg(800, 600))
      expect(result).toEqual({ width: 800, height: 600 })
    })

    it('should read dimensions from a progressive JPEG (SOF2)', () => {
      const result = readImageDimensions(makeJpegProgressive(1024, 768))
      expect(result).toEqual({ width: 1024, height: 768 })
    })
  })

  describe('WebP', () => {
    it('should read dimensions from VP8 (lossy) WebP', () => {
      const result = readImageDimensions(makeWebpVp8(640, 480))
      expect(result).toEqual({ width: 640, height: 480 })
    })

    it('should read dimensions from VP8L (lossless) WebP', () => {
      const result = readImageDimensions(makeWebpVp8l(1200, 900))
      expect(result).toEqual({ width: 1200, height: 900 })
    })

    it('should read dimensions from VP8X (extended) WebP', () => {
      const result = readImageDimensions(makeWebpVp8x(2048, 1536))
      expect(result).toEqual({ width: 2048, height: 1536 })
    })
  })

  describe('unsupported / invalid', () => {
    it('should return null for an empty buffer', () => {
      expect(readImageDimensions(Buffer.alloc(0))).toBeNull()
    })

    it('should return null for an unrecognised format', () => {
      const buf = Buffer.from('This is just plain text, not an image')
      expect(readImageDimensions(buf)).toBeNull()
    })

    it('should return null for a buffer too short to contain headers', () => {
      const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47]) // PNG sig, but truncated
      expect(readImageDimensions(buf)).toBeNull()
    })
  })
})
