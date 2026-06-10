'use client';

const COLOR_MAP: Record<string, string> = {
  BK: '#1a1a1a',
  CY: '#00bcd4',
  MG: '#e91e63',
  YL: '#ffc107',
  WH: '#f5f5f5',
  VN: '#9c27b0',
  FL: '#ff5722',
  Black: '#1a1a1a',
  Cyan: '#00bcd4',
  Magenta: '#e91e63',
  Yellow: '#ffc107',
  White: '#f5f5f5',
  Varnish: '#9c27b0',
  'Black Base': '#1a1a1a',
  'Magenta Base': '#e91e63'
};

type ColorBadgeProps = {
  code?: string;
  name?: string;
};

export function ColorBadge({ code = '', name = '' }: ColorBadgeProps) {
  const hex = COLOR_MAP[code] || COLOR_MAP[name] || '#888888';
  const isLight = ['WH', 'YL', 'White', 'Yellow'].includes(code) || ['WH', 'YL', 'White', 'Yellow'].includes(name);

  return (
    <span className="inline-flex items-center gap-2 text-xs">
      <span
        className={`w-3.5 h-3.5 rounded ${isLight ? 'border border-white/30' : ''}`}
        style={{ backgroundColor: hex }}
      ></span>
      <span className="text-gray-300 font-medium">{name || code}</span>
    </span>
  );
}
