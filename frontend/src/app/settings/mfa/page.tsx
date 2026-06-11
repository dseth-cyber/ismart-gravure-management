'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme/theme-provider';
import { apiClient } from '@/lib/api/client';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { Shield, Smartphone, CheckCircle, AlertTriangle, Copy } from 'lucide-react';
import { ApiResponse } from '@shared/dto/auth/auth.dto';

export default function MfaSettingsPage() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [hasSecret, setHasSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'idle' | 'generate' | 'verify' | 'done'>('idle');
  const [secret, setSecret] = useState('');
  const [uri, setUri] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disableCode, setDisableCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await apiClient.get<ApiResponse>('/api/v1/auth/mfa/status');
      setMfaEnabled(res.data.data.mfaEnabled);
      setHasSecret(res.data.data.hasSecret);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleGenerate = async () => {
    setErrorMsg('');
    try {
      const res = await apiClient.post<ApiResponse>('/api/v1/auth/mfa/generate');
      setSecret(res.data.data.secret);
      setUri(res.data.data.uri);
      setStep('generate');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to generate MFA secret');
    }
  };

  const handleEnable = async () => {
    if (totpCode.length !== 6) return;
    setErrorMsg('');
    try {
      const res = await apiClient.post<ApiResponse>('/api/v1/auth/mfa/enable', { totpCode });
      setBackupCodes(res.data.data.backupCodes);
      setMfaEnabled(true);
      setStep('done');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid code, try again');
    }
  };

  const handleDisable = async () => {
    if (!disableCode) return;
    setErrorMsg('');
    try {
      await apiClient.post<ApiResponse>('/api/v1/auth/mfa/disable', { totpCode: disableCode });
      setMfaEnabled(false);
      setHasSecret(false);
      setStep('idle');
      setDisableCode('');
      setSuccessMsg(t('mfa.disabled'));
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid code');
    }
  };

  const handleCopyCodes = async () => {
    await navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return null;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <PageHeader titleKey="mfa.settings.title" />

        {successMsg && (
          <div className={`p-4 rounded-lg flex items-center gap-3 text-green-800 bg-green-100 dark:text-green-200 dark:bg-green-900`}>
            <CheckCircle className="w-5 h-5" />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-lg flex items-center gap-3 text-red-800 bg-red-100 dark:text-red-200 dark:bg-red-900">
            <AlertTriangle className="w-5 h-5" />
            {errorMsg}
          </div>
        )}

        {!mfaEnabled && step === 'idle' && (
          <div className={`p-8 rounded-2xl shadow-lg ${themeConfig.dialog}`}>
            <div className="flex items-center gap-4 mb-4">
              <Shield className="w-10 h-10 text-yellow-500" />
              <div>
                <h2 className="text-xl font-semibold">{t('mfa.notEnabled')}</h2>
                <p className={`text-sm ${themeConfig.textMuted}`}>{t('mfa.notEnabledDesc')}</p>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              className={`px-6 py-3 rounded-lg font-medium ${themeConfig.primaryButton} text-white`}
            >
              {t('mfa.setup')}
            </button>
          </div>
        )}

        {!mfaEnabled && step === 'generate' && (
          <div className={`p-8 rounded-2xl shadow-lg ${themeConfig.dialog}`}>
            <h2 className="text-xl font-semibold mb-4">{t('mfa.scanQr')}</h2>
            <p className={`text-sm mb-4 ${themeConfig.textMuted}`}>{t('mfa.scanQrDesc')}</p>

            <div className="flex justify-center mb-6">
              <div className={`p-4 rounded-xl ${themeConfig.input} text-center`}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(uri)}`}
                  alt="MFA QR Code"
                  className="w-60 h-60 mx-auto"
                />
              </div>
            </div>

            <details className="mb-4">
              <summary className="text-sm cursor-pointer text-blue-500">{t('mfa.manualEntry')}</summary>
              <p className={`mt-2 p-2 rounded text-xs font-mono break-all ${themeConfig.input}`}>{secret}</p>
            </details>

            <div className="space-y-3">
              <label className="block text-sm font-medium">{t('mfa.enterCode')}</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                className={`w-full px-4 py-3 text-center text-2xl tracking-[0.5em] rounded-lg border focus:ring-2 focus:outline-none ${themeConfig.input}`}
                autoFocus
              />
              <button
                onClick={handleEnable}
                disabled={totpCode.length !== 6}
                className={`w-full py-3 rounded-lg font-medium disabled:opacity-50 ${themeConfig.primaryButton} text-white`}
              >
                {t('mfa.verify')}
              </button>
            </div>
          </div>
        )}

        {!mfaEnabled && step === 'done' && (
          <div className={`p-8 rounded-2xl shadow-lg ${themeConfig.dialog}`}>
            <div className="flex items-center gap-3 mb-4 text-green-600">
              <CheckCircle className="w-8 h-8" />
              <h2 className="text-xl font-semibold">{t('mfa.enabled')}</h2>
            </div>

            <div className={`p-4 rounded-lg mb-4 bg-yellow-50 border border-yellow-300 dark:bg-yellow-900 dark:border-yellow-700`}>
              <p className="font-medium mb-2">{t('mfa.saveCodes')}</p>
              <div className="grid grid-cols-2 gap-1 font-mono text-sm">
                {backupCodes.map((code, i) => (
                  <span key={i} className="p-1">{code}</span>
                ))}
              </div>
              <button
                onClick={handleCopyCodes}
                className="mt-2 flex items-center gap-1 text-sm text-blue-500"
              >
                <Copy className="w-4 h-4" />
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>

            <p className={`text-sm ${themeConfig.textMuted}`}>{t('mfa.backupWarning')}</p>
          </div>
        )}

        {mfaEnabled && (
          <div className={`p-8 rounded-2xl shadow-lg ${themeConfig.dialog}`}>
            <div className="flex items-center gap-3 mb-4 text-green-600">
              <Shield className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-semibold">{t('mfa.enabled')}</h2>
                <p className={`text-sm ${themeConfig.textMuted}`}>{t('mfa.enabledDesc')}</p>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium mb-2">{t('mfa.disable')}</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder={t('mfa.code')}
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  className={`flex-1 px-4 py-2 rounded-lg border focus:ring-2 focus:outline-none ${themeConfig.input}`}
                />
                <button
                  onClick={handleDisable}
                  disabled={disableCode.length !== 6}
                  className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white disabled:opacity-50"
                >
                  {t('mfa.disable')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
