'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme/theme-provider';
import { apiClient } from '@/lib/api/client';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { useAuth } from '@/lib/auth/auth-provider';
import { CheckCircle, XCircle, AlertTriangle, ArrowRight, Shield } from 'lucide-react';
import { ApiResponse } from '@shared/dto/auth/auth.dto';

interface PendingItem {
  id: string;
  title: string;
  refType: string;
  initiator: string;
  definition: string;
  steps: { role: string; sla: string; type: string }[];
  currentStep: { label: string; stepIndex: number } | null;
  createdAt: string;
  visibleToRoles?: string[];
}

// No hardcoded visibility — admin configures visibleToRoles per doc type in Setup → Workflow Engine → Approvals

export default function ApprovalsPage() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const { user } = useAuth();
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const load = async () => {
    try {
      const res = await apiClient.get<ApiResponse>('/api/v1/workflows/pending');
      setItems(res.data.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setErrorMsg('');
    try {
      const body: any = {};
      if (comment) body.comment = comment;
      await apiClient.post(`/api/v1/workflows/instances/${id}/${action}`, body);
      setComment('');
      setActionId(null);
      load();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Action failed');
    }
  };

  const filteredItems = useMemo(() => {
    let list = items;
    // Admin/director/owner sees all; other roles see only items where their role is in visibleToRoles
    const role = user?.role || '';
    if (!['admin', 'director', 'owner'].includes(role)) {
      list = list.filter(i => !i.visibleToRoles || i.visibleToRoles.includes(role));
    }
    if (activeFilter !== 'all') {
      list = list.filter(i => i.refType === activeFilter);
    }
    return list;
  }, [items, user?.role, activeFilter]);

  const refTypeSet = useMemo(() => {
    const types = new Set(items.map(i => i.refType));
    return Array.from(types).sort();
  }, [items]);

  // Admin-configurable refType icons — stored in localStorage, editable via Setup UI
  const getRefTypeIcon = (type: string): string => {
    const map: Record<string, string> = JSON.parse(localStorage.getItem('refTypeIcons') || '{}');
    return map[type] || '📄';
  };

  const isSuperRole = ['admin', 'director', 'owner'].includes(user?.role || '');

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader titleKey="approvals.title" />

        {isSuperRole && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300`}>
            <Shield size={14} />
            {t('approvals.superRoleBanner')}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-lg flex items-center gap-3 text-red-800 bg-red-100 dark:text-red-200 dark:bg-red-900">
            <AlertTriangle className="w-5 h-5" />
            {errorMsg}
          </div>
        )}

        {/* RefType filter tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeFilter === 'all' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' : `${themeConfig.badge} ${themeConfig.panelHover} ${themeConfig.textSecondary}`}`}
          >
            ทั้งหมด ({filteredItems.length})
          </button>
              {refTypeSet.map(rt => (
              <button
                key={rt}
                onClick={() => setActiveFilter(rt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeFilter === rt ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' : `${themeConfig.badge} ${themeConfig.panelHover} ${themeConfig.textSecondary}`}`}
              >
                {getRefTypeIcon(rt)} {rt}
              </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">{t('common.loading')}</div>
        ) : filteredItems.length === 0 ? (
          <div className={`text-center py-12 rounded-2xl ${themeConfig.dialog}`}>
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="text-lg font-medium">{t('approvals.none')}</p>
            <p className={`text-sm ${themeConfig.textMuted}`}>{t('approvals.noneDesc')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map(item => (
              <div key={item.id} className={`p-6 rounded-2xl shadow-lg ${themeConfig.dialog}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getRefTypeIcon(item.refType)}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      {item.definition && (
                        <p className={`text-sm ${themeConfig.textMuted}`}>{item.definition}</p>
                      )}
                      <p className={`text-xs ${themeConfig.textMuted} mt-1`}>
                        {t('approvals.by')} {item.initiator} · {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                      {/* Approval chain */}
                      {item.steps && item.steps.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-2">
                          {item.steps.map((s: any, i: number) => (
                            <span key={i} className="flex items-center gap-1">
                              {i > 0 && <ArrowRight size={10} className="text-gray-500" />}
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                s.type === 'notify' ? 'border-amber-500/30 text-amber-300' : 'border-emerald-500/30 text-emerald-300'
                              } bg-white/5`}>
                                {s.role} {s.sla ? `(${s.sla})` : ''}
                              </span>
                            </span>
                          ))}
                          {item.currentStep && (
                            <span className="text-[10px] text-cyan-400 ml-1">
                              ← {t('approvals.step')} {item.currentStep.label}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {actionId !== item.id ? (
                    <div className="flex gap-2">
                      <button
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white"
                          onClick={() => setActionId(item.id)}
                        >
                          {t('approvals.review')}
                        </button>
                    </div>
                  ) : null}
                </div>

                {actionId === item.id && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <textarea
                      placeholder={t('approvals.commentPlaceholder')}
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      rows={2}
                      className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none ${themeConfig.input}`}
                    />
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white flex items-center gap-1"
                        onClick={() => handleAction(item.id, 'approve')}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {t('approvals.approve')}
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white flex items-center gap-1"
                        onClick={() => handleAction(item.id, 'reject')}
                      >
                        <XCircle className="w-4 h-4" />
                        {t('approvals.reject')}
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-500 text-white"
                        onClick={() => setActionId(null)}
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
