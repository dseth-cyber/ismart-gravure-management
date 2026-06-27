'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="th">
      <head>
        <title>Error - Gravure Management System</title>
      </head>
      <body style={{ margin: 0 }}>
        <div style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          background: '#090d16',
          color: '#f8fafc',
          padding: '24px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '440px',
            width: '100%',
            textAlign: 'center',
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <svg style={{ width: '24px', height: '24px', color: '#f87171' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h2 style={{
              fontSize: '20px',
              fontWeight: 700,
              margin: '0 0 8px 0',
              color: '#ffffff'
            }}>
              เกิดข้อผิดพลาดในการโหลดระบบ
            </h2>
            
            <p style={{
              fontSize: '14px',
              color: '#9ca3af',
              margin: '0 0 24px 0',
              lineHeight: '1.5'
            }}>
              ระบบพบปัญหาที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบหากปัญหายังคงอยู่
            </p>
            
            <button
              onClick={() => reset()}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: 'linear-gradient(to bottom right, #3b82f6, #4f46e5)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)'
              }}
            >
              โหลดหน้าเว็บใหม่
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
