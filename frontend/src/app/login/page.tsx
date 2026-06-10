'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth/auth-provider';
import { useTheme } from '@/lib/theme/theme-provider';
import { Lock, User, Globe, Loader2, ArrowRight } from 'lucide-react';
import { persistLanguage } from '@/lib/i18n/i18n-provider';
import type { Language } from '@/lib/i18n/settings';

const LANG_META = [
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'cn', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'mm', label: 'မြန်မာ', flag: '🇲🇲' },
];

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const { themeConfig } = useTheme();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showLangMenu, setShowLangMenu] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      await login(username, password);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 400) {
        setErrorMsg(t('login.error.invalid'));
      } else {
        setErrorMsg(t('login.error.generic'));
      }
      setSubmitting(false);
    }
  };

  const currentLang = LANG_META.find((l) => l.code === i18n.language) || LANG_META[0];

  return (
    <div className={`min-h-screen w-screen flex items-center justify-center relative overflow-hidden ${themeConfig.appBg}`}>
      {/* Background ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full ${themeConfig.blob1} blur-3xl transition-all duration-1000`}></div>
        <div className={`absolute top-1/2 -left-40 w-80 h-80 rounded-full ${themeConfig.blob2} blur-3xl transition-all duration-1000`}></div>
        <div className={`absolute -bottom-40 right-1/3 w-72 h-72 rounded-full ${themeConfig.blob3} blur-3xl transition-all duration-1000`}></div>
      </div>

      {/* Language selector in corner */}
      <div className="absolute top-4 right-4 z-20">
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${themeConfig.border} ${themeConfig.panel}`}
          >
            <Globe size={14} className={themeConfig.textSecondary} />
            <span className={themeConfig.textSecondary}>{currentLang.flag} {currentLang.label}</span>
          </button>
          {showLangMenu && (
            <div className={`absolute right-0 top-full mt-1.5 rounded-xl py-1 min-w-[130px] z-50 border shadow-2xl flex flex-col ${themeConfig.dialog}`}>
              {LANG_META.map((lm) => (
                <button
                  key={lm.code}
                  onClick={() => {
                    persistLanguage(lm.code as Language);
                    setShowLangMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs font-bold transition flex items-center gap-2 ${
                    i18n.language === lm.code ? themeConfig.primaryText : themeConfig.textSecondary
                  } ${themeConfig.panelHover}`}
                >
                  <span>{lm.flag}</span>
                  <span>{lm.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Login Card */}
      <main className="w-full max-w-md px-4 z-10 relative">
        <div className={`rounded-3xl p-8 border ${themeConfig.border} ${themeConfig.panel} ${themeConfig.shadow} relative overflow-hidden`}>
          {/* Card Ambient Glow Header */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600"></div>

          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center text-white text-xl font-black mx-auto mb-4 shadow-xl shadow-cyan-500/10">
              GM
            </div>
            <h1 className={`text-2xl font-black tracking-tight ${themeConfig.textPrimary}`}>{t('login.title')}</h1>
            <p className={`text-xs ${themeConfig.textSecondary} mt-1`}>iSmart Gravure Management System</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold text-center animate-pulse">
                {errorMsg}
              </div>
            )}

            {/* Username */}
            <div className="space-y-1.5">
              <label className={`text-xs font-bold ${themeConfig.textSecondary}`}>{t('login.username')}</label>
              <div className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 border transition-all ${themeConfig.input}`}>
                <User size={16} className={themeConfig.textMuted} />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('login.username')}
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-gray-500"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className={`text-xs font-bold ${themeConfig.textSecondary}`}>{t('login.password')}</label>
              <div className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 border transition-all ${themeConfig.input}`}>
                <Lock size={16} className={themeConfig.textMuted} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-gray-500"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !username.trim() || !password.trim()}
              className={`w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${themeConfig.primaryButton} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{t('prod.scanning')}</span>
                </>
              ) : (
                <>
                  <span>{t('login.submit')}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
