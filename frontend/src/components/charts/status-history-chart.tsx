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
    <div className="flex items-center gap-2 h-full px-1 overflow-auto">
      {events.map((e, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
          <div
            className="w-3 h-3 rounded-full transition-all hover:scale-150"
            style={{ backgroundColor: e.color }}
            title={`${e.label}: ${e.time}`}
          ></div>
          <span className="text-[8px] opacity-50 whitespace-nowrap">{e.time}</span>
          <span className="text-[8px] opacity-40 whitespace-nowrap max-w-[40px] truncate">{e.label}</span>
        </div>
      ))}
    </div>
  );
}
