'use client';

interface StateData {
  state: string;
  start: string;
  end?: string;
  color: string;
}

interface Props {
  states: StateData[];
  height?: number;
}

export function StateTimelineChart({ states, height = 120 }: Props) {
  if (!states || states.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>;
  }

  return (
    <div className="flex flex-col gap-2 h-full justify-center px-1">
      {states.map((s, i) => (
        <div key={i} className="flex items-center gap-3 text-xs">
          <span className="w-16 truncate flex-shrink-0 font-semibold opacity-70">{s.state}</span>
          <div className="flex-1 flex items-center gap-1">
            <span className="text-[10px] opacity-50 w-12 text-right">{s.start}</span>
            <div className="flex-1 h-5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: '100%', backgroundColor: s.color, opacity: 0.7 }}
              ></div>
            </div>
            <span className="text-[10px] opacity-50 w-12">{s.end || 'now'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
