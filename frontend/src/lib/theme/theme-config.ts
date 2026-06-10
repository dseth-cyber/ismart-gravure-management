export type ThemeName = 'modern' | 'dark' | 'light';

export type ThemeConfig = {
  name: ThemeName;
  appBg: string;
  navBar: string;
  sidebar: string;
  panel: string;
  panelHover: string;
  dialog: string;
  dialogOverlay: string;
  input: string;
  tableHead: string;
  tableRow: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primaryText: string;
  primaryBg: string;
  primaryButton: string;
  secondaryButton: string;
  dangerButton: string;
  badge: string;
  shadow: string;
  focusRing: string;
  blob1: string;
  blob2: string;
  blob3: string;
  status: {
    done: string;
    progress: string;
    blocked: string;
    todo: string;
    pending: string;
  };
};

export const themeConfig: Record<ThemeName, ThemeConfig> = {
  modern: {
    name: 'modern',
    appBg: 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900',
    navBar: 'backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-lg',
    sidebar: 'backdrop-blur-xl bg-white/10 border-r border-white/20',
    panel: 'bg-indigo-950/30 backdrop-blur-2xl border border-white/20 shadow-xl',
    panelHover: 'hover:bg-indigo-950/40',
    dialog: 'bg-slate-950/90 backdrop-blur-xl border border-white/20',
    dialogOverlay: 'bg-slate-950/70 backdrop-blur-sm',
    input: 'bg-white/10 backdrop-blur-md border border-white/30 text-white placeholder:text-slate-400',
    tableHead: 'bg-white/10 backdrop-blur-md text-white',
    tableRow: 'hover:bg-white/5',
    border: 'border-white/20',
    textPrimary: 'text-white',
    textSecondary: 'text-gray-300',
    textMuted: 'text-gray-400',
    primaryText: 'text-cyan-300',
    primaryBg: 'bg-cyan-500',
    primaryButton: 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white hover:from-cyan-400 hover:via-blue-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/20',
    secondaryButton: 'bg-white/10 text-slate-100 hover:bg-white/15 border border-white/20',
    dangerButton: 'bg-rose-500 text-white hover:bg-rose-400',
    badge: 'bg-white/10 border border-white/20 text-slate-200',
    shadow: 'shadow-xl shadow-black/20',
    focusRing: 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300',
    blob1: 'bg-purple-500/20',
    blob2: 'bg-cyan-500/15',
    blob3: 'bg-blue-500/20',
    status: {
      done: 'bg-emerald-500/20 text-emerald-400 border-emerald-300/35',
      progress: 'bg-blue-500/20 text-blue-400 border-cyan-300/35',
      blocked: 'bg-rose-500/20 text-rose-400 border-rose-300/35',
      todo: 'bg-white/10 text-slate-300 border-white/20',
      pending: 'bg-gray-500/20 text-gray-400 border-gray-400/35',
    },
  },
  dark: {
    name: 'dark',
    appBg: 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950',
    navBar: 'bg-gray-900/95 border-b border-gray-800',
    sidebar: 'bg-gray-900/95 border-r border-gray-800',
    panel: 'bg-gray-800/80 backdrop-blur-sm border border-gray-700',
    panelHover: 'hover:bg-gray-800/95',
    dialog: 'bg-gray-950 border border-gray-800',
    dialogOverlay: 'bg-black/70',
    input: 'bg-gray-800/50 border border-gray-700 text-gray-100 placeholder:text-gray-500',
    tableHead: 'bg-gray-800/50 text-gray-300',
    tableRow: 'hover:bg-gray-800/30',
    border: 'border-gray-700',
    textPrimary: 'text-gray-100',
    textSecondary: 'text-gray-400',
    textMuted: 'text-gray-500',
    primaryText: 'text-blue-400',
    primaryBg: 'bg-blue-500',
    primaryButton: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600',
    secondaryButton: 'bg-gray-800/50 text-gray-100 hover:bg-gray-800 border border-gray-700',
    dangerButton: 'bg-rose-600 text-white hover:bg-rose-500',
    badge: 'bg-gray-700/50 border border-gray-600 text-gray-300',
    shadow: 'shadow-xl shadow-black/30',
    focusRing: 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400',
    blob1: 'bg-blue-900/10',
    blob2: 'bg-gray-800/20',
    blob3: 'bg-blue-800/10',
    status: {
      done: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/35',
      progress: 'bg-blue-500/20 text-blue-400 border-blue-400/35',
      blocked: 'bg-rose-500/20 text-rose-400 border-rose-400/35',
      todo: 'bg-gray-800 text-gray-300 border-gray-700',
      pending: 'bg-gray-600/20 text-gray-400 border-gray-600/35',
    },
  },
  light: {
    name: 'light',
    appBg: 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100',
    navBar: 'bg-white/95 border-b border-gray-200 shadow-sm',
    sidebar: 'bg-white/95 border-r border-gray-200 shadow-sm',
    panel: 'bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg',
    panelHover: 'hover:bg-white',
    dialog: 'bg-white border border-gray-200',
    dialogOverlay: 'bg-gray-900/35',
    input: 'bg-white border border-gray-300 text-gray-950 placeholder:text-gray-400',
    tableHead: 'bg-gray-50 text-gray-700',
    tableRow: 'hover:bg-gray-50',
    border: 'border-gray-200',
    textPrimary: 'text-gray-950',
    textSecondary: 'text-gray-600',
    textMuted: 'text-gray-500',
    primaryText: 'text-blue-600',
    primaryBg: 'bg-blue-600',
    primaryButton: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500',
    secondaryButton: 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-300',
    dangerButton: 'bg-rose-600 text-white hover:bg-rose-500',
    badge: 'bg-gray-100 border border-gray-200 text-gray-700',
    shadow: 'shadow-lg shadow-gray-200/80',
    focusRing: 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
    blob1: 'bg-blue-200/30',
    blob2: 'bg-indigo-200/30',
    blob3: 'bg-purple-200/20',
    status: {
      done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      progress: 'bg-blue-50 text-blue-700 border-blue-200',
      blocked: 'bg-rose-50 text-rose-700 border-rose-200',
      todo: 'bg-gray-100 text-gray-600 border-gray-200',
      pending: 'bg-gray-50 text-gray-500 border-gray-300',
    },
  },
};

export const defaultTheme: ThemeName = 'modern';
