'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { QrCode, Shield, FlaskConical, Target } from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-provider';

export function QuickMenuChart() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();

  const menus = [
    {
      label: 'สแกน QR',
      icon: QrCode,
      href: '/cylinders?scan=true',
      bg: 'from-cyan-500 to-blue-500',
    },
    {
      label: 'เริ่มตรวจสอบ',
      icon: Shield,
      href: '/production?tab=verification',
      bg: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'ผสมหมึก',
      icon: FlaskConical,
      href: '/inks?tab=formulas',
      bg: 'from-fuchsia-500 to-pink-500',
    },
    {
      label: 'ค้นหาย้อนกลับ',
      icon: Target,
      href: '/production?tab=traceability',
      bg: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 h-full w-full p-0.5 quick-menu-container min-h-0">
      <style>{`
        .quick-menu-container {
          font-size: clamp(11px, 4.2cqmin, 16px);
        }
        @container (max-height: 155px) {
          .quick-menu-lbl { display: none !important; }
          .quick-menu-btn { padding: 4px !important; gap: 0 !important; }
        }
      `}</style>
      {menus.map((m, i) => {
        const Icon = m.icon;
        return (
          <Link
            key={i}
            href={m.href}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer quick-menu-btn select-none ${themeConfig.panelHover}`}
            style={{
              backgroundColor: '#45266B',
            }}
          >
            <div 
              className={`rounded-xl flex items-center justify-center shadow-lg text-white flex-shrink-0 bg-gradient-to-br ${m.bg} hover:scale-105 transition-all`}
              style={{
                width: 'clamp(28px, 12cqmin, 56px)',
                height: 'clamp(28px, 12cqmin, 56px)',
              }}
            >
              <Icon style={{ width: '50%', height: '50%' }} />
            </div>
            <span 
              className="font-bold text-white/90 truncate max-w-full text-center leading-none px-1 quick-menu-lbl"
              style={{ fontSize: 'inherit' }}
            >
              {m.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
