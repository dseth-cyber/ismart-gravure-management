'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { AppButton } from '@/components/shared/app-button';
import { useTheme } from '@/lib/theme/theme-provider';
import { apiClient } from '@/lib/api/client';
import { Send, Plus, Trash2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Template {
  type: string;
  subject: string;
  body: string;
  channels: string[];
}

interface Pref {
  channel: string;
  enabled: boolean;
  address?: string;
}

export default function NotificationSettingsPage() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const queryClient = useQueryClient();
  const { data: configData, error: queryError } = useQuery({
    queryKey: ['notificationsSettings'],
    queryFn: async () => {
      const [tplRes, prefRes] = await Promise.all([
        apiClient.get('/api/v1/notifications/templates'),
        apiClient.get('/api/v1/notifications/prefs/me'),
      ]);
      return {
        templates: (tplRes.data.data || []) as Template[],
        prefs: (prefRes.data.data || []) as Pref[],
      };
    }
  });

  const templates = configData?.templates || [];
  const prefs = configData?.prefs || [];

  const [testResult, setTestResult] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const error = queryError?.message || errorMsg;

  const handleTest = async (channel: string) => {
    try {
      setTestResult('');
      const res = await apiClient.post('/api/v1/notifications/test', { channel, message: `Test from ${window.location.hostname}` });
      setTestResult(res.data.message || 'Test sent');
    } catch (err: any) {
      setTestResult(err?.response?.data?.message || 'Test failed');
    }
  };

  const handleSaveTemplate = async (tpl: Template) => {
    try {
      await apiClient.post('/api/v1/notifications/templates', tpl);
      queryClient.invalidateQueries({ queryKey: ['notificationsSettings'] });
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to save template');
    }
  };

  const handleDeleteTemplate = async (type: string) => {
    try {
      await apiClient.delete(`/api/v1/notifications/templates/${type}`);
      queryClient.invalidateQueries({ queryKey: ['notificationsSettings'] });
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to delete template');
    }
  };

  const handleTogglePref = async (channel: string, enabled: boolean) => {
    try {
      await apiClient.post('/api/v1/notifications/prefs/me', { channel, enabled });
      queryClient.invalidateQueries({ queryKey: ['notificationsSettings'] });
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to update preference');
    }
  };

  return (
    <AppLayout>
      <div className="grid gap-6">
        <PageHeader titleKey="settings.notifications" subtitleKey="settings.notificationsDesc" />

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
        )}

        {testResult && (
          <div className={`rounded-lg border p-4 text-sm ${themeConfig.border}`}>{testResult}</div>
        )}

        {/* Provider Channels */}
        <section className={`rounded-lg p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
          <h2 className={`text-lg font-bold ${themeConfig.textPrimary}`}>{t('settings.notifChannels')}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {['email', 'line', 'telegram'].map((ch) => (
              <div key={ch} className={`rounded-lg border p-4 ${themeConfig.border}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold uppercase text-xs tracking-wider">{ch}</span>
                  <AppButton variant="ghost" onClick={() => handleTest(ch)}>
                    <Send className="mr-1 h-3 w-3" /> {t('settings.testSend')}
                  </AppButton>
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={prefs.find((p) => p.channel === ch)?.enabled ?? false}
                    onChange={(e) => handleTogglePref(ch, e.target.checked)}
                    className="rounded"
                  />
                  <span>{t('settings.enabled')}</span>
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* Templates */}
        <section className={`rounded-lg p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
          <h2 className={`text-lg font-bold ${themeConfig.textPrimary}`}>{t('settings.templates')}</h2>
          <div className="mt-4 grid gap-3">
            {templates.map((tpl) => (
              <TemplateCard
                key={tpl.type}
                template={tpl}
                onSave={handleSaveTemplate}
                onDelete={handleDeleteTemplate}
                themeConfig={themeConfig}
                t={t}
              />
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function TemplateCard({ template: initial, onSave, onDelete, themeConfig, t }: {
  template: Template;
  onSave: (tpl: Template) => void;
  onDelete: (type: string) => void;
  themeConfig: any;
  t: any;
}) {
  const [editing, setEditing] = useState(false);
  const [tpl, setTpl] = useState(initial);

  return (
    <div className={`rounded-lg border p-4 ${themeConfig.border}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">{tpl.type}</span>
        <div className="flex gap-1">
          <AppButton variant="ghost" onClick={() => setEditing(!editing)}>
            {editing ? t('common.cancel') : t('btn.edit')}
          </AppButton>
          <AppButton variant="ghost" onClick={() => onDelete(tpl.type)}>
            <Trash2 className="h-3 w-3 text-red-400" />
          </AppButton>
        </div>
      </div>
      {editing ? (
        <div className="mt-3 space-y-2">
          <input
            className={`w-full rounded border px-2 py-1 text-sm ${themeConfig.border} ${themeConfig.panel}`}
            value={tpl.subject}
            onChange={(e) => setTpl({ ...tpl, subject: e.target.value })}
            placeholder={t('settings.subject')}
          />
          <textarea
            className={`w-full rounded border px-2 py-1 text-sm font-mono ${themeConfig.border} ${themeConfig.panel}`}
            rows={3}
            value={tpl.body}
            onChange={(e) => setTpl({ ...tpl, body: e.target.value })}
            placeholder={t('settings.body')}
          />
          <AppButton variant="primary" onClick={() => { onSave(tpl); setEditing(false); }}>
            {t('common.save')}
          </AppButton>
        </div>
      ) : (
        <p className={`mt-2 text-xs ${themeConfig.textMuted}`}>{tpl.subject || tpl.body?.slice(0, 80)}</p>
      )}
    </div>
  );
}
