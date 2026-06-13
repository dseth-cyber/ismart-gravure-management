'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrScannerProps {
  onScan: (code: string) => void;
  onError?: (err: string) => void;
  width?: number;
  height?: number;
}

export function QrScanner({ onScan, onError, width = 320, height = 320 }: QrScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stoppedRef = useRef(false);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  onScanRef.current = onScan;
  onErrorRef.current = onError;
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    el.id = 'qr-el';
    el.innerHTML = '';
    el.style.cssText = `position:relative;width:${width}px;height:${height}px;background:#000;display:flex;align-items:center;justify-content:center;`;

    const scanner = new Html5Qrcode('qr-el');
    stoppedRef.current = false;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        onScanRef.current(decodedText);
        stoppedRef.current = true;
        try { scanner.stop(); } catch { /* ignore */ }
        setScanning(false);
        el.querySelectorAll('video').forEach(v => { (v as HTMLVideoElement).style.cssText = 'display:block;width:100%;height:100%;object-fit:cover;'; });
      },
      () => {}
    ).then(() => {
      setScanning(true);
      el.querySelectorAll('video').forEach(v => { (v as HTMLVideoElement).style.cssText = 'display:block;width:100%;height:100%;object-fit:cover;'; });
    }).catch((err) => {
      const msg = typeof err === 'string' ? err : (err?.toString() || '');
      if (msg.includes('NotFound') || msg.includes('NotAllowed') || msg.includes('NotReadable')) {
        onErrorRef.current?.('Camera not available — use manual input below');
      } else {
        onErrorRef.current?.(msg || 'Camera access denied');
      }
      stoppedRef.current = true;
    });

    return () => {
      if (!stoppedRef.current) {
        try { scanner.stop(); } catch { /* ignore */ }
      }
      el.innerHTML = '';
    };
  }, []);

  return (
    <div>
      <div
        ref={containerRef}
        style={{ width, height }}
        className="rounded-xl overflow-hidden border-2 border-dashed border-cyan-400/50"
      />
    </div>
  );
}
