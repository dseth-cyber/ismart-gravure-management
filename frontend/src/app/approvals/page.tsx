'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme/theme-provider';
import { apiClient } from '@/lib/api/client';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { ApiResponse } from '@shared/dto/auth/auth.dto';

interface PendingItem {
  id: string;
  title: string;
  refType: string;
  initiator: string;
  definition: string;
  currentStep: { label: string; stepIndex: number } | null;
  createdAt: string;
}

export default function ApprovalsPage() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

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

  const refTypeIcon = (type: string) => {
    switch (type) {
      case 'leave_request': return '✈️';
      case 'purchase_order': return '📋';
      case 'inventory_adjust': return '📦';
      case 'sales_discount': return '💰';
      case 'qc_override': return '🔬';
      default: return '📄';
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader titleKey="approvals.title" />

        {errorMsg && (
          <div className="p-4 rounded-lg flex items-center gap-3 text-red-800 bg-red-100 dark:text-red-200 dark:bg-red-900">
            <AlertTriangle className="w-5 h-5" />
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">{t('common.loading')}</div>
        ) : items.length === 0 ? (
          <div className={`text-center py-12 rounded-2xl ${themeConfig.dialog}`}>
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="text-lg font-medium">{t('approvals.none')}</p>
            <p className={`text-sm ${themeConfig.textMuted}`}>{t('approvals.noneDesc')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className={`p-6 rounded-2xl shadow-lg ${themeConfig.dialog}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{refTypeIcon(item.refType)}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <p className={`text-sm ${themeConfig.textMuted}`}>
                        {item.definition} — {t('approvals.step')} {item.currentStep?.label}
                      </p>
                      <p className={`text-xs ${themeConfig.textMuted}`}>
                        {t('approvals.by')} {item.initiator} · {new Date(item.createdAt).toLocaleDateString()}
                      </p>
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
