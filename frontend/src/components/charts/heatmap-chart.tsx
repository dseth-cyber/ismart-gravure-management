'use client';

import { Fragment } from 'react';

interface HeatmapCell {
  x: string;
  y: string;
  value: number;
}

interface Props {
  data: HeatmapCell[];
  height?: number;
}

export function HeatmapChart({ data, height: _height }: Props) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>;
  }

  const rows = [...new Set(data.map(d => d.y))];
  const cols = [...new Set(data.map(d => d.x))];
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex flex-col h-full w-full justify-center p-1.5 relative overflow-hidden heatmap-container">
      <style>{`
        @container (max-width: 240px) {
          .heatmap-row-lbl { display: none !important; }
          .heatmap-grid {
            grid-template-columns: repeat(${cols.length}, 1fr) !important;
          }
        }
        @container (max-height: 125px) {
          .heatmap-col-lbl { display: none !important; }
        }
      `}</style>
      <div 
        className="grid h-full w-full gap-[1cqmin] heatmap-grid" 
        style={{
          gridTemplateColumns: `auto repeat(${cols.length}, 1fr)`,
          gridTemplateRows: `repeat(${rows.length}, 1fr) auto`,
        }}
      >
        {rows.map((row) => (
          <Fragment key={`row-${row}`}>
            {/* Row Label */}
            <div 
              className="flex items-center justify-end pr-2 text-white/50 font-bold truncate select-none leading-none heatmap-row-lbl" 
              style={{ fontSize: 'clamp(8px, 3.2cqmin, 11px)' }}
            >
              {row}
            </div>
            {/* Row Cells */}
            {cols.map((col) => {
              const cell = data.find(d => d.x === col && d.y === row);
              const intensity = cell ? (cell.value / maxVal) : 0;
              return (
                <div
                  key={`${col}-${row}`}
                  className="w-full h-full rounded transition-all hover:scale-105"
                  style={{
                    backgroundColor: `rgba(34, 211, 238, ${intensity * 0.8 + 0.15})`,
                  }}
                  title={cell ? `${col}, ${row}: ${cell.value}` : ''}
                />
              );
            })}
          </Fragment>
        ))}
        {/* Bottom-left corner placeholder */}
        <div className="heatmap-row-lbl" />
        {/* Column Labels */}
        {cols.map((col) => (
          <div 
            key={`lbl-col-${col}`} 
            className="text-center pt-1 text-white/50 font-bold select-none leading-none heatmap-col-lbl" 
            style={{ fontSize: 'clamp(7px, 3.2cqmin, 10px)' }}
          >
            {col}
          </div>
        ))}
      </div>
    </div>
  );
}
