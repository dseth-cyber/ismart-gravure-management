'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/app-layout';

import { useTheme } from '@/lib/theme/theme-provider';
import {
  Server, ShieldCheck, Database, Container, BarChart3, HardDrive, Mail, Globe, Workflow,
  CheckCircle2, Circle, Clock, AlertTriangle, Target, Flag, BookOpen, FileText, Layers,
  Gauge, Zap, Users, Lock, Cloud, ChevronDown, ChevronRight, ExternalLink, Map, Palette,
} from 'lucide-react';
import { StatusBadge, type StatusKind } from '@/components/shared/status-badge';

const phases = [
  { id: 1, name: 'Governance & Progress Tracking', status: 'done' as const, priority: 'P0' },
  { id: 2, name: 'Frontend Migration Foundation', status: 'done' as const, priority: 'P0' },
  { id: 3, name: 'Theme System', status: 'done' as const, priority: 'P0' },
  { id: 4, name: 'i18n System', status: 'done' as const, priority: 'P0' },
  { id: 5, name: 'Shared UI Components', status: 'done' as const, priority: 'P0' },
  { id: 6, name: 'Auth Foundation', status: 'done' as const, priority: 'P0' },
  { id: 7, name: 'Backend Monolith Foundation', status: 'done' as const, priority: 'P0' },
  { id: 8, name: 'Docker Infrastructure', status: 'done' as const, priority: 'P0' },
  { id: 9, name: 'API Contracts & DTOs', status: 'done' as const, priority: 'P0' },
  { id: 10, name: 'Core Domain Modules', status: 'done' as const, priority: 'P0' },
  { id: 11, name: 'Production Workflow Modules', status: 'done' as const, priority: 'P0' },
  { id: 12, name: 'Observability & Audit', status: 'done' as const, priority: 'P0' },
  { id: 13, name: 'Frontend API Integration', status: 'done' as const, priority: 'P0' },
  { id: 14, name: 'Real-Time Monitoring & Scanner', status: 'done' as const, priority: 'P0' },
  { id: 15, name: 'Enterprise Identity (LDAP/SSO)', status: 'done' as const, priority: 'P0' },
  { id: 16, name: 'Production Hardening', status: 'done' as const, priority: 'P1' },
  { id: 17, name: 'Security & MFA', status: 'done' as const, priority: 'P1' },
  { id: 18, name: 'Operations & Backup', status: 'done' as const, priority: 'P1' },
  { id: 19, name: 'Advanced RBAC & Workflow', status: 'done' as const, priority: 'P1' },
  { id: 20, name: 'Integration & Storage (MinIO)', status: 'done' as const, priority: 'P1' },
  { id: 21, name: 'Database Schema Isolation', status: 'done' as const, priority: 'P1' },
  { id: 22, name: 'API Security Hardening', status: 'done' as const, priority: 'P1' },
  { id: 23, name: 'Observability Stack (Grafana/Loki)', status: 'done' as const, priority: 'P1' },
  { id: 24, name: 'Notification Gateway', status: 'done' as const, priority: 'P1' },
  { id: 25, name: 'File Storage Layer', status: 'done' as const, priority: 'P1' },
  { id: 26, name: 'AI Gateway & IoT', status: 'done' as const, priority: 'P2' },
  { id: 27, name: 'Production Deploy & DR', status: 'done' as const, priority: 'P2' },
  { id: 28, name: 'Permission Management UI', status: 'done' as const, priority: 'P1' },
  { id: 29, name: 'Dashboard v2 & Charts', status: 'done' as const, priority: 'P1' },
  { id: 30, name: 'Dynamic Menu & Roles', status: 'done' as const, priority: 'P1' },
  { id: 31, name: 'React Query Integration', status: 'done' as const, priority: 'P1' },
  { id: 32, name: 'Dashboard Layout Persistence', status: 'done' as const, priority: 'P1' },
  { id: 33, name: 'Soft Delete & Trash Bin', status: 'done' as const, priority: 'P1' },
  { id: 34, name: 'User Management CRUD', status: 'done' as const, priority: 'P1' },
  { id: 35, name: 'TLS/HTTPS Hardening', status: 'done' as const, priority: 'P1' },
  { id: 36, name: 'Security Score 9.0', status: 'done' as const, priority: 'P1' },
  { id: 37, name: 'Security Score 10.0 (WAF/CSP)', status: 'done' as const, priority: 'P1' },
  { id: 38, name: 'Role DB & Permission Overrides', status: 'done' as const, priority: 'P1' },
  { id: 39, name: 'Sidebar Permission Filtering', status: 'done' as const, priority: 'P1' },
  { id: 40, name: 'Batch Permission UX', status: 'done' as const, priority: 'P1' },
  { id: 41, name: 'CSV Import Feature', status: 'done' as const, priority: 'P1' },
  { id: 42, name: 'CI Pipeline & Docker Fixes', status: 'done' as const, priority: 'P0' },
  { id: 43, name: 'Export Buttons (Excel/PDF/Image)', status: 'done' as const, priority: 'P1' },
];

const architecture = [
  { icon: Server, label: 'Frontend', value: 'Next.js 16 + React 19 + TypeScript 5.x + Tailwind CSS 4', detail: 'Port 3000, CSR via App Router' },
  { icon: Server, label: 'Backend API', value: 'Node.js 24 + Express 5 + TypeScript 5.x + Prisma ORM 7.x', detail: '22 domain modules, Modular Monolith' },
  { icon: Lock, label: 'Authentication', value: 'JWT (localStorage) + LDAP/AD + MFA (TOTP)', detail: 'axios interceptor, auto-attach token' },
  { icon: Database, label: 'Database', value: 'PostgreSQL 18', detail: '10 schemas, 28 models, Prisma ORM' },
  { icon: Container, label: 'Cache & Queue', value: 'Redis 8', detail: 'Session store, BullMQ queue, Socket.IO adapter' },
  { icon: BarChart3, label: 'Monitoring', value: 'Prometheus + Grafana + Loki + Alertmanager', detail: '18 alert rules, anomaly detection' },
  { icon: HardDrive, label: 'Object Storage', value: 'MinIO (S3-compatible)', detail: 'File uploads, thumbnails, QR labels' },
  { icon: Cloud, label: 'Reverse Proxy', value: 'Caddy v2 (auto HTTPS)', detail: 'Cloudflare Tunnel for production' },
  { icon: ShieldCheck, label: 'WAF', value: 'ModSecurity + OWASP CRS (Coraza)', detail: 'Paranoia Level 1, blocks XSS/SQLi' },
  { icon: Globe, label: 'Network', value: 'Docker internal network', detail: '21 containers, 4 exposed ports' },
];

const coreRules = [
  { icon: Zap, text: 'ห้าม build UI ผลิตจริงใน standalone HTML หลังจากเริ่ม migration' },
  { icon: Layers, text: 'Frontend ใหม่ต้องใช้ Next.js 16 + React 19 + TypeScript 5.x' },
  { icon: Server, text: 'Backend ใหม่ใช้ Node.js 24 LTS + Express 5 + Prisma 7.x' },
  { icon: ShieldCheck, text: 'API calls ผ่าน shared axios client เท่านั้น, JWT attach อัตโนมัติ' },
  { icon: BookOpen, text: 'ข้อความ UI ทั้งหมดใช้ t(\'key\') — ห้าม hardcode' },
  { icon: Layers, text: 'ทุกหน้าใหม่ต้อง render ใน Layout component ที่ใช้ร่วมกัน' },
  { icon: Workflow, text: 'Dialog/popup/modal ทั้งหมดใช้ shared dialog components' },
  { icon: Palette, text: 'สไตล์ขึ้นกับธีมผ่าน themeConfig + useTheme() — ห้าม one-off theme' },
  { icon: Users, text: 'Settings, permissions, scopes จัดการผ่าน UI ได้เอง ไม่ต้องแก้โค้ด' },
  { icon: Clock, text: 'ทุก primary action บันทึก audit log (Add/Edit/Delete/Login/Print)' },
  { icon: ShieldCheck, text: 'Soft-delete + Trash Bin: restore หรือ permanent delete ได้' },
  { icon: Database, text: 'ต้อง sync การเปลี่ยนแปลงกับ Roadmap UI และ progress cards' },
  { icon: Globe, text: 'ใช้ SearchableSelect component สำหรับ dropdown — ห้ามใช้ native <select>' },
  { icon: Gauge, text: 'List pages ใช้ React Query pattern — ห้าม useState + useEffect fetch' },
  { icon: Lock, text: 'TLS/HTTPS บังคับ, internal services ห้าม expose port, Redis มี password' },
  { icon: Cloud, text: 'WAF (ModSecurity) อยู่ระหว่าง Reverse Proxy และ Backend' },
  { icon: BarChart3, text: 'Prometheus alert rules สำหรับ anomaly detection (brute force, traffic spike)' },
];

const priorityGoals = [
  {
    priority: 'P0 — Critical',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    items: [
      'Frontend/Backend Foundation — Next.js, Express, Prisma, Docker',
      'Core Domain Modules — Cylinder, Ink, Production, Order, QC',
      'Auth & Security — JWT, MFA, LDAP, RBAC, Permission System',
      'CI/CD Pipeline — Docker build, Trivy scan, Dependabot',
    ],
  },
  {
    priority: 'P1 — High',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    items: [
      'Production Hardening — Rate limiting, API throttling, Performance',
      'Observability — Grafana, Loki, Prometheus, Alertmanager',
      'Dashboard v2 — 16 chart types, drag-and-resize, layout persistence',
      'CSV Import / Excel/PDF/Image Export',
      'Notification Gateway — LINE, Telegram, Email',
      'Security Score 10.0 — WAF, CSP, Trivy, ZAP, Incident Response',
      'Soft Delete & Trash Bin — Restore, Permanent Delete, Empty Trash',
    ],
  },
  {
    priority: 'P2 — Medium',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    items: [
      'AI Gateway — Multi-provider AI (OpenAI, Anthropic, Ollama)',
      'IoT Integration — MQTT bridge, Device registry, Telemetry',
      'File Storage — MinIO, Thumbnails, File picker',
      'Production Deploy & DR — Cloudflare Tunnel, Load testing',
    ],
  },
];

export default function RoadmapPage() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const [phasesOpen, setPhasesOpen] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(true);
  const [archOpen, setArchOpen] = useState(true);
  const [goalsOpen, setGoalsOpen] = useState(true);

  const doneCount = phases.filter((p) => p.status === 'done').length;
  const totalCount = phases.length;
  const pct = Math.round((doneCount / totalCount) * 100);

  const doneP0 = phases.filter((p) => p.priority === 'P0' && p.status === 'done').length;
  const totalP0 = phases.filter((p) => p.priority === 'P0').length;
  const doneP1 = phases.filter((p) => p.priority === 'P1' && p.status === 'done').length;
  const totalP1 = phases.filter((p) => p.priority === 'P1').length;
  const doneP2 = phases.filter((p) => p.priority === 'P2' && p.status === 'done').length;
  const totalP2 = phases.filter((p) => p.priority === 'P2').length;

  return (
    <AppLayout>
      <div className="grid gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className={`text-3xl font-bold tracking-normal ${themeConfig.textPrimary}`}>{t('nav.roadmap')}</h1>
            <p className={`mt-2 max-w-3xl text-sm leading-6 ${themeConfig.textSecondary}`}>
              {doneCount}/{totalCount} เฟส · {pct}% พร้อมใช้งาน
            </p>
          </div>
        </div>

        {/* Overall Progress */}
        <section className={`rounded-xl p-6 ${themeConfig.panel} ${themeConfig.shadow}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className={`text-lg font-bold ${themeConfig.textPrimary}`}>ความคืบหน้าโดยรวม</h2>
              <p className={`text-sm ${themeConfig.textMuted}`}>Overall Progress</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className={`text-3xl font-black ${themeConfig.textPrimary}`}>{pct}%</span>
                <p className={`text-xs ${themeConfig.textMuted}`}>สำเร็จ</p>
              </div>
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-4 mb-4 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className={`rounded-lg p-3 ${themeConfig.badge} text-center`}>
              <p className={`text-2xl font-black ${themeConfig.textPrimary}`}>{doneCount}/{totalCount}</p>
              <p className={`text-xs ${themeConfig.textMuted} mt-1`}>เฟสงานทั้งหมด</p>
            </div>
            <div className={`rounded-lg p-3 bg-emerald-500/10 text-center`}>
              <p className={`text-2xl font-black text-emerald-400`}>{doneP0}/{totalP0}</p>
              <p className={`text-xs text-emerald-400/70 mt-1`}>P0 Critical</p>
            </div>
            <div className={`rounded-lg p-3 bg-amber-500/10 text-center`}>
              <p className={`text-2xl font-black text-amber-400`}>{doneP1}/{totalP1}</p>
              <p className={`text-xs text-amber-400/70 mt-1`}>P1 High</p>
            </div>
            <div className={`rounded-lg p-3 bg-blue-500/10 text-center`}>
              <p className={`text-2xl font-black text-blue-400`}>{doneP2}/{totalP2}</p>
              <p className={`text-xs text-blue-400/70 mt-1`}>P2 Medium</p>
            </div>
          </div>
        </section>

        {/* Main grid: 2 columns on large screens */}
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          {/* Left column */}
          <div className="grid gap-6">
            {/* System Architecture */}
            <section className={`rounded-xl p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
              <button onClick={() => setArchOpen(!archOpen)} className="flex w-full items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Server className={themeConfig.primaryText} size={22} />
                  <h2 className={`text-lg font-bold ${themeConfig.textPrimary}`}>สถาปัตยกรรมระบบ</h2>
                </div>
                {archOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </button>
              {archOpen && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {architecture.map((item) => {
                    const Icon = item.icon;
                    return (
                      <article className={`rounded-lg border p-4 ${themeConfig.border}`} key={item.label}>
                        <div className="flex items-center gap-2">
                          <Icon className={themeConfig.primaryText} size={18} />
                          <span className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{item.label}</span>
                        </div>
                        <p className={`mt-2 text-sm font-bold ${themeConfig.textPrimary}`}>{item.value}</p>
                        <p className={`mt-1 text-xs ${themeConfig.textSecondary}`}>{item.detail}</p>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Development Phases */}
            <section className={`rounded-xl p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
              <button onClick={() => setPhasesOpen(!phasesOpen)} className="flex w-full items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Map className={themeConfig.primaryText} size={22} />
                  <div>
                    <h2 className={`text-lg font-bold ${themeConfig.textPrimary}`}>เฟสงาน</h2>
                    <p className={`text-xs ${themeConfig.textMuted}`}>Phases — {doneCount}/{totalCount} เสร็จสิ้น</p>
                  </div>
                </div>
                {phasesOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </button>
              {phasesOpen && (
                <div className="mt-4 max-h-[500px] overflow-y-auto space-y-2 pr-1">
                  {phases.map((phase) => (
                    <div
                      className={`flex items-center justify-between rounded-lg border p-3 ${themeConfig.border} ${themeConfig.panelHover}`}
                      key={phase.id}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-7 h-7 rounded-md grid place-items-center text-xs font-black shrink-0 ${themeConfig.badge}`}>
                          {phase.id}
                        </span>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${themeConfig.textPrimary}`}>{phase.name}</p>
                          <span className={`text-[10px] font-mono ${phase.priority === 'P0' ? 'text-red-400' : phase.priority === 'P1' ? 'text-amber-400' : 'text-blue-400'}`}>
                            {phase.priority}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={phase.status} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right column */}
          <div className="grid gap-6 self-start">
            {/* Core Rules */}
            <section className={`rounded-xl p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
              <button onClick={() => setRulesOpen(!rulesOpen)} className="flex w-full items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className={themeConfig.primaryText} size={22} />
                  <div>
                    <h2 className={`text-lg font-bold ${themeConfig.textPrimary}`}>กฎหลักที่ต้องไม่หลุด</h2>
                    <p className={`text-xs ${themeConfig.textMuted}`}>Core Rules ({coreRules.length} ข้อ)</p>
                  </div>
                </div>
                {rulesOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </button>
              {rulesOpen && (
                <div className="mt-4 max-h-[500px] overflow-y-auto space-y-2 pr-1">
                  {coreRules.map((rule, i) => {
                    const Icon = rule.icon;
                    return (
                      <div className={`flex gap-3 p-2 rounded-lg ${themeConfig.panelHover}`} key={i}>
                        <Icon className={`shrink-0 mt-0.5 ${themeConfig.primaryText}`} size={16} />
                        <p className={`text-sm leading-6 ${themeConfig.textSecondary}`}>{rule.text}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Priority Goals */}
            <section className={`rounded-xl p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
              <button onClick={() => setGoalsOpen(!goalsOpen)} className="flex w-full items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Target className={themeConfig.primaryText} size={22} />
                  <div>
                    <h2 className={`text-lg font-bold ${themeConfig.textPrimary}`}>เป้าหมายการพัฒนา</h2>
                    <p className={`text-xs ${themeConfig.textMuted}`}>Priority Goals</p>
                  </div>
                </div>
                {goalsOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </button>
              {goalsOpen && (
                <div className="mt-4 space-y-4">
                  {priorityGoals.map((group) => (
                    <div key={group.priority} className={`rounded-lg border p-4 ${group.border} ${group.bg}`}>
                      <h3 className={`text-sm font-bold ${group.color} mb-2`}>{group.priority}</h3>
                      <ul className="space-y-1.5">
                        {group.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 size={14} className={`shrink-0 mt-0.5 ${group.color}`} />
                            <span className={themeConfig.textSecondary}>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Reference Documents */}
            <section className={`rounded-xl p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
              <div className="flex items-center gap-3 mb-4">
                <FileText className={themeConfig.primaryText} size={22} />
                <div>
                  <h2 className={`text-lg font-bold ${themeConfig.textPrimary}`}>เอกสารอ้างอิง</h2>
                  <p className={`text-xs ${themeConfig.textMuted}`}>Reference Documents</p>
                </div>
              </div>
              <div className="grid gap-3">
                {[
                  { name: 'ROADMAP.md', desc: 'แผนการพัฒนาทั้งหมด 43 เฟส', href: '../docs/ROADMAP.md' },
                  { name: 'PROJECT_RULES.md', desc: 'กฎที่ไม่สามารถต่อรองได้ 28 ข้อ', href: '../docs/PROJECT_RULES.md' },
                  { name: 'DESIGN_SYSTEM.md', desc: 'กฎการออกแบบ UI และ Component', href: '../docs/DESIGN_SYSTEM.md' },
                ].map((doc) => (
                  <a
                    key={doc.name}
                    href={doc.href}
                    className={`flex items-center justify-between rounded-lg border p-3 transition ${themeConfig.border} ${themeConfig.panelHover} group`}
                  >
                    <div>
                      <p className={`text-sm font-semibold ${themeConfig.textPrimary}`}>{doc.name}</p>
                      <p className={`text-xs ${themeConfig.textMuted} mt-0.5`}>{doc.desc}</p>
                    </div>
                    <ExternalLink size={16} className={`shrink-0 ${themeConfig.textMuted} transition group-hover:${themeConfig.primaryText}`} />
                  </a>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}