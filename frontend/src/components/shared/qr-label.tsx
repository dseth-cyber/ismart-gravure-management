'use client';

import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';

interface QrLabelProps {
  data: string;
  title: string;
  fields: Array<{ label: string; value: string }>;
  type: 'cylinder' | 'ink';
}

export function QrLabel({ data, title, fields, type }: QrLabelProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label - ${title}</title>
          <style>
            @page { margin: 0.5in; size: 2in 3in; }
            body { margin: 0; padding: 16px; font-family: 'Courier New', monospace; }
            .label { text-align: center; border: 2px solid #000; border-radius: 8px; padding: 12px; max-width: 300px; }
            .title { font-size: 14px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; }
            .qr { margin: 8px auto; }
            .field { font-size: 10px; text-align: left; margin: 2px 0; }
            .field-label { font-weight: bold; }
            hr { border: none; border-top: 1px dashed #999; margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="title">${title}</div>
            <hr />
            <div class="qr">${printRef.current?.querySelector('svg')?.outerHTML || ''}</div>
            ${fields.map(f => `<div class="field"><span class="field-label">${f.label}:</span> ${f.value}</div>`).join('')}
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="inline-block">
      <div
        ref={printRef}
        className="border-2 border-dashed border-gray-700 rounded-xl p-4 text-center inline-block"
        style={{ width: 220 }}
      >
        <p className="text-xs font-bold text-gray-300 uppercase mb-2 tracking-wider">{title}</p>
        <div className="flex justify-center mb-2">
          <QRCodeSVG value={data} size={100} level="M" />
        </div>
        <hr className="border-gray-700 mb-2" />
        <div className="text-left space-y-0.5">
          {fields.map(f => (
            <p key={f.label} className="text-[10px] font-mono text-gray-400">
              <span className="font-bold text-gray-300">{f.label}:</span> {f.value}
            </p>
          ))}
        </div>
      </div>
      <button
        onClick={handlePrint}
        className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition shadow"
      >
        <Printer size={14} />
        Print Label
      </button>
    </div>
  );
}
