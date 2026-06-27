'use client';

import { useState, useEffect, useRef, Suspense, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart3, 
  Layers, 
  Droplet, 
  Factory, 
  Shield, 
  BookOpen,
  ChevronDown, 
  ChevronRight, 
  Bell, 
  Globe, 
  User, 
  Menu,
  Check,
  Cpu,
  Moon,
  Sun,
  Palette,
  ChevronLeft,
  Settings,
  HelpCircle,
  List,
  MapPin,
  History,
  FlaskConical,
  Clock,
  ShieldCheck,
  ShieldAlert,
  GitBranch,
  ClipboardCheck,
  Search
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-provider';
import type { ThemeName } from '@/lib/theme/theme-config';
import { persistLanguage } from '@/lib/i18n/i18n-provider';
import { languages, type Language } from '@/lib/i18n/settings';
import { usePermission } from '@/lib/permission/can';
import { useAuth } from '@/lib/auth/auth-provider';
import { useRealtimeEvent } from '@/lib/realtime/use-realtime';
import { listNotifications, type AlertNotification } from '@/lib/services/notification';

const LANG_META = [
  { code: 'th', label: 'ไทย', flag: '🇹🇭', short: 'TH' },
  { code: 'en', label: 'English', flag: '🇬🇧', short: 'EN' },
  { code: 'cn', label: '中文', flag: '🇨🇳', short: 'CN' },
  { code: 'ja', label: '日本語', flag: '🇯🇵', short: 'JA' },
  { code: 'mm', label: 'မြန်မာ', flag: '🇲🇲', short: 'MM' },
];

type MenuItem = { key: string; labelKey: string; href: string; icon: any; perm?: string; adminOnly?: boolean };
type MenuGroup = { key: string; labelKey: string; icon: any; perm?: string; adminOnly?: boolean; items: MenuItem[] };

const MENU: MenuGroup[] = [
  { 
    key: 'overview', 
    labelKey: 'nav.overview',
    icon: BarChart3,
    perm: 'reports:view',
    items: [{ key: 'dashboard', labelKey: 'nav.dashboard', href: '/', icon: BarChart3 }] 
  },
  { 
    key: 'cylinder', 
    labelKey: 'nav.cylinder',
    icon: Layers,
    perm: 'cylinders:read',
    items: [
      { key: 'cylinderList', labelKey: 'nav.cylinderList', href: '/cylinders?tab=list', icon: List },
      { key: 'cylinderStatus', labelKey: 'nav.cylinderStatus', href: '/cylinders?tab=status', icon: BarChart3 },
      { key: 'cylinderLocation', labelKey: 'nav.cylinderLocation', href: '/cylinders?tab=location', icon: MapPin },
      { key: 'cylinderHistory', labelKey: 'nav.cylinderHistory', href: '/cylinders?tab=history', icon: History },
    ] 
  },
  { 
    key: 'ink', 
    labelKey: 'nav.ink',
    icon: Droplet,
    perm: 'inks:read',
    items: [
      { key: 'inkFormula', labelKey: 'nav.inkFormula', href: '/inks?tab=formulas', icon: FlaskConical },
      { key: 'inkBatch', labelKey: 'nav.inkBatch', href: '/inks?tab=batch', icon: List },
      { key: 'inkExpiry', labelKey: 'nav.inkExpiry', href: '/inks?tab=expiry', icon: Clock },
      { key: 'inkShade', labelKey: 'nav.inkShade', href: '/inks?tab=shade', icon: Palette },
    ] 
  },
  { 
    key: 'production', 
    labelKey: 'nav.production',
    icon: Factory,
    perm: 'jobs:read',
    items: [
      { key: 'verification', labelKey: 'nav.verification', href: '/production?tab=verification', icon: ShieldCheck, perm: 'jobs:verify' },
      { key: 'prodLog', labelKey: 'nav.prodLog', href: '/production?tab=log', icon: List },
      { key: 'traceability', labelKey: 'nav.traceability', href: '/production?tab=traceability', icon: GitBranch },
    ] 
  },
  { 
    key: 'system', 
    labelKey: 'nav.settings',
    icon: Shield,
    items: [
      { key: 'settings', labelKey: 'nav.masterSetup', href: '/setup?tab=master', icon: Settings, perm: 'settings:master.manage' },
      { key: 'ruleEngine', labelKey: 'nav.ruleEngine', href: '/setup?tab=rules', icon: Shield, perm: 'workflows:rules.manage' },
      { key: 'approvalMatrix', labelKey: 'nav.approvalMatrix', href: '/setup?tab=approvals', icon: User, perm: 'workflows:approvals.manage' },
      { key: 'userMgt', labelKey: 'nav.userMgt', href: '/settings/users', icon: User, perm: 'auth:users.read' },
      { key: 'permissions', labelKey: 'nav.permissions', href: '/settings/permissions', icon: Shield, perm: 'permissions:manage' },
      { key: 'notifSettings', labelKey: 'nav.notifSettings', href: '/settings/notifications', icon: Bell, perm: 'notifications:settings.manage' },
      { key: 'auditLogs', labelKey: 'settings.auditLogs', href: '/settings/audit', icon: History, perm: 'audit:read' },
    ] 
  },
  {
    key: 'approvals',
    labelKey: 'nav.approvals',
    icon: ClipboardCheck,
    perm: 'approvals:read',
    items: [{ key: 'approvalList', labelKey: 'nav.approvals', href: '/approvals', icon: ClipboardCheck, perm: 'approvals:read' }]
  },
  {
    key: 'progress',
    labelKey: 'nav.progress',
    icon: BookOpen,
    perm: 'progress:read',
    items: [{ key: 'roadmap', labelKey: 'nav.progress', href: '/progress', icon: BookOpen, perm: 'progress:read' }]
  }
];

function DragHandleIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className}>
      <line x1="2" y1="5" x2="14" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></line>
      <circle cx="10" cy="5" r="2" fill="currentColor"></circle>
      <line x1="2" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></line>
      <circle cx="6" cy="11" r="2" fill="currentColor"></circle>
    </svg>
  );
}

let globalOpenGroups: Record<string, boolean> | null = null;
let globalIgnoreScrollSave = false;

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const { theme, setTheme, themeConfig } = useTheme();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTabQuery = searchParams.get('tab') || '';

  // Layout navigation states
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarReorder, setSidebarReorder] = useState(false);
  const [menuOrder, setMenuOrder] = useState<string[]>(['overview', 'cylinder', 'ink', 'production', 'system', 'approvals', 'progress']);
  
  // Track if this is the first initialization in this browser session
  const isFirstMount = useRef(globalOpenGroups === null);

  const navRef = useRef<HTMLElement>(null);
  const isUnmounting = useRef(false);
  const ignoreScrollSave = useRef(globalIgnoreScrollSave);

  // Track layout dimensions to detect layout reflows (so we ignore programmatic/shrink scrolls)
  const lastScrollHeight = useRef(0);
  const lastClientHeight = useRef(0);

  useEffect(() => {
    return () => {
      isUnmounting.current = true;
    };
  }, []);

  useEffect(() => {
    globalIgnoreScrollSave = true;
    ignoreScrollSave.current = true; // Lock scroll save on route change
    const timer = setTimeout(() => {
      globalIgnoreScrollSave = false;
      ignoreScrollSave.current = false;
    }, 1200);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const isSetup = pathname === '/setup';
    const isProgress = pathname === '/progress';

    const base = globalOpenGroups || {
      overview: true,
      cylinder: true,
      ink: true,
      production: true,
      system: isSetup,
      progress: isProgress
    };

    // Auto-expand the active section group
    const next = { ...base };
    if (isSetup) next.system = true;
    if (isProgress) next.progress = true;

    return next;
  });

  // Keep global variable synchronized
  useEffect(() => {
    globalOpenGroups = openGroups;
  }, [openGroups]);

  // Dropdown states
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const { user, logout, loading: authLoading, isAuthenticated } = useAuth();
  
  // Map production role key to role.production for localization compatibility
  const userRole = user?.role === 'production' ? 'operator' : (user?.role || 'viewer');

  // Permission-based menu filtering
  const { check, loading: permLoading } = usePermission();

  // Restore scroll position
  useEffect(() => {
    if (!sidebarOpen) return;
    const savedScroll = sessionStorage.getItem('sidebar_scroll_top');
    if (!savedScroll || !navRef.current) return;
    
    const targetScroll = parseInt(savedScroll, 10);
    if (isNaN(targetScroll) || targetScroll < 0) return;

    const restore = () => {
      if (navRef.current) {
        navRef.current.scrollTop = targetScroll;
        // Sync our dimension tracking variables after restoration
        lastScrollHeight.current = navRef.current.scrollHeight;
        lastClientHeight.current = navRef.current.clientHeight;
      }
    };

    restore();

    // Run restore at progressive intervals to handle async loading/layout passes
    const timeouts = [50, 150, 300, 500, 1000].map(delay => setTimeout(restore, delay));

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [sidebarOpen, pathname, searchParams, permLoading]);

  const saveScrollPosition = (element: HTMLElement) => {
    if (!sidebarOpen || isUnmounting.current || ignoreScrollSave.current || globalIgnoreScrollSave) return;
    const { scrollTop, scrollHeight, clientHeight } = element;
    // Save scroll position for scrollable layout state
    if (scrollTop > 0 || scrollHeight > clientHeight) {
      sessionStorage.setItem('sidebar_scroll_top', scrollTop.toString());
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    // Initialize layout dimension tracking on the first scroll event
    if (lastScrollHeight.current === 0 && lastClientHeight.current === 0) {
      lastScrollHeight.current = scrollHeight;
      lastClientHeight.current = clientHeight;
    }

    // Ignore scroll events caused by reflows/resizing (where height/size changes)
    if (scrollHeight !== lastScrollHeight.current || clientHeight !== lastClientHeight.current) {
      lastScrollHeight.current = scrollHeight;
      lastClientHeight.current = clientHeight;
      return;
    }

    saveScrollPosition(e.currentTarget);
  };

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    const element = e.currentTarget;
    saveScrollPosition(element);
    
    // Lock scroll saving if they clicked a link to navigate
    const isLinkClick = (e.target as HTMLElement).closest('a');
    if (isLinkClick) {
      globalIgnoreScrollSave = true;
      ignoreScrollSave.current = true;
      // Safety timeout to release lock in case route transition doesn't happen
      setTimeout(() => {
        globalIgnoreScrollSave = false;
        ignoreScrollSave.current = false;
      }, 1500);
    }
  };

  // Notifications
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listNotifications().then(setNotifications).catch(() => {});
  }, []);

  // Custom event listener to capture local label printing events and log them
  useEffect(() => {
    const handlePrintEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      let details = 'Printed labels';
      if (customEvent.detail) {
        if (typeof customEvent.detail === 'string') {
          details = customEvent.detail;
        } else if (typeof customEvent.detail === 'object') {
          const { type, data } = customEvent.detail;
          if (type && data) {
            const idVal = data.id || data.serialNumber || data.batchNumber || data.code || '';
            details = `Printed label for ${type}: ${idVal}`;
          } else {
            details = JSON.stringify(customEvent.detail);
          }
        }
      }
      import('@/lib/services/audit').then(({ createAuditLog }) => {
        createAuditLog('print.label', details).catch(err => console.error('Failed to log print audit', err));
      });
    };
    window.addEventListener('print-label', handlePrintEvent);
    return () => window.removeEventListener('print-label', handlePrintEvent);
  }, []);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced search logic
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { globalSearch } = await import('@/lib/services/search');
        const res = await globalSearch(searchQuery);
        setSearchResults(res);
      } catch (err) {
        console.error('Global search error', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useRealtimeEvent('notification:alerts', (data: AlertNotification[]) => {
    setNotifications(data);
  });

  // Refs for click outside
  const roleRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) setShowRoleMenu(false);
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setShowThemeMenu(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLangMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_menu_order');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === MENU.length) {
          setMenuOrder(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleDragStart = (e: React.DragEvent, key: string) => {
    e.dataTransfer.setData('text/plain', key);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    const sourceKey = e.dataTransfer.getData('text/plain');
    if (sourceKey === targetKey) return;

    setMenuOrder(prev => {
      const next = [...prev];
      const sourceIdx = next.indexOf(sourceKey);
      const targetIdx = next.indexOf(targetKey);
      if (sourceIdx === -1 || targetIdx === -1) return prev;
      
      next.splice(sourceIdx, 1);
      next.splice(targetIdx, 0, sourceKey);
      
      localStorage.setItem('sidebar_menu_order', JSON.stringify(next));
      return next;
    });
  };

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('sidebar_open_groups', JSON.stringify(next));
      return next;
    });
  };

  const isItemActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    // Parse target url
    const targetPath = href.split('?')[0];
    const targetTab = href.split('tab=')[1] || '';

    if (pathname === targetPath) {
      if (!targetTab) return true;
      return activeTabQuery === targetTab;
    }
    return false;
  };

  useEffect(() => {
    // Determine which groups contain an active item and should be expanded
    const activeGroups: Record<string, boolean> = {};
    MENU.forEach(group => {
      const hasActiveItem = group.items.some(item => isItemActive(item.href));
      if (hasActiveItem) {
        activeGroups[group.key] = true;
      }
    });

    // Load user preferences from localStorage
    const saved = localStorage.getItem('sidebar_open_groups');
    let savedGroups = {};
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          savedGroups = parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Merge default, active, and saved groups
    setOpenGroups(prev => ({
      ...prev,
      ...savedGroups,
      ...activeGroups
    }));
  }, [pathname, activeTabQuery]);

  if (authLoading) {
    return (
      <div className={`h-screen w-screen flex items-center justify-center text-sm ${themeConfig.textMuted} bg-slate-950`}>
        {t('common.loading') || 'Loading...'}
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const currentLangMeta = LANG_META.find(l => l.code === i18n.language) || LANG_META[0];

  return (
    <div className={`h-screen w-screen relative overflow-hidden flex flex-col ${themeConfig.appBg}`}>
      {/* Background ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full ${themeConfig.blob1} blur-3xl transition-all duration-1000`}></div>
        <div className={`absolute top-1/2 -left-40 w-80 h-80 rounded-full ${themeConfig.blob2} blur-3xl transition-all duration-1000`}></div>
        <div className={`absolute -bottom-40 right-1/3 w-72 h-72 rounded-full ${themeConfig.blob3} blur-3xl transition-all duration-1000`}></div>
      </div>

      {/* 1. TOP NAVBAR spanning full width */}
      <header className={`h-12 flex-shrink-0 flex items-center justify-between px-4 z-40 relative border-b ${themeConfig.border} ${themeConfig.navBar}`}>
        {/* Brand branding */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-md">
              i
            </div>
            <span className="text-sm font-bold text-white hidden sm:inline">iSmart Pro ERP</span>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${themeConfig.badge}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span className={themeConfig.textPrimary}>{t('app.title')}</span>
          </div>
        </div>

        {/* Right tools and settings */}
        <div className="flex items-center gap-2">
          {/* Global Search Input Box */}
          <div className="relative mr-2" ref={searchContainerRef}>
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-2.5 text-gray-400" />
              <input
                type="text"
                placeholder={t('common.searchPlaceholder') || 'Search everything...'}
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-48 md:w-64 rounded-full border pl-8 pr-3 py-1 text-xs outline-none transition-all duration-200 ${
                  searchFocused 
                    ? 'w-64 md:w-80 border-indigo-500 bg-white/10 text-white' 
                    : 'border-white/10 bg-white/5 text-gray-300'
                }`}
              />
            </div>

            {searchFocused && (searchResults || searchLoading) && (
              <div className={`absolute right-0 top-full mt-1.5 rounded-xl min-w-[320px] max-w-[450px] max-h-[400px] overflow-y-auto z-50 border shadow-2xl p-2 ${themeConfig.dialog}`}>
                {searchLoading ? (
                  <div className="px-3 py-4 text-center text-xs text-gray-400">Loading...</div>
                ) : (
                  Object.keys(searchResults || {}).every(key => searchResults[key].length === 0) ? (
                    <div className="px-3 py-4 text-center text-xs text-gray-500">No results found</div>
                  ) : (
                    Object.entries(searchResults || {}).map(([category, items]: [string, any]) => {
                      if (items.length === 0) return null;
                      return (
                        <div key={category} className="mb-2 last:mb-0">
                          <div className="px-2 py-1 text-[10px] font-bold text-indigo-400 uppercase tracking-wider border-b border-white/5">
                            {category === 'cylinders' ? (t('menu.cylinders') || 'Cylinders') :
                             category === 'products' ? (t('menu.products') || 'Products') :
                             category === 'customers' ? (t('menu.customers') || 'Customers') :
                             category === 'inkFormulas' ? (t('ink.formulas') || 'Ink Formulas') :
                             category === 'jobs' ? (t('menu.jobs') || 'Production Jobs') :
                             category}
                          </div>
                          <div className="mt-1 space-y-0.5">
                            {items.map((item: any) => (
                              <button
                                key={item.id}
                                onClick={() => {
                                  router.push(item.link);
                                  setSearchFocused(false);
                                  setSearchQuery('');
                                }}
                                className="w-full text-left px-2 py-1.5 rounded-lg transition hover:bg-white/5 flex flex-col"
                              >
                                <span className="text-xs font-bold text-white">{item.title}</span>
                                <span className="text-[10px] text-gray-400 mt-0.5">{item.subtitle}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )
                )}
              </div>
            )}
          </div>

          {/* Notifications bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-lg transition ${themeConfig.panelHover} ${themeConfig.textSecondary}`}
            >
              <Bell size={16} />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
              )}
            </button>
            {showNotifications && (
              <div className={`absolute right-0 top-full mt-1.5 rounded-xl py-1 min-w-[320px] max-h-[400px] overflow-y-auto z-50 border shadow-2xl ${themeConfig.dialog}`}>
                <div className="px-3 py-2 border-b border-white/10">
                  <p className="text-xs font-bold text-white">Notifications</p>
                  <p className="text-[10px] text-gray-400">{notifications.length} alert{notifications.length !== 1 ? 's' : ''}</p>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-3 py-6 text-center text-xs text-gray-500">No alerts</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="px-3 py-2.5 border-b border-white/5 hover:bg-white/5 transition flex items-start gap-2.5">
                      <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                        n.severity === 'high' ? 'bg-rose-500' : n.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white">{n.title}</p>
                        <p className={`text-[10px] ${themeConfig.textSecondary} mt-0.5`}>{n.message}</p>
                      </div>
                      <a
                        href={n.type === 'ink_expiry' ? '/inks?tab=expiry' : '/cylinders?tab=status'}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex-shrink-0 mt-0.5"
                      >
                        View
                      </a>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Languages Selector */}
          <div className="relative" ref={langRef}>
            <button 
              onClick={() => setShowLangMenu(!showLangMenu)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${themeConfig.panelHover} ${themeConfig.textSecondary}`}
            >
              <Globe size={14} />
              <span>{currentLangMeta.short}</span>
              <ChevronDown size={12} />
            </button>
            {showLangMenu && (
              <div className={`absolute right-0 top-full mt-1.5 rounded-xl py-1 min-w-[130px] z-50 border shadow-2xl flex flex-col ${themeConfig.dialog}`}>
                {LANG_META.map(lm => (
                  <button 
                    key={lm.code} 
                    onClick={() => { persistLanguage(lm.code as Language); setShowLangMenu(false); }}
                    className={`w-full px-3 py-2 text-left text-xs font-bold transition flex items-center gap-2 ${
                      i18n.language === lm.code ? themeConfig.primaryText : themeConfig.textSecondary
                    } ${themeConfig.panelHover}`}
                  >
                    <span>{lm.flag}</span>
                    <span className="flex-1">{lm.label}</span>
                    {i18n.language === lm.code && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme customizer */}
          <div className="relative" ref={themeRef}>
            <button 
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className={`p-2 rounded-lg transition ${themeConfig.panelHover} ${themeConfig.textSecondary}`}
            >
              <Palette size={16} />
            </button>
            {showThemeMenu && (
              <div className={`absolute right-0 top-full mt-1.5 rounded-xl py-1 min-w-[150px] z-50 border shadow-2xl flex flex-col ${themeConfig.dialog}`}>
                {[
                  { name: 'modern', label: t('theme.modern'), icon: Cpu },
                  { name: 'dark', label: t('theme.dark'), icon: Moon },
                  { name: 'light', label: t('theme.light'), icon: Sun },
                ].map(th => {
                  const Icon = th.icon;
                  return (
                    <button 
                      key={th.name} 
                      onClick={() => { setTheme(th.name as ThemeName); setShowThemeMenu(false); }}
                      className={`w-full px-3 py-2 text-left text-xs font-bold transition flex items-center gap-2 ${
                        theme === th.name ? themeConfig.primaryText : themeConfig.textSecondary
                      } ${themeConfig.panelHover}`}
                    >
                      <Icon size={13} />
                      <span className="flex-1">{th.label}</span>
                      {theme === th.name && <Check size={12} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className={`w-px h-5 border-l ${themeConfig.border} mx-1`}></div>

          {/* User Profile dropdown */}
          <div className="relative" ref={roleRef}>
            <button 
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className={`flex items-center gap-2 p-1 rounded-lg transition ${themeConfig.panelHover}`}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-black shadow-md border border-white/20">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className={`text-xs font-bold hidden md:inline truncate max-w-[120px] ${themeConfig.textPrimary}`}>
                {user?.username || 'User'}
              </span>
              <ChevronDown size={12} className={themeConfig.textMuted} />
            </button>
            {showRoleMenu && (
              <div className={`absolute right-0 top-full mt-1.5 rounded-xl py-1 min-w-[180px] z-50 border shadow-2xl flex flex-col ${themeConfig.dialog}`}>
                <div className="px-3 py-2 border-b border-white/10">
                  <p className="text-xs font-bold text-white truncate">{user?.username}</p>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">{t(`role.${userRole}`)}</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setShowRoleMenu(false)}
                  className={`w-full px-3 py-2 text-left text-xs font-bold transition flex items-center gap-2 ${themeConfig.textSecondary} ${themeConfig.panelHover}`}
                >
                  <Settings size={13} />
                  <span className="flex-1">{t('nav.systemSettings')}</span>
                </Link>
                <div className={`border-t ${themeConfig.border} my-1`}></div>
                <button 
                  onClick={() => { logout(); setShowRoleMenu(false); }}
                  className={`w-full px-3 py-2 text-left text-xs font-bold transition flex items-center gap-2 text-rose-400 ${themeConfig.panelHover}`}
                >
                  <User size={13} />
                  <span className="flex-1">{t('btn.logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTAINER below navbar */}
      <div className="flex flex-1 overflow-hidden z-10 relative">
        
        {/* Left Sidebar */}
        <aside className={`flex-shrink-0 flex flex-col h-full z-30 transition-all duration-300 border-r ${themeConfig.border} ${themeConfig.sidebar} ${
          sidebarOpen ? 'w-64' : 'w-14'
        }`}>
          {/* Sidebar inner header */}
          <div className={`px-4 py-4 flex items-center gap-2 border-b ${themeConfig.border}`}>
            {sidebarOpen ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Layers size={16} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate ${themeConfig.textPrimary}`}>{t('app.title')}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-gray-400">{t('app.version')}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span className="text-[10px] text-emerald-400 font-medium">{t('misc.healthy')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setSidebarOpen(true)}
                className={`p-1 mx-auto rounded hover:bg-white/10 ${themeConfig.textSecondary}`}
              >
                <Menu size={16} />
              </button>
            )}
          </div>

          {/* Menus lists */}
          <nav 
            ref={navRef}
            onScroll={handleScroll}
            onClick={handleClick}
            className="flex-1 overflow-y-auto py-3 px-2 space-y-1" 
            aria-label={t('nav.main')}
          >
            {(() => {
              const isAdmin = user?.role === 'admin';

              const canSeeItem = (item: MenuItem) => {
                if (item.adminOnly && !isAdmin) return false;
                if (item.perm && !permLoading && !check(item.perm) && !isAdmin) return false;
                return true;
              };

              const visibleMenu = MENU.map(group => ({
                ...group,
                items: group.items.filter(canSeeItem),
              })).filter(group => {
                if (group.adminOnly && !isAdmin) return false;
                if (group.perm && !permLoading && !check(group.perm) && !isAdmin) return false;
                return group.items.length > 0;
              });

              const orderedMenu = [...visibleMenu].sort((a, b) => {
                return menuOrder.indexOf(a.key) - menuOrder.indexOf(b.key);
              });
              return orderedMenu.map(group => {
                const isOpen = openGroups[group.key];
                const GroupIcon = group.icon;

                if (!sidebarOpen) {
                  // Collapsed sidebar shortcuts
                  const isAnyActive = group.items.some(i => isItemActive(i.href));
                  return (
                    <button 
                      key={group.key}
                      onClick={() => {
                        setSidebarOpen(true);
                        setOpenGroups(prev => {
                          const next = { ...prev, [group.key]: true };
                          localStorage.setItem('sidebar_open_groups', JSON.stringify(next));
                          return next;
                        });
                        router.push(group.items[0].href);
                      }}
                      className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-all ${
                        isAnyActive 
                          ? `${themeConfig.primaryBg} text-white shadow-md` 
                          : `text-gray-400 hover:bg-white/5 hover:text-white`
                      }`}
                      title={t(group.labelKey)}
                    >
                      <GroupIcon size={17} />
                    </button>
                  );
                }

                // Normal Expanded Group dropdowns
                const isGroupActive = group.items.some(i => isItemActive(i.href));
                const reorderProps = sidebarReorder ? {
                  draggable: true,
                  onDragStart: (e: React.DragEvent) => handleDragStart(e, group.key),
                  onDragOver: handleDragOver,
                  onDrop: (e: React.DragEvent) => handleDrop(e, group.key),
                } : {};

                return (
                  <div 
                    key={group.key} 
                    {...reorderProps}
                    className={`space-y-0.5 transition-all duration-200 ${
                      sidebarReorder 
                        ? 'border border-dashed border-cyan-500/40 rounded-lg p-1.5 cursor-grab active:cursor-grabbing bg-cyan-500/5 hover:bg-cyan-500/10' 
                        : ''
                    }`}
                  >
                    {sidebarReorder ? (
                      <div className="flex items-center justify-between px-2.5 py-2 text-sm font-medium text-cyan-400 select-none">
                        <div className="flex items-center gap-2">
                          <DragHandleIcon className="text-cyan-400 flex-shrink-0" />
                          <span>{t(group.labelKey)}</span>
                        </div>
                        <span className="text-[10px] text-cyan-500/60 uppercase font-bold tracking-wider">Drag</span>
                      </div>
                    ) : group.items.length === 1 ? (
                      (() => {
                        const item = group.items[0];
                        const active = isItemActive(item.href);
                        const ItemIcon = item.icon || GroupIcon;
                        return (
                          <Link
                            href={item.href}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              active 
                                ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white font-medium shadow-md shadow-cyan-500/15' 
                                : `${themeConfig.textSecondary} ${themeConfig.panelHover}`
                            }`}
                          >
                            <ItemIcon size={16} />
                            <span className="truncate">{t(item.labelKey)}</span>
                          </Link>
                        );
                      })()
                    ) : (
                      <>
                        <button
                          onClick={() => toggleGroup(group.key)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                            isGroupActive ? themeConfig.primaryText : themeConfig.textSecondary
                          } hover:opacity-85`}
                        >
                          <span>{t(group.labelKey)}</span>
                          <span className={`transform transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`}>
                            <ChevronDown size={12} className={themeConfig.textMuted} />
                          </span>
                        </button>

                        {isOpen && (
                          <div className="pl-3 space-y-0.5">
                            {group.items.map(item => {
                              const active = isItemActive(item.href);
                              const ItemIcon = item.icon;
                              return (
                                <Link
                                  key={item.key}
                                  href={item.href}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                    active
                                      ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white font-medium shadow-md shadow-cyan-500/15'
                                      : `${themeConfig.textSecondary} ${themeConfig.panelHover}`
                                  }`}
                                >
                                  {ItemIcon && <ItemIcon size={16} />}
                                  <span className="truncate">{t(item.labelKey)}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              });
            })()}
          </nav>

          {/* Sidebar footer reordering & collapsing */}
          {sidebarOpen && sidebarReorder && (
            <div className={`p-3 border-t flex items-center justify-between ${themeConfig.border}`}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <DragHandleIcon className={`${themeConfig.textSecondary} flex-shrink-0`} />
                <span className={`text-[11px] ${themeConfig.textSecondary} font-semibold truncate`}>
                  {t('layout.dragHint')}
                </span>
              </div>
              <button 
                onClick={() => setSidebarReorder(false)}
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md hover:opacity-95"
                title={t('layout.done')}
              >
                <Check size={14} />
              </button>
            </div>
          )}

          {sidebarOpen && !sidebarReorder && (
            <div className={`p-3 border-t flex items-center justify-between ${themeConfig.border}`}>
              <button 
                onClick={() => setSidebarOpen(false)}
                className={`p-1.5 rounded hover:bg-white/10 transition-colors ${themeConfig.textSecondary}`}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setSidebarReorder(true)}
                className={`p-1.5 rounded hover:bg-white/10 transition-colors ${themeConfig.textSecondary}`}
                title={t('layout.dragHint')}
              >
                <DragHandleIcon className="text-current w-4 h-4" />
              </button>
            </div>
          )}
        </aside>

        {/* Content Panel Area */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 pb-16 sm:pb-6 relative z-10">
          <RouteGuard pathname={pathname}>{children}</RouteGuard>
        </main>
      </div>
    </div>
  );
}

/** Route-to-permission mapping for page-level access guard */
const ROUTE_PERMISSIONS: Array<{ pattern: RegExp; permission: string }> = [
  { pattern: /^\/$/, permission: 'reports:view' },
  { pattern: /^\/approvals/, permission: 'approvals:read' },
  { pattern: /^\/cylinders/, permission: 'cylinders:read' },
  { pattern: /^\/inks/, permission: 'inks:read' },
  { pattern: /^\/production/, permission: 'jobs:read' },
  { pattern: /^\/progress/, permission: 'progress:read' },
  { pattern: /^\/settings\/users/, permission: 'auth:users.read' },
  { pattern: /^\/settings\/permissions/, permission: 'permissions:manage' },
  { pattern: /^\/settings\/audit/, permission: 'audit:read' },
  { pattern: /^\/settings\/system/, permission: 'settings:system.manage' },
  { pattern: /^\/settings\/notifications/, permission: 'notifications:settings.manage' },
];

function RouteGuard({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  const { check, loading } = usePermission();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isAdmin = user?.role === 'admin';

  // Skip guard for non-authenticated routes
  if (pathname.startsWith('/login')) {
    return <>{children}</>;
  }

  // Admin always has access to everything (skip loading check too)
  if (isAdmin) return <>{children}</>;

  if (loading) return null;

  // Special case for setup page tabs
  if (pathname.startsWith('/setup')) {
    const tab = searchParams.get('tab') || 'master';
    let requiredPerm = 'settings:master.manage';
    if (tab === 'rules') requiredPerm = 'workflows:rules.manage';
    if (tab === 'approvals') requiredPerm = 'workflows:approvals.manage';

    if (!check(requiredPerm)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <ShieldAlert className="w-16 h-16 text-red-400" />
          <h2 className="text-xl font-bold text-red-400">Access Denied</h2>
          <p className="text-sm text-gray-400 max-w-md text-center">
            You do not have permission to access this page.
          </p>
        </div>
      );
    }
    return <>{children}</>;
  }

  const match = ROUTE_PERMISSIONS.find(r => r.pattern.test(pathname));
  if (!match) return <>{children}</>;

  if (!check(match.permission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldAlert className="w-16 h-16 text-red-400" />
        <h2 className="text-xl font-bold text-red-400">Access Denied</h2>
        <p className="text-sm text-gray-400 max-w-md text-center">
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center text-sm text-gray-400">Loading layout...</div>}>
      <AppLayoutContent>{children}</AppLayoutContent>
    </Suspense>
  );
}
