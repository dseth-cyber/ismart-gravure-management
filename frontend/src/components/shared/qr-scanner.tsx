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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const containerId = 'qr-scanner-element';
    containerRef.current.id = containerId;

    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        onScan(decodedText);
        scanner.stop().catch(() => {});
        setScanning(false);
      },
      () => {}
    ).then(() => setScanning(true)).catch((err) => {
      onError?.(err?.toString() || 'Camera access denied');
    });

    return () => {
      scanner.stop().catch(() => {});
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
