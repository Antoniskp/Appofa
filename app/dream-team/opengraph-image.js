import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Ονειρεμένη Κυβέρνηση - Απόφαση';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1d4ed8, #4338ca, #312e81)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Greek flag stripe */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: '40px',
                height: '6px',
                borderRadius: '3px',
                backgroundColor: i % 2 === 0 ? 'white' : '#60a5fa',
              }}
            />
          ))}
        </div>

        <div style={{ fontSize: 28, color: '#93c5fd', marginBottom: '12px', letterSpacing: '4px' }}>
          ΠΟΛΙΤΙΚΗ ΣΥΜΜΕΤΟΧΗ
        </div>

        <div style={{ fontSize: 64, fontWeight: 800, marginBottom: '16px' }}>
          🏛️ Ονειρεμένη Κυβέρνηση
        </div>

        <div
          style={{
            fontSize: 24,
            color: '#bfdbfe',
            maxWidth: '800px',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          Ψηφίστε τους ανθρώπους που θέλετε σε κάθε θέση της κυβέρνησης
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: 20,
            color: '#93c5fd',
          }}
        >
          appofasi.gr
        </div>
      </div>
    ),
    { ...size }
  );
}
