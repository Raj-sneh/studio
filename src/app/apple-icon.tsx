import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 28,
        }}
      >
        <svg
          viewBox="0 0 100 100"
          width="120"
          height="120"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="40" stroke="#00ffff" strokeWidth="5" fill="none" />
          <path d="M 45 35 L 45 65 L 65 50 Z" fill="#00ffff" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
