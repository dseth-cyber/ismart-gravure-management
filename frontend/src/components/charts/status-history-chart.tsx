'use client';

interface StatusEvent {
  time: string;
  status: string;
  color: string;
  label: string;
}

interface Props {
  events: StatusEvent[];
  height?: number;
}

export function StatusHistoryChart({ events, height: _height }: Props) {
  if (!events || events.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>;
  }

  return (
    <div className="flex items-center justify-around gap-2.5 h-full px-1 w-full overflow-hidden status-history-container">
      <style>{`
        .status-history-container {
          font-size: clamp(8px, 4.5cqmin, 28px);
        }
        @container (max-height: 120px) {
          .status-history-lbl { display: none !important; }
        }
        @container (max-width: 200px) {
          .status-history-lbl { display: none !important; }
          .status-history-time { display: none !important; }
        }
      `}</style>
      {events.map((e, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0 min-w-0">
          <div
            className="rounded-full transition-all hover:scale-150 flex-shrink-0"
            style={{ 
              backgroundColor: e.color,
              width: 'clamp(8px, 8cqmin, 64px)',
              height: 'clamp(8px, 8cqmin, 64px)'
            }}
            title={`${e.label}: ${e.time}`}
          ></div>
          <span className="opacity-60 whitespace-nowrap status-history-time font-semibold" style={{ fontSize: 'inherit' }}>{e.time}</span>
          <span className="opacity-50 whitespace-nowrap max-w-[120px] truncate status-history-lbl" style={{ fontSize: 'inherit' }}>{e.label}</span>
        </div>
      ))}
    </div>
  );
}
