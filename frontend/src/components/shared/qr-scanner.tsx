'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrScannerProps {
  onScan: (code: string) => void;
  onError?: (err: string) => void;
  width?: number;
  height?: number;
}

let scannerInstanceCounter = 0;

export function QrScanner({ onScan, onError, width = 320, height = 320 }: QrScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const stoppedRef = useRef(false);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  onScanRef.current = onScan;
  onErrorRef.current = onError;
  const [scanning, setScanning] = useState(false);
  const idRef = useRef(`qr-scanner-${++scannerInstanceCounter}`);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const containerId = idRef.current;
    el.id = containerId;
    el.innerHTML = '';

    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;
    stoppedRef.current = false;

    const safeStop = () => {
      try { scanner.stop(); } catch { /* ignore */ }
    };

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        onScanRef.current(decodedText);
        stoppedRef.current = true;
        safeStop();
        setScanning(false);
      },
      () => {}
    ).then(() => setScanning(true)).catch((err) => {
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
        safeStop();
      }
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center">
      <div
        ref={containerRef}
        style={{ width, height }}
        className="rounded-xl overflow-hidden border-2 border-dashed border-cyan-400/50"
      />
      {scanning && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-3/4 h-0.5 bg-cyan-400 animate-pulse rounded-full opacity-70" />
        </div>
      )}
    </div>
  );
}
