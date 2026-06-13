'use client';

import { LayoutDashboard, ArrowRight } from 'lucide-react';

interface DashboardLink {
  id: string;
  name: string;
  href: string;
}

interface Props {
  dashboards: DashboardLink[];
}

export function DashboardListChart({ dashboards }: Props) {
  if (!dashboards || dashboards.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">No dashboards</div>;
  }

  return (
    <div className="space-y-1.5 h-full overflow-auto db-list-container w-full">
      <style>{`
        .db-list-container {
          font-size: clamp(10px, 4cqw, 14px);
        }
        @container (max-width: 200px) {
          .db-list-icon { display: none !important; }
        }
        @container (max-width: 140px) {
          .db-list-arrow { display: none !important; }
        }
      `}</style>
      {dashboards.map((db) => (
        <a
          key={db.id}
          href={db.href}
          className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/5 transition group cursor-pointer min-w-0"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white flex-shrink-0 db-list-icon">
            <LayoutDashboard size={13} />
          </div>
          <span className="font-semibold flex-1 group-hover:opacity-80 transition truncate" style={{ fontSize: 'inherit' }}>{db.name}</span>
          <ArrowRight size={13} className="opacity-0 group-hover:opacity-50 transition flex-shrink-0 db-list-arrow" />
        </a>
      ))}
    </div>
  );
}
