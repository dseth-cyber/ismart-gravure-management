'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth/auth-provider';
import { useTheme } from '@/lib/theme/theme-provider';
import { Shield, ArrowRight, Loader2 } from 'lucide-react';

export default function MfaVerifyPage() {
  const { t } = useTranslation();
  const { verifyMfa, mfaPending, user } = useAuth();
  const { themeConfig } = useTheme();

  const [totpCode, setTotpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!mfaPending || !user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length !== 6) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      await verifyMfa(totpCode);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || t('mfa.error.invalid'));
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${themeConfig.appBg} ${themeConfig.textPrimary}`}>
      <div className={`w-full max-w-sm p-8 rounded-2xl shadow-2xl ${themeConfig.dialog}`}>
        <div className="flex justify-center mb-6">
          <div className={`p-4 rounded-full ${themeConfig.primaryBg} bg-opacity-10`}>
            <Shield className="w-8 h-8" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">{t('mfa.title')}</h1>
        <p className={`text-sm text-center mb-6 ${themeConfig.textMuted}`}>
          {t('mfa.subtitle', { username: user.username })}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('mfa.code')}</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              className={`w-full px-4 py-3 text-center text-2xl tracking-[0.5em] rounded-lg border focus:ring-2 focus:outline-none ${themeConfig.input}`}
              disabled={submitting}
              autoFocus
            />
          </div>

          {errorMsg && (
            <p className="text-red-500 text-sm text-center">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={submitting || totpCode.length !== 6}
            className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 ${themeConfig.primaryButton} text-white`}
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {t('mfa.verify')} <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
