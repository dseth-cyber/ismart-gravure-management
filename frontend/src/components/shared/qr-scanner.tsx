'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

function safeStop(scanner: Html5Qrcode) {
  try {
    const p = scanner.stop();
    if (p && typeof p.then === 'function') {
      p.catch(() => {});
    }
  } catch {
    /* synchronous throw — scanner not running */
  }
}

function killMedia(el: HTMLElement) {
  el.querySelectorAll('video').forEach(v => {
    const vs = v as HTMLVideoElement;
    if (vs.srcObject instanceof MediaStream) {
      vs.srcObject.getTracks().forEach(t => t.stop());
    }
    vs.srcObject = null;
  });
}

interface QrScannerProps {
  onScan: (code: string) => void;
  onError?: (err: string) => void;
  width?: number;
  height?: number;
}

export function QrScanner({ onScan, onError, width = 280, height = 280 }: QrScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stoppedRef = useRef(false);
  const mountKeyRef = useRef(0);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  onScanRef.current = onScan;
  onErrorRef.current = onError;
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    const mountId = ++mountKeyRef.current;

    const inner = document.createElement('div');
    inner.id = `qr-scanner-${mountId}`;
    inner.style.cssText = 'position:relative;width:100%;height:100%;background:#000;display:flex;align-items:center;justify-content:center;overflow:hidden;';
    parent.innerHTML = '';
    parent.appendChild(inner);

    const scanner = new Html5Qrcode(`qr-scanner-${mountId}`);
    stoppedRef.current = false;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        if (mountKeyRef.current !== mountId) return;
        if (stoppedRef.current) return;
        stoppedRef.current = true;
        onScanRef.current(decodedText);
        safeStop(scanner);
        killMedia(inner);
        setScanning(false);
      },
      () => {}
    ).then(() => {
      if (mountKeyRef.current !== mountId) {
        killMedia(inner);
        return;
      }
      setScanning(true);
      inner.querySelectorAll('video').forEach(v => {
        (v as HTMLVideoElement).style.cssText = 'display:block;width:100%;height:100%;object-fit:cover;';
      });
    }).catch((err) => {
      if (mountKeyRef.current !== mountId) return;
      const msg = typeof err === 'string' ? err : (err?.toString() || '');
      if (msg.includes('NotFound') || msg.includes('NotAllowed') || msg.includes('NotReadable')) {
        onErrorRef.current?.('Camera not available — use manual input below');
      } else {
        onErrorRef.current?.(msg || 'Camera access denied');
      }
      stoppedRef.current = true;
    });

    return () => {
      stoppedRef.current = true;
      safeStop(scanner);
      killMedia(inner);
      inner.remove();
    };
  }, []);

  return (
    <div className="flex justify-center">
      <div
        ref={containerRef}
        style={{ width, height }}
        className="rounded-xl overflow-hidden border-2 border-dashed border-cyan-400/50"
      />
    </div>
  );
}
