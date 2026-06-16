'use client';

import { useState } from 'react';
import { Server, ShieldCheck, Workflow, Boxes, Database, RadioTower, FileText, Info, BarChart3, HardDrive, Mail, Clock, Container, Activity, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/app-layout';
import { AppDialog } from '@/components/shared/app-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge, type StatusKind } from '@/components/shared/status-badge';
import { useTheme } from '@/lib/theme/theme-provider';

const phases: Array<{ id: number; nameKey: string; outputKey: string; status: StatusKind }> = [
  { id: 0, nameKey: 'phase.0.name', outputKey: 'phase.0.output', status: 'done' },
  { id: 1, nameKey: 'phase.1.name', outputKey: 'phase.1.output', status: 'done' },
  { id: 2, nameKey: 'phase.2.name', outputKey: 'phase.2.output', status: 'done' },
  { id: 3, nameKey: 'phase.3.name', outputKey: 'phase.3.output', status: 'done' },
  { id: 4, nameKey: 'phase.4.name', outputKey: 'phase.4.output', status: 'done' },
  { id: 5, nameKey: 'phase.5.name', outputKey: 'phase.5.output', status: 'done' },
  { id: 6, nameKey: 'phase.6.name', outputKey: 'phase.6.output', status: 'done' },
  { id: 7, nameKey: 'phase.7.name', outputKey: 'phase.7.output', status: 'done' },
  { id: 8, nameKey: 'phase.8.name', outputKey: 'phase.8.output', status: 'done' },
  { id: 9, nameKey: 'phase.9.name', outputKey: 'phase.9.output', status: 'done' },
  { id: 10, nameKey: 'phase.10.name', outputKey: 'phase.10.output', status: 'done' },
  { id: 11, nameKey: 'phase.11.name', outputKey: 'phase.11.output', status: 'done' },
  { id: 12, nameKey: 'phase.12.name', outputKey: 'phase.12.output', status: 'done' },
  { id: 13, nameKey: 'phase.13.name', outputKey: 'phase.13.output', status: 'done' },
  { id: 14, nameKey: 'phase.14.name', outputKey: 'phase.14.output', status: 'done' },
  { id: 15, nameKey: 'phase.15.name', outputKey: 'phase.15.output', status: 'done' },
  { id: 16, nameKey: 'phase.16.name', outputKey: 'phase.16.output', status: 'done' },
  { id: 17, nameKey: 'phase.17.name', outputKey: 'phase.17.output', status: 'done' },
  { id: 18, nameKey: 'phase.18.name', outputKey: 'phase.18.output', status: 'done' },
  { id: 19, nameKey: 'phase.19.name', outputKey: 'phase.19.output', status: 'done' },
  { id: 20, nameKey: 'phase.20.name', outputKey: 'phase.20.output', status: 'done' },
  { id: 21, nameKey: 'phase.21.name', outputKey: 'phase.21.output', status: 'done' },
  { id: 22, nameKey: 'phase.22.name', outputKey: 'phase.22.output', status: 'done' },
  { id: 23, nameKey: 'phase.23.name', outputKey: 'phase.23.output', status: 'done' },
  { id: 24, nameKey: 'phase.24.name', outputKey: 'phase.24.output', status: 'done' },
  { id: 25, nameKey: 'phase.25.name', outputKey: 'phase.25.output', status: 'done' },
  { id: 26, nameKey: 'phase.26.name', outputKey: 'phase.26.output', status: 'done' },
  { id: 27, nameKey: 'phase.27.name', outputKey: 'phase.27.output', status: 'done' },
  { id: 28, nameKey: 'phase.28.name', outputKey: 'phase.28.output', status: 'done' },
  { id: 29, nameKey: 'phase.29.name', outputKey: 'phase.29.output', status: 'done' },
  { id: 30, nameKey: 'phase.30.name', outputKey: 'phase.30.output', status: 'done' },
  { id: 31, nameKey: 'phase.31.name', outputKey: 'phase.31.output', status: 'done' },
  { id: 32, nameKey: 'phase.32.name', outputKey: 'phase.32.output', status: 'done' },
  { id: 33, nameKey: 'phase.33.name', outputKey: 'phase.33.output', status: 'done' },
  { id: 34, nameKey: 'phase.34.name', outputKey: 'phase.34.output', status: 'done' },
  { id: 35, nameKey: 'phase.35.name', outputKey: 'phase.35.output', status: 'done' },
  { id: 36, nameKey: 'phase.36.name', outputKey: 'phase.36.output', status: 'done' },
  { id: 37, nameKey: 'phase.37.name', outputKey: 'phase.37.output', status: 'done' },
];

const rules = [
  'rule.layout',
  'rule.dialog',
  'rule.i18n',
  'rule.theme',
  'rule.database',
  'rule.docker',
  'rule.roadmap_sync',
  'rule.searchable_select',
  'rule.list_page_standard',
  'rule.dashboard_layout',
  'rule.tls_https',
  'rule.infra_security',
];

const architecture = [
  { icon: Server, labelKey: 'architecture.frontend', valueKey: 'architecture.frontendValue' },
  { icon: Activity, labelKey: 'architecture.backend', valueKey: 'architecture.backendValue' },
  { icon: ShieldCheck, labelKey: 'architecture.auth', valueKey: 'architecture.authValue' },
  { icon: Database, labelKey: 'architecture.database', valueKey: 'architecture.databaseValue' },
  { icon: Container, labelKey: 'architecture.redis', valueKey: 'architecture.redisValue' },
  { icon: BarChart3, labelKey: 'architecture.monitoring', valueKey: 'architecture.monitoringValue' },
  { icon: HardDrive, labelKey: 'architecture.storage', valueKey: 'architecture.storageValue' },
  { icon: Mail, labelKey: 'architecture.email', valueKey: 'architecture.emailValue' },
  { icon: Globe, labelKey: 'architecture.network', valueKey: 'architecture.networkValue' },
  { icon: Workflow, labelKey: 'architecture.workflow', valueKey: 'architecture.workflowValue' },
];

const docs = [
  { id: 'roadmap', nameKey: 'doc.roadmap', path: '../docs/ROADMAP.md' },
  { id: 'rules', nameKey: 'doc.rules', path: '../docs/PROJECT_RULES.md' },
  { id: 'design', nameKey: 'doc.design', path: '../docs/DESIGN_SYSTEM.md' },
];

export default function ProgressPage() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  interface SummaryItem {
    labelKey: string;
    value: string | number;
    noteKey: string;
    values?: Record<string, string | number>;
  }

  const donePhases = phases.filter((p) => p.status === 'done');
  const lastDonePhase = donePhases.length > 0 ? donePhases[donePhases.length - 1] : null;

  const progressPhases = phases.filter((p) => p.status === 'progress');
  const currentProgressPhase = progressPhases.length > 0 ? progressPhases[0] : null;

  const summary: SummaryItem[] = [
    { 
      labelKey: 'summary.totalPhases', 
      value: phases.length, 
      noteKey: 'summary.totalPhasesNote',
      values: { start: 0, end: phases.length - 1 }
    },
    { 
      labelKey: 'summary.done', 
      value: donePhases.length, 
      noteKey: 'summary.doneNote',
      values: lastDonePhase ? { phase: lastDonePhase.id, name: t(lastDonePhase.nameKey) } : { phase: '-', name: '-' }
    },
    { 
      labelKey: 'summary.progress', 
      value: progressPhases.length, 
      noteKey: 'summary.progressNote',
      values: currentProgressPhase ? { phase: currentProgressPhase.id, name: t(currentProgressPhase.nameKey) } : { phase: '-', name: '-' }
    },
    { 
      labelKey: 'summary.docker', 
      value: 'Docker', 
      noteKey: 'summary.dockerNote' 
    },
  ];

  return (
    <AppLayout>
      <div className="grid gap-8" id="progress">
        <PageHeader
          titleKey="page.title"
          subtitleKey="page.subtitle"
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={t('summary.label')}>
          {summary.map((item) => (
            <article className={`rounded-lg p-5 ${themeConfig.panel} ${themeConfig.shadow}`} key={item.labelKey}>
              <p className={`text-xs font-semibold uppercase ${themeConfig.textMuted}`}>{t(item.labelKey)}</p>
              <p className={`mt-3 text-3xl font-black ${themeConfig.textPrimary}`}>{item.value}</p>
              <p className={`mt-2 text-sm ${themeConfig.textSecondary}`}>{t(item.noteKey, item.values)}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          <div className={`rounded-lg p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className={`text-lg font-bold ${themeConfig.textPrimary}`}>{t('phase.sectionTitle')}</h2>
              <span className={`rounded-full px-3 py-1 text-xs ${themeConfig.badge}`}>{t('phase.updateRule')}</span>
            </div>
            <div className="grid gap-3">
              {phases.map((phase) => (
                <article
                  className={`group grid gap-3 rounded-lg border p-4 sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:items-center cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${themeConfig.border} ${themeConfig.panelHover}`}
                  key={phase.id}
                  onClick={() => {
                    setSelectedPhaseId(phase.id);
                    setIsDetailsOpen(true);
                  }}
                >
                  <div className={`grid h-10 w-10 place-items-center rounded-lg font-black ${themeConfig.badge}`}>{phase.id}</div>
                  <div>
                    <h3 className={`text-sm font-bold ${themeConfig.textPrimary}`}>{t(phase.nameKey)}</h3>
                    <p className={`mt-1 text-sm leading-6 ${themeConfig.textSecondary}`}>{t(phase.outputKey)}</p>
                  </div>
                  <div className="flex items-center gap-3 justify-self-end">
                    <StatusBadge status={phase.status} />
                    <Info size={16} className={`${themeConfig.textMuted} transition-colors group-hover:${themeConfig.primaryText}`} />
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-4 self-start" id="rules">
            <section className={`rounded-lg p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
              <h2 className={`text-lg font-bold ${themeConfig.textPrimary}`}>{t('rule.sectionTitle')}</h2>
              <ul className="mt-4 grid gap-3">
                {rules.map((rule) => (
                  <li className={`flex gap-3 text-sm leading-6 ${themeConfig.textSecondary}`} key={rule}>
                    <ShieldCheck className={themeConfig.primaryText} size={18} />
                    <span>{t(rule)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={`rounded-lg p-5 ${themeConfig.panel} ${themeConfig.shadow}`} id="documents">
              <h2 className={`text-lg font-bold ${themeConfig.textPrimary}`}>{t('doc.sectionTitle')}</h2>
              <div className="mt-4 grid gap-3">
                {docs.map((doc) => (
                  <a className={`rounded-lg border p-4 transition ${themeConfig.border} ${themeConfig.panelHover}`} href={doc.path} key={doc.id}>
                    <div className="flex items-center gap-3">
                      <FileText className={themeConfig.primaryText} size={18} />
                      <span className={`font-semibold ${themeConfig.textPrimary}`}>{t(doc.nameKey)}</span>
                    </div>
                    <p className={`mt-2 text-xs ${themeConfig.textMuted}`}>{doc.path}</p>
                  </a>
                ))}
              </div>
            </section>

            <section className={`rounded-lg p-5 ${themeConfig.panel} ${themeConfig.shadow}`} id="architecture">
              <h2 className={`text-lg font-bold ${themeConfig.textPrimary}`}>{t('architecture.sectionTitle')}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {architecture.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article className={`rounded-lg border p-4 ${themeConfig.border}`} key={item.labelKey}>
                      <Icon className={themeConfig.primaryText} size={20} />
                      <h3 className={`mt-3 text-sm font-bold ${themeConfig.textPrimary}`}>{t(item.labelKey)}</h3>
                      <p className={`mt-2 text-sm leading-6 ${themeConfig.textSecondary}`}>{t(item.valueKey)}</p>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        </section>

      </div>

      <AppDialog
        open={isDetailsOpen}
        titleKey={
          selectedPhaseId !== null
            ? t('dialog.phaseTitle', { id: selectedPhaseId, name: t(phases[selectedPhaseId].nameKey) })
            : 'dialog.title'
        }
        onClose={() => setIsDetailsOpen(false)}
      >
        {selectedPhaseId !== null && (
          <div className="space-y-6">
            {/* Status Section */}
            <div className={`flex items-center justify-between border-b pb-4 ${themeConfig.border}`}>
              <span className={`text-sm font-semibold ${themeConfig.textSecondary}`}>
                {t('col.status')}
              </span>
              <StatusBadge status={phases[selectedPhaseId].status} />
            </div>

            {/* Outputs Section */}
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${themeConfig.primaryText} mb-2`}>
                {t('phase.details.outputs')}
              </h4>
              <ul className="space-y-2 text-sm leading-6">
                {(t(`phase.${selectedPhaseId}.details.outputs`, { returnObjects: true }) as unknown as string[] || []).map((output, idx) => (
                  <li key={idx} className={`flex items-start ${themeConfig.textSecondary}`}>
                    <code className={`text-xs px-1.5 py-0.5 rounded border font-mono mr-1.5 shrink-0 ${themeConfig.badge}`}>
                      {output}
                    </code>
                  </li>
                ))}
              </ul>
            </div>

            {/* Criteria Section */}
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${themeConfig.primaryText} mb-2`}>
                {t('phase.details.criteria')}
              </h4>
              <ul className="space-y-2 text-sm leading-6">
                {(t(`phase.${selectedPhaseId}.details.criteria`, { returnObjects: true }) as unknown as string[] || []).map((criterion, idx) => (
                  <li key={idx} className={`flex items-start gap-2 ${themeConfig.textSecondary}`}>
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Notes Section */}
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${themeConfig.primaryText} mb-2`}>
                {t('phase.details.notes')}
              </h4>
              <ul className="space-y-1.5 text-sm leading-6">
                {(t(`phase.${selectedPhaseId}.details.notes`, { returnObjects: true }) as unknown as string[] || []).map((note, idx) => (
                  <li key={idx} className={`flex items-start gap-2 ${themeConfig.textMuted}`}>
                    <span className={`${themeConfig.primaryText} shrink-0`}>•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </AppDialog>
    </AppLayout>
  );
}
