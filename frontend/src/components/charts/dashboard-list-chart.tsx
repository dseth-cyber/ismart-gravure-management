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
    <div className="space-y-2 h-full overflow-auto">
      {dashboards.map((db) => (
        <a
          key={db.id}
          href={db.href}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white flex-shrink-0">
            <LayoutDashboard size={14} />
          </div>
          <span className="text-sm font-semibold flex-1 group-hover:opacity-80 transition">{db.name}</span>
          <ArrowRight size={14} className="opacity-0 group-hover:opacity-50 transition" />
        </a>
      ))}
    </div>
  );
}
