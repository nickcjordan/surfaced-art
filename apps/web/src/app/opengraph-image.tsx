import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Surfaced Art — A Curated Digital Gallery for Real Makers'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#1A1A1A',
          padding: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <div
            style={{
              fontSize: '72px',
              fontWeight: 400,
              color: '#B8956A',
              letterSpacing: '0.05em',
              fontFamily: 'serif',
            }}
          >
            SURFACED ART
          </div>
          <div
            style={{
              width: '120px',
              height: '2px',
              backgroundColor: '#B8956A',
            }}
          />
          <div
            style={{
              fontSize: '28px',
              fontWeight: 400,
              color: '#E5E5E5',
              letterSpacing: '0.02em',
              fontFamily: 'sans-serif',
            }}
          >
            A Curated Digital Gallery for Real Makers
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
