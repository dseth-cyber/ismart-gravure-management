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

export function StateTimelineChart({ states, height: _height }: Props) {
  if (!states || states.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>;
  }

  return (
    <div className="flex flex-col gap-2 h-full justify-center px-1 timeline-container w-full min-h-0">
      <style>{`
        .timeline-container {
          font-size: clamp(9px, 3.5cqmin, 13px);
        }
        @container (max-width: 250px) {
          .timeline-time { display: none !important; }
        }
        @container (max-width: 170px) {
          .timeline-label { display: none !important; }
        }
        @container (max-height: 120px) {
          .timeline-container { gap: 4px !important; }
          .timeline-time { display: none !important; }
        }
      `}</style>
      {states.map((s, i) => (
        <div key={i} className="flex items-center gap-2 text-white/95 font-semibold min-w-0">
          <span className="w-16 truncate flex-shrink-0 opacity-70 timeline-label text-left">{s.state}</span>
          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            <span className="opacity-55 w-10 text-right timeline-time font-normal" style={{ fontSize: 'clamp(8px, 3cqmin, 11px)' }}>{s.start}</span>
            <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: '100%', backgroundColor: s.color, opacity: 0.75 }}
              ></div>
            </div>
            <span className="opacity-55 w-10 timeline-time font-normal" style={{ fontSize: 'clamp(8px, 3cqmin, 11px)' }}>{s.end || 'now'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
