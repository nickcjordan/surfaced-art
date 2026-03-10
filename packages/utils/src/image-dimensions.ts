/**
 * Read width/height from image binary data by parsing format headers.
 * Supports PNG, JPEG, and WebP without external dependencies.
 */
export function readImageDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 4) return null

  // PNG: bytes 0-7 are signature, IHDR chunk starts at byte 8
  // Width at offset 16, height at offset 20 (big-endian uint32)
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    if (buf.length < 24) return null
    const width = buf.readUInt32BE(16)
    const height = buf.readUInt32BE(20)
    return { width, height }
  }

  // JPEG: SOI marker (0xFFD8), then scan for SOF0/SOF2 markers
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2
    while (offset < buf.length - 1) {
      if (buf[offset] !== 0xff) break
      const marker = buf[offset + 1]!
      // SOF0 (0xC0) or SOF2 (0xC2) — contains dimensions
      if (marker === 0xc0 || marker === 0xc2) {
        if (offset + 9 > buf.length) return null
        const height = buf.readUInt16BE(offset + 5)
        const width = buf.readUInt16BE(offset + 7)
        return { width, height }
      }
      // Skip to next marker
      if (marker === 0xd9) break // EOI
      if (offset + 4 > buf.length) return null
      const segLength = buf.readUInt16BE(offset + 2)
      offset += 2 + segLength
    }
    return null
  }

  // WebP: RIFF header, then "WEBP" at offset 8
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    if (buf.length < 16) return null
    const chunk = buf.toString('ascii', 12, 16)
    if (chunk === 'VP8 ') {
      // Lossy WebP: dimensions at offset 26-29
      if (buf.length < 30) return null
      const width = buf.readUInt16LE(26) & 0x3fff
      const height = buf.readUInt16LE(28) & 0x3fff
      return { width, height }
    }
    if (chunk === 'VP8L') {
      // Lossless WebP: dimensions encoded in first 4 bytes of bitstream at offset 21
      if (buf.length < 25) return null
      const bits = buf.readUInt32LE(21)
      const width = (bits & 0x3fff) + 1
      const height = ((bits >> 14) & 0x3fff) + 1
      return { width, height }
    }
    if (chunk === 'VP8X') {
      // Extended WebP: width at 24 (3 bytes LE), height at 27 (3 bytes LE)
      if (buf.length < 30) return null
      const width = (buf[24]! | (buf[25]! << 8) | (buf[26]! << 16)) + 1
      const height = (buf[27]! | (buf[28]! << 8) | (buf[29]! << 16)) + 1
      return { width, height }
    }
  }

  return null
}
