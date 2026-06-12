'use client';

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
  const cellSize = Math.min(48, Math.floor(200 / Math.max(cols.length, 1)));

  return (
    <div className="flex flex-col items-center justify-center h-full overflow-auto">
      <div className="flex gap-1">
        <div className="flex flex-col gap-1 mr-1">
          {rows.map(r => (
            <div key={r} style={{ height: cellSize }} className="flex items-center justify-end pr-1 text-[10px] opacity-50">{r}</div>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          {cols.map(c => (
            <div key={c} className="flex gap-1">
              {rows.map(r => {
                const cell = data.find(d => d.x === c && d.y === r);
                const intensity = cell ? (cell.value / maxVal) : 0;
                return (
                  <div
                    key={`${c}-${r}`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: `rgba(34, 211, 238, ${intensity * 0.8 + 0.1})`,
                      borderRadius: '4px',
                    }}
                    title={cell ? `${c}, ${r}: ${cell.value}` : ''}
                    className="transition-all hover:brightness-110"
                  ></div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
