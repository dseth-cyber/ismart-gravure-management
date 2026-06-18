'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { useTheme } from '@/lib/theme/theme-provider';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { getRoles } from '@/lib/constants/roles';
import { useLocalStorage } from '@/lib/hooks/use-local-storage';
import { 
  BarChart3, 
  Layers, 
  AlertTriangle, 
  Factory, 
  MapPin, 
  User, 
  Droplet, 
  FlaskConical, 
  Plus, 
  Edit, 
  X, 
  Bell, 
  Check, 
  Settings,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/app-dialog';
import { 
  listMasterData, createMasterData, updateMasterData, deleteMasterData,
  restoreMasterData, permanentDeleteMasterData, emptyMasterTrash as emptyMasterTrashApi
} from '@/lib/services/master-data';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function SetupPageContent() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    setRoles(getRoles());
  }, []);

  // Active sub-page tab state
  const tabParamRaw = searchParams.get('tab') || 'master';
  const isLegacyTab = tabParamRaw === 'rules' || tabParamRaw === 'approvals';
  const tabParam = isLegacyTab ? 'workflows' : tabParamRaw;
  const [activeTab, setActiveTab] = useState(tabParam);
  const [workflowSubTab, setWorkflowSubTab] = useState<'all' | 'rules' | 'approvals'>(
    isLegacyTab ? tabParamRaw as 'rules' | 'approvals' : 'all'
  );

  useEffect(() => {
    const raw = searchParams.get('tab') || 'master';
    if (raw === 'rules' || raw === 'approvals') {
      setActiveTab('workflows');
      setWorkflowSubTab(raw);
    } else {
      setActiveTab(raw);
      setWorkflowSubTab('all');
    }
  }, [searchParams]);

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    setWorkflowSubTab('all');
    router.replace(`/setup?tab=${tab}`);
  };

  // 1. MASTER DATA TAB STATE
  const [activeCategory, setActiveCategory] = useState('status');
  const [showAddMasterModal, setShowAddMasterModal] = useState(false);
  const [editMasterItem, setEditMasterItem] = useState<any | null>(null);
  const [masterDuplicateError, setMasterDuplicateError] = useState('');

  const categories = [
    { id: 'status', icon: BarChart3, label: t('setup.statuses'), color: 'from-cyan-500 to-blue-500' },
    { id: 'cylinderType', icon: Layers, label: t('setup.cylinderTypes'), color: 'from-purple-500 to-pink-500' },
    { id: 'defectType', icon: AlertTriangle, label: t('setup.defectTypes'), color: 'from-rose-500 to-red-500' },
    { id: 'machine', icon: Factory, label: t('setup.machines'), color: 'from-emerald-500 to-teal-500' },
    { id: 'rack', icon: MapPin, label: t('setup.racks'), color: 'from-amber-500 to-orange-500' },
    { id: 'supplier', icon: User, label: t('setup.suppliers'), color: 'from-blue-500 to-indigo-500' },
    { id: 'inkType', icon: Droplet, label: t('setup.inkTypes'), color: 'from-violet-500 to-purple-500' },
    { id: 'solvent', icon: FlaskConical, label: t('setup.solvents'), color: 'from-teal-500 to-cyan-500' },
  ];

  const queryClient = useQueryClient();

  // Seed data constant kept as fallback
  const SEED_MASTER_DATA: Record<string, any[]> = {
    status: [
      { id: 1, name: 'Available', nameTh: 'พร้อมใช้งาน', color: '#10b981', icon: 'check', active: true },
      { id: 2, name: 'In Production', nameTh: 'ระหว่างผลิต', color: '#3b82f6', icon: 'factory', active: true },
      { id: 3, name: 'Reserved', nameTh: 'จองแล้ว', color: '#f59e0b', icon: 'clock', active: true },
      { id: 4, name: 'Under Repair', nameTh: 'ซ่อมแซม', color: '#ef4444', icon: 'settings', active: true },
      { id: 5, name: 'Pending Inspection', nameTh: 'รอตรวจสอบ', color: '#8b5cf6', icon: 'eye', active: true },
      { id: 6, name: 'Hold', nameTh: 'Hold', color: '#f97316', icon: 'alert', active: true },
      { id: 7, name: 'Waiting Supplier', nameTh: 'รอ Supplier', color: '#6b7280', icon: 'clock', active: false },
      { id: 8, name: 'Chrome Recoat', nameTh: 'ชุบ Chrome ใหม่', color: '#14b8a6', icon: 'refresh', active: false },
    ],
    cylinderType: [
      { id: 1, name: 'Dedicated', nameTh: 'เฉพาะ SKU', desc: 'ใช้กับ Product Code เดียว', active: true },
      { id: 2, name: 'Shared', nameTh: 'ใช้ร่วม Series', desc: 'ใช้ร่วมหลาย SKU ใน Series เดียวกัน', active: true },
      { id: 3, name: 'Common', nameTh: 'ใช้ร่วมทั่วไป', desc: 'ใช้ได้กับทุก SKU ในกลุ่ม', active: true },
      { id: 4, name: 'Backup', nameTh: 'สำรอง', desc: 'แม่พิมพ์สำรองเมื่อตัวหลักเสีย', active: true },
    ],
    defectType: [
      { id: 1, name: 'Surface Scratch', nameTh: 'รอยขีดข่วน', severity: 'Medium', active: true },
      { id: 2, name: 'Chrome Wear', nameTh: 'Chrome สึกหรอ', severity: 'High', active: true },
      { id: 3, name: 'Dent', nameTh: 'รอยบุ๋ม', severity: 'High', active: true },
      { id: 4, name: 'Engraving Defect', nameTh: 'ลายผิดพลาด', severity: 'Critical', active: true },
      { id: 5, name: 'Color Contamination', nameTh: 'สีปนเปื้อน', severity: 'Medium', active: true },
      { id: 6, name: 'Edge Damage', nameTh: 'ขอบเสียหาย', severity: 'Low', active: true },
    ],
    machine: [
      { id: 1, name: 'M-01', nameTh: 'เครื่อง 1', type: 'Gravure Press', line: 'Line A', active: true },
      { id: 2, name: 'M-02', nameTh: 'เครื่อง 2', type: 'Gravure Press', line: 'Line A', active: true },
      { id: 3, name: 'M-03', nameTh: 'เครื่อง 3', type: 'Gravure Press', line: 'Line B', active: true },
      { id: 4, name: 'M-04', nameTh: 'เครื่อง 4', type: 'Gravure Press', line: 'Line B', active: true },
    ],
    rack: [
      { id: 1, name: 'Rack A', nameTh: 'ชั้น A', zone: 'Warehouse 1', capacity: 60, used: 42, active: true },
      { id: 2, name: 'Rack B', nameTh: 'ชั้น B', zone: 'Warehouse 1', capacity: 50, used: 38, active: true },
      { id: 3, name: 'Rack C', nameTh: 'ชั้น C', zone: 'Warehouse 2', capacity: 40, used: 28, active: true },
      { id: 4, name: 'Rack D', nameTh: 'ชั้น D', zone: 'Warehouse 2', capacity: 30, used: 22, active: true },
    ],
    supplier: [
      { id: 1, name: 'DIC Corp', nameTh: 'DIC Corp', type: 'Ink', contact: 'tanaka@dic.co.jp', active: true },
      { id: 2, name: 'Toyo Ink', nameTh: 'Toyo Ink', type: 'Ink', contact: 'sales@toyoink.com', active: true },
      { id: 3, name: 'UFlex', nameTh: 'UFlex', type: 'Cylinder', contact: 'info@uflex.com', active: true },
      { id: 4, name: 'Daetwyler', nameTh: 'Daetwyler', type: 'Doctor Blade', contact: 'sales@daetwyler.com', active: true },
    ],
    inkType: [
      { id: 1, name: 'Surface Print', nameTh: 'พิมพ์ผิวนอก', desc: 'สำหรับพิมพ์ด้านนอกฟิล์ม', active: true },
      { id: 2, name: 'Lamination', nameTh: 'พิมพ์ลามิเนต', desc: 'สำหรับพิมพ์ระหว่างชั้นฟิล์ม', active: true },
      { id: 3, name: 'Retort', nameTh: 'ทนความร้อน', desc: 'สำหรับบรรจุภัณฑ์ Retort', active: true },
      { id: 4, name: 'Low VOC', nameTh: 'Low VOC', desc: 'สารระเหยต่ำ สำหรับอาหาร', active: true },
    ],
    solvent: [
      { id: 1, name: 'Ethyl Acetate', nameTh: 'เอทิลอะซิเตท', boiling: '77°C', active: true },
      { id: 2, name: 'Toluene', nameTh: 'โทลูอีน', boiling: '111°C', active: true },
      { id: 3, name: 'IPA', nameTh: 'ไอโซโพรพิลแอลกอฮอล์', boiling: '82°C', active: true },
      { id: 4, name: 'MEK', nameTh: 'เมทิลเอทิลคีโตน', boiling: '80°C', active: true },
    ],
  };

  const CATEGORIES = ['status', 'cylinderType', 'defectType', 'machine', 'rack', 'supplier', 'inkType', 'solvent'];

  const [masterDataInitialized, setMasterDataInitialized] = useState(false);

  // Load from API — fall back to localStorage seed data
  const { data: masterData = {} } = useQuery({
    queryKey: ['masterData'],
    queryFn: async () => {
      const result: Record<string, any[]> = {};
      for (const cat of CATEGORIES) {
        try {
          const items = await listMasterData(cat, true);
          result[cat] = items.map((item: any) => ({
            id: item.id,
            _apiId: item.id,
            name: item.name,
            nameTh: item.nameTh || '',
            active: item.active,
            deletedAt: item.deletedAt ? new Date(item.deletedAt).getTime() : undefined,
            ...(item.extra || {}),
          }));
        } catch {
          result[cat] = [];
        }
      }
      return result;
    },
    staleTime: 30000,
    retry: 1,
  });

  // Seed API if empty after first load
  useEffect(() => {
    const anyData = CATEGORIES.some(cat => (masterData[cat]?.length ?? 0) > 0);
    if (!anyData && !masterDataInitialized) {
      setMasterDataInitialized(true);
      const seedAll = async () => {
        for (const cat of CATEGORIES) {
          for (const item of SEED_MASTER_DATA[cat] || []) {
            try {
              const { id, _apiId, deletedAt, ...rest } = item;
              await createMasterData({ category: cat, name: item.name, nameTh: item.nameTh, active: item.active, extra: rest });
            } catch { }
          }
        }
        queryClient.invalidateQueries({ queryKey: ['masterData'] });
      };
      seedAll();
    }
  }, [masterData, masterDataInitialized, queryClient]);

  const toggleMasterActive = async (id: string) => {
    const item = (masterData[activeCategory] || []).find((i: any) => i.id === id);
    if (!item) return;
    try {
      await updateMasterData(id, { active: !item.active });
      queryClient.invalidateQueries({ queryKey: ['masterData'] });
    } catch { }
  };

  const deleteMasterItem = async (id: string) => {
    try {
      await deleteMasterData(id);
      queryClient.invalidateQueries({ queryKey: ['masterData'] });
      setMasterDeleteTarget(null);
    } catch { }
  };

  const restoreMasterItem = async (id: string) => {
    try {
      await restoreMasterData(id);
      queryClient.invalidateQueries({ queryKey: ['masterData'] });
    } catch { }
  };

  const permanentDeleteMasterItem = async (id: string) => {
    try {
      await permanentDeleteMasterData(id);
      queryClient.invalidateQueries({ queryKey: ['masterData'] });
      setMasterPermDeleteTarget(null);
    } catch { }
  };

  const handleEmptyMasterTrash = async () => {
    try {
      await emptyMasterTrashApi(activeCategory);
      queryClient.invalidateQueries({ queryKey: ['masterData'] });
      setMasterEmptyTrashOpen(false);
    } catch { }
  };

  const handleRulesSoftDelete = () => {
    if (!rulesDeleteTarget) return;
    setRules(prev => prev.map(r => r.id === rulesDeleteTarget.id ? { ...r, deletedAt: Date.now() } : r));
    setRulesDeleteTarget(null);
  };

  const handleRulesPermanentDelete = () => {
    if (!rulesPermDeleteTarget) return;
    setRules(prev => prev.filter(r => r.id !== rulesPermDeleteTarget.id));
    setRulesPermDeleteTarget(null);
  };

  const handleRulesEmptyTrash = () => {
    setRules(prev => prev.filter(r => !r.deletedAt));
    setRulesEmptyTrashOpen(false);
  };

  const handleApprovalsSoftDelete = () => {
    if (!approvalsDeleteTarget) return;
    setMatrix(prev => prev.map(x => x.id === approvalsDeleteTarget.id ? { ...x, deletedAt: Date.now() } : x));
    setApprovalsDeleteTarget(null);
  };

  const handleApprovalsPermanentDelete = () => {
    if (!approvalsPermDeleteTarget) return;
    setMatrix(prev => prev.filter(x => x.id !== approvalsPermDeleteTarget.id));
    setApprovalsPermDeleteTarget(null);
  };

  const handleApprovalsEmptyTrash = () => {
    setMatrix(prev => prev.filter(x => !x.deletedAt));
    setApprovalsEmptyTrashOpen(false);
  };

  // Master Data trash state
  const [showMasterTrash, setShowMasterTrash] = useState(false);
  const [masterDeleteTarget, setMasterDeleteTarget] = useState<any | null>(null);
  const [masterPermDeleteTarget, setMasterPermDeleteTarget] = useState<any | null>(null);
  const [masterEmptyTrashOpen, setMasterEmptyTrashOpen] = useState(false);

  const currentCategory = categories.find(c => c.id === activeCategory);
  const currentCategoryItems = (masterData[activeCategory] || []).filter(item =>
    showMasterTrash ? item.deletedAt : !item.deletedAt
  );

  // 2. RULE ENGINE TAB STATE
  const [rules, setRules] = useLocalStorage<any[]>('setup_rules', [
    { id: 1, name: 'Ink Near Expiry Alert', active: true,
      condition: { field: 'ink.daysToExpiry', op: '<', value: '7' },
      actions: [{ type: 'notify', target: 'Supervisor' }, { type: 'highlight', color: 'red' }, { type: 'block', desc: 'Block production use' }] },
    { id: 2, name: 'Cylinder High Mileage', active: true,
      condition: { field: 'cylinder.meterRun', op: '>', value: '500000' },
      actions: [{ type: 'notify', target: 'Maintenance' }, { type: 'task', desc: 'Create maintenance ticket' }] },
    { id: 3, name: 'QC Fail Auto Hold', active: true,
      condition: { field: 'qc.result', op: '=', value: 'Fail' },
      actions: [{ type: 'status', desc: 'Change to Hold' }, { type: 'notify', target: 'QA Manager' }] },
    { id: 4, name: 'Ink Stock Low', active: false,
      condition: { field: 'ink.remaining', op: '<', value: '5' },
      actions: [{ type: 'notify', target: 'Ink Room' }, { type: 'notify', target: 'Purchasing' }] },
    { id: 5, name: 'Formula Revision Changed', active: true,
      condition: { field: 'formula.revision', op: 'changed', value: '' },
      actions: [{ type: 'notify', target: 'All Operators' }, { type: 'notify', target: 'QC' }] },
  ]);

  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [ruleActionType, setRuleActionType] = useState('notify');
  const [ruleName, setRuleName] = useState('');
  const [ruleField, setRuleField] = useState('ink.daysToExpiry');
  const [ruleOp, setRuleOp] = useState('<');
  const [ruleVal, setRuleVal] = useState('');
  const [ruleActionDesc, setRuleActionDesc] = useState('');
  const [ruleDuplicateError, setRuleDuplicateError] = useState('');

  const toggleRuleActive = (id: number) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const deleteRule = (id: number) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  // Rules trash state
  const [showRulesTrash, setShowRulesTrash] = useState(false);
  const [rulesDeleteTarget, setRulesDeleteTarget] = useState<any | null>(null);
  const [rulesPermDeleteTarget, setRulesPermDeleteTarget] = useState<any | null>(null);
  const [rulesEmptyTrashOpen, setRulesEmptyTrashOpen] = useState(false);

  const ruleActionIcons = {
    notify: { icon: Bell, color: 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20' },
    highlight: { icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/10 border border-amber-500/20' },
    block: { icon: X, color: 'text-rose-400 bg-rose-500/10 border border-rose-500/20' },
    status: { icon: BarChart3, color: 'text-purple-400 bg-purple-500/10 border border-purple-500/20' },
    task: { icon: Layers, color: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' },
  };

  const fieldOptions = ['ink.daysToExpiry', 'ink.remaining', 'cylinder.meterRun', 'cylinder.status', 'qc.result', 'formula.revision', 'production.delay'];
  // Dynamic fields derived from master data categories — admin adds items in Master Data → auto appears here
  const dynamicFieldOptions = Object.entries(masterData).flatMap(([cat, items]) =>
    items.length > 0 ? Object.keys(items[0]).filter(k => k !== 'id' && k !== 'active' && k !== 'icon').map(k => `${cat}.${k}`) : []
  );
  const opOptions = ['<', '>', '=', '!=', 'changed', 'contains'];

  // 3. APPROVAL MATRIX STATE — no hardcoded lists, admin configures everything via UI
  const [matrix, setMatrix] = useLocalStorage<any[]>('setup_matrix', [
    { id: 1, event: 'Formula Revision Change', refType: 'formula_change', steps: [{ step: 1, role: 'qa_manager', sla: '24h', type: 'approve' }], visibleToRoles: ['admin', 'qa_manager', 'plant_manager'], active: true },
    { id: 2, event: 'Override FEFO', refType: 'override_fefo', steps: [{ step: 1, role: 'supervisor', sla: '1h', type: 'approve' }], visibleToRoles: ['admin', 'supervisor'], active: true },
    { id: 3, event: 'Expired Ink Override', refType: 'ink_override', steps: [{ step: 1, role: 'plant_manager', sla: '30min', type: 'approve' }], visibleToRoles: ['admin', 'plant_manager', 'qa_manager'], active: true },
    { id: 4, event: 'Delete Formula', refType: 'delete_formula', steps: [{ step: 1, role: 'admin', sla: '48h', type: 'approve' }], visibleToRoles: ['admin'], active: true },
    { id: 5, event: 'Cylinder Scrap', refType: 'cylinder_scrap', steps: [{ step: 1, role: 'production_manager', sla: '24h', type: 'approve' }], visibleToRoles: ['admin', 'production_manager', 'plant_manager'], active: true },
    { id: 6, event: 'QC Hold Release', refType: 'qc_release', steps: [{ step: 1, role: 'qa_supervisor', sla: '2h', type: 'approve' }, { step: 2, role: 'qa_manager', sla: '8h', type: 'approve' }], visibleToRoles: ['admin', 'qa_manager', 'qa_supervisor'], active: true },
  ]);

  const [editApprovalRow, setEditApprovalRow] = useState<any | null>(null);
  const [approvalSteps, setApprovalSteps] = useState<any[]>([]);
  const [approvalDuplicateError, setApprovalDuplicateError] = useState('');

  useEffect(() => {
    if (editApprovalRow && editApprovalRow !== 'new') {
      setApprovalSteps(editApprovalRow.steps || []);
    } else {
      setApprovalSteps([{ step: 1, role: 'admin', sla: '24h', type: 'approve' }]);
    }
  }, [editApprovalRow]);

  const saveApprovalRow = (row: any) => {
    setMatrix(prev => {
      if (row.id) return prev.map(x => x.id === row.id ? row : x);
      return [...prev, { ...row, id: Math.max(0, ...prev.map(p => p.id)) + 1, active: true }];
    });
    setEditApprovalRow(null);
  };

  const deleteApprovalRow = (id: number) => {
    setMatrix(prev => prev.map(x => x.id === id ? { ...x, deletedAt: Date.now() } : x));
    setEditApprovalRow(null);
  };

  const toggleApprovalActive = (id: number) => {
    setMatrix(prev => prev.map(x => x.id === id ? { ...x, active: !x.active } : x));
  };

  // Approvals trash state
  const [showApprovalsTrash, setShowApprovalsTrash] = useState(false);
  const [approvalsDeleteTarget, setApprovalsDeleteTarget] = useState<any | null>(null);
  const [approvalsPermDeleteTarget, setApprovalsPermDeleteTarget] = useState<any | null>(null);
  const [approvalsEmptyTrashOpen, setApprovalsEmptyTrashOpen] = useState(false);

  const addApprovalStep = () => {
    setApprovalSteps(prev => [...prev, { step: prev.length + 1, role: 'admin', sla: '24h', type: 'approve' }]);
  };

  const removeApprovalStep = (idx: number) => {
    setApprovalSteps(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step: i + 1 })));
  };

  const updateApprovalStep = (idx: number, field: string, value: string) => {
    setApprovalSteps(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  return (
    <AppLayout>
      <div className="grid gap-6">
        <PageHeader
          titleKey="setup.title"
          subtitleKey="setup.manageItems"
          actions={
            <div className="flex gap-2">
              {['master', 'workflows'].map(tKey => (
                <button
                  key={tKey}
                  onClick={() => changeTab(tKey)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                    activeTab === tKey 
                      ? `${themeConfig.primaryBg} text-white` 
                      : `${themeConfig.badge} ${themeConfig.panelHover} ${themeConfig.textSecondary}`
                  }`}
                >
                  {t(tKey === 'master' ? 'nav.masterSetup' : 'setup.workflowEngine')}
                </button>
              ))}
            </div>
          }
        />

        {/* 1. Master Data Category List */}
        {activeTab === 'master' && (
          <div className="grid gap-6">
            {/* Category selection */}
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => {
                const Icon = cat.icon;
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition border ${
                      active 
                        ? `${themeConfig.primaryBg} text-white border-transparent shadow` 
                        : `${themeConfig.border} ${themeConfig.badge} ${themeConfig.panelHover} ${themeConfig.textSecondary}`
                    }`}
                  >
                    <Icon size={14} />
                    <span>{cat.label}</span>
                    {showMasterTrash && cat.id === activeCategory ? (
                      <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400">
                        {(masterData[cat.id] || []).filter((i: any) => i.deletedAt).length}
                      </span>
                    ) : (
                      <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] ${
                        active ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400'
                      }`}>
                        {(masterData[cat.id] || []).filter((i: any) => !i.deletedAt).length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Category Panel */}
            <div className={`rounded-xl p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
              <div className="flex items-center justify-between border-b pb-4 mb-4 border-white/10">
                <div>
                  <h3 className={`text-base font-bold ${themeConfig.textPrimary}`}>{currentCategory?.label}</h3>
                  <p className={`text-xs ${themeConfig.textMuted}`}>{t('setup.manageItems')}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowMasterTrash(v => !v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow ${
                      showMasterTrash
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : `${themeConfig.secondaryButton}`
                    }`}
                  >
                    <Trash2 size={14} />
                    {showMasterTrash ? t('common.viewActive') : t('common.trashBin')}
                  </button>
                  {showMasterTrash && currentCategoryItems.length > 0 && (
                    <button
                      onClick={() => setMasterEmptyTrashOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow text-red-400 border border-red-500/30 hover:bg-red-500/10"
                    >
                      <Trash2 size={14} />
                      {t('setup.emptyTrash')}
                    </button>
                  )}
                  {!showMasterTrash && (
                    <button
                      onClick={() => setShowAddMasterModal(true)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow ${themeConfig.primaryButton}`}
                    >
                      <Plus size={14} />
                      {t('btn.add')}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                {currentCategoryItems.map(item => (
                  <div 
                    key={item.id} 
                    className={`flex items-center gap-4 p-3 rounded-lg border transition ${themeConfig.badge} ${themeConfig.panelHover} ${
                      !item.active ? 'opacity-40' : ''
                    }`}
                  >
                    {/* Visual Color or Icon */}
                    {item.color ? (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5">
                        <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: item.color }}></div>
                      </div>
                    ) : (
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentCategory?.color || 'from-cyan-500 to-blue-500'} flex items-center justify-center text-white text-xs font-black`}>
                        {item.name?.charAt(0)}
                      </div>
                    )}

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-bold ${themeConfig.textPrimary}`}>{item.name}</span>
                        {item.nameTh && item.nameTh !== item.name && (
                          <span className={`text-xs ${themeConfig.textMuted}`}>({item.nameTh})</span>
                        )}
                      </div>
                      <p className={`text-xs ${themeConfig.textSecondary} mt-1`}>
                        {item.desc || item.severity || item.type || item.zone || item.boiling || item.contact || ''}
                        {item.capacity && ` · ${t('setup.capacity')}: ${item.used}/${item.capacity}`}
                      </p>
                    </div>

                    {/* Action Toggle sliders */}
                    {!showMasterTrash && (
                      <button 
                        onClick={() => toggleMasterActive(item.id)}
                        className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${
                          item.active ? 'bg-emerald-500' : 'bg-gray-600'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                          item.active ? 'left-5' : 'left-0.5'
                        }`}></div>
                      </button>
                    )}

                    {/* Edit item action */}
                    {!showMasterTrash && (
                      <button 
                        onClick={() => setEditMasterItem(item)}
                        className={`p-1.5 rounded-lg hover:bg-white/10 ${themeConfig.textSecondary}`}
                      >
                        <Edit size={14} />
                      </button>
                    )}

                    {/* Delete / Restore actions */}
                    {showMasterTrash ? (
                      <>
                        <button 
                          onClick={() => restoreMasterItem(item.id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-400 hover:text-emerald-300"
                          title={t('common.restore')}
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button 
                          onClick={() => setMasterPermDeleteTarget(item)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-rose-500 hover:text-rose-400"
                          title={t('common.permanentDelete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => setMasterDeleteTarget(item)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-rose-400 hover:text-rose-300"
                        title={t('common.delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {currentCategoryItems.length === 0 && (
                <div className={`text-center py-8 text-xs ${themeConfig.textMuted}`}>
                  {showMasterTrash ? t('setup.noTrashData') : 'No items'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Workflow Engine Tab (merged Rules + Approvals) */}
        {activeTab === 'workflows' && (
          <div className="grid gap-6">
            {/* Sub-tab navigation */}
            <div className="flex gap-2">
              {(['all', 'rules', 'approvals'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setWorkflowSubTab(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    workflowSubTab === st
                      ? `${themeConfig.primaryBg} text-white`
                      : `${themeConfig.badge} ${themeConfig.panelHover} ${themeConfig.textSecondary}`
                  }`}
                >
                  {st === 'all' ? t('setup.workflowEngine') : st === 'rules' ? t('setup.ruleEngine') : t('setup.approvalMatrix')}
                </button>
              ))}
            </div>

            {/* Combined Workflows view */}
            {workflowSubTab === 'all' && (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: t('setup.totalRules'), value: rules.length + matrix.length, color: 'from-cyan-500 to-blue-500', icon: Layers },
                    { label: t('setup.activeRules'), value: rules.filter(r => r.active).length + matrix.filter(m => m.active).length, color: 'from-emerald-500 to-teal-500', icon: Check },
                    { label: t('setup.notifications'), value: rules.reduce((s, r) => s + r.actions.filter((a: any) => a.type === 'notify').length, 0), color: 'from-amber-500 to-orange-500', icon: Bell },
                    { label: t('setup.approvals'), value: matrix.length, color: 'from-purple-500 to-pink-500', icon: Settings },
                  ].map((s, idx) => {
                    const Icon = s.icon;
                    return (
                      <article key={idx} className={`rounded-xl p-4 flex items-center gap-3 ${themeConfig.panel} ${themeConfig.shadow}`}>
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center shadow text-white`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <span suppressHydrationWarning className={`text-2xl font-black ${themeConfig.textPrimary}`}>{s.value}</span>
                          <p className={`text-xs ${themeConfig.textMuted}`}>{s.label}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Unified Workflow List (rules then approvals) */}
                <div className={`rounded-xl p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
                  <div className="flex items-center justify-between border-b pb-4 mb-4 border-white/10">
                    <div>
                      <h3 className={`text-base font-bold ${themeConfig.textPrimary}`}>{t('setup.workflowEngine')}</h3>
                      <p className={`text-xs ${themeConfig.textMuted}`}>{t('setup.manageItems')}</p>
                    </div>
                    <div className="flex gap-2">
                      {!showRulesTrash && (
                        <button
                          onClick={() => { setWorkflowSubTab('rules'); setRuleActionType('notify'); setShowAddRuleModal(true); }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow ${themeConfig.primaryButton}`}
                        >
                          <Plus size={14} />
                          {t('setup.addRule')}
                        </button>
                      )}
                      {!showApprovalsTrash && (
                        <button
                          onClick={() => setEditApprovalRow('new')}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow ${themeConfig.secondaryButton}`}
                        >
                          <Plus size={14} />
                          {t('btn.add')} {t('setup.approval')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rules section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`text-sm font-bold ${themeConfig.textSecondary} flex items-center gap-2`}>
                        <Layers size={14} />
                        {t('setup.ruleEngine')}
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowRulesTrash(v => !v)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                            showRulesTrash
                              ? 'bg-red-600 text-white'
                              : `${themeConfig.badge} ${themeConfig.panelHover} ${themeConfig.textSecondary}`
                          }`}
                        >
                          <Trash2 size={12} />
                          {showRulesTrash ? t('common.viewActive') : t('common.trashBin')}
                        </button>
                        {showRulesTrash && rules.filter(r => r.deletedAt).length > 0 && (
                          <button
                            onClick={() => setRulesEmptyTrashOpen(true)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10"
                          >
                            <Trash2 size={12} />
                            {t('setup.emptyTrash')}
                          </button>
                        )}
                      </div>
                    </div>
                    {rules.filter(r => showRulesTrash ? r.deletedAt : !r.deletedAt).map(rule => (
                      <div key={rule.id} className={`p-4 rounded-xl border border-white/5 transition bg-white/5 mb-2 ${!rule.active ? 'opacity-40' : ''}`}>
                        <div className="flex items-start gap-4">
                          {!showRulesTrash && (
                            <button onClick={() => toggleRuleActive(rule.id)}
                              className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 mt-1 ${rule.active ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${rule.active ? 'left-5' : 'left-0.5'}`}></div>
                            </button>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-bold ${themeConfig.textPrimary} mb-2.5`}>{rule.name}</h4>
                            <div className={`flex items-center gap-2 p-2.5 rounded-lg mb-2.5 bg-black/20 border ${themeConfig.border}`}>
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-gradient-to-r from-cyan-500 to-blue-500 text-white">IF</span>
                              <span className={`text-xs font-mono font-bold ${themeConfig.primaryText}`}>{rule.condition.field}</span>
                              <span className={`text-xs font-black ${themeConfig.textPrimary}`}>{rule.condition.op}</span>
                              {rule.condition.value && (<span className="text-xs font-mono font-bold text-amber-400">{rule.condition.value}</span>)}
                            </div>
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-white">THEN</span>
                              {rule.actions.map((action: any, i: number) => {
                                const ai = ruleActionIcons[action.type as keyof typeof ruleActionIcons] || ruleActionIcons.notify;
                                const ActionIcon = ai.icon;
                                return (<div key={i} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${ai.color}`}><ActionIcon size={12} /><span>{action.target || action.desc}</span></div>);
                              })}
                            </div>
                          </div>
                          {showRulesTrash ? (
                            <div className="flex gap-1">
                              <button onClick={() => { setRules(prev => prev.map(r => r.id === rule.id ? { ...r, deletedAt: undefined } : r)); }} className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-400 hover:text-emerald-300" title={t('common.restore')}><RotateCcw size={15} /></button>
                              <button onClick={() => setRulesPermDeleteTarget(rule)} className="p-1.5 rounded-lg hover:bg-white/10 text-rose-500 hover:text-rose-400" title={t('common.permanentDelete')}><Trash2 size={15} /></button>
                            </div>
                          ) : (
                            <button onClick={() => setRulesDeleteTarget(rule)} className="p-1.5 rounded-lg hover:bg-white/10 text-rose-400 hover:text-rose-300" title={t('common.delete')}><Trash2 size={15} /></button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Approvals section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`text-sm font-bold ${themeConfig.textSecondary} flex items-center gap-2`}>
                        <Settings size={14} />
                        {t('setup.approvalMatrix')}
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowApprovalsTrash(v => !v)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                            showApprovalsTrash
                              ? 'bg-red-600 text-white'
                              : `${themeConfig.badge} ${themeConfig.panelHover} ${themeConfig.textSecondary}`
                          }`}
                        >
                          <Trash2 size={12} />
                          {showApprovalsTrash ? t('common.viewActive') : t('common.trashBin')}
                        </button>
                        {showApprovalsTrash && matrix.filter(m => m.deletedAt).length > 0 && (
                          <button
                            onClick={() => setApprovalsEmptyTrashOpen(true)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10"
                          >
                            <Trash2 size={12} />
                            {t('setup.emptyTrash')}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className={`border-b ${themeConfig.border} ${themeConfig.tableHead}`}>
                          <th className="p-3 text-xs font-bold uppercase">{t('setup.event')}</th>
                          <th className="p-3 text-xs font-bold uppercase">ประเภท</th>
                          <th className="p-3 text-xs font-bold uppercase">Steps</th>
                          <th className="p-3 text-xs font-bold uppercase">ผู้เห็น</th>
                          <th className="p-3 text-xs font-bold uppercase text-center">{t('col.status')}</th>
                          <th className="p-3 text-xs font-bold uppercase text-right">{t('col.action')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matrix.filter(m => showApprovalsTrash ? m.deletedAt : !m.deletedAt).map(m => (
                          <tr key={m.id} className={`border-b ${themeConfig.border} ${themeConfig.tableRow} transition ${!m.active ? 'opacity-45' : ''}`}>
                            <td className={`p-3 font-semibold ${themeConfig.textPrimary}`}>{m.event}</td>
                            <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-cyan-300">{m.refType}</span></td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {(m.steps || []).map((s: any, i: number) => (
                                  <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${s.type === 'notify' ? 'border-amber-500/30 text-amber-300' : 'border-emerald-500/30 text-emerald-300'} bg-white/5`}>
                                    {i > 0 && <span className="text-gray-500 mr-0.5">→</span>}
                                    {s.role}
                                    {s.sla && <span className="text-gray-500 ml-0.5">({s.sla})</span>}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {(m.visibleToRoles || []).map((r: string) => (
                                  <span key={r} className="px-1.5 py-0.5 rounded text-[9px] font-mono border border-blue-500/20 text-blue-300 bg-blue-500/5">{r}</span>
                                ))}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              {!showApprovalsTrash && (
                                <button onClick={() => toggleApprovalActive(m.id)} className={`w-10 h-5 rounded-full transition-all relative inline-block ${m.active ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${m.active ? 'left-5' : 'left-0.5'}`}></div>
                                </button>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              {showApprovalsTrash ? (
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => { setMatrix(prev => prev.map(x => x.id === m.id ? { ...x, deletedAt: undefined } : x)); }} className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-400 hover:text-emerald-300" title={t('common.restore')}><RotateCcw size={14} /></button>
                                  <button onClick={() => setApprovalsPermDeleteTarget(m)} className="p-1.5 rounded-lg hover:bg-white/10 text-rose-500 hover:text-rose-400" title={t('common.permanentDelete')}><Trash2 size={14} /></button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => setEditApprovalRow(m)} className={`p-1.5 rounded-lg hover:bg-white/10 ${themeConfig.textSecondary}`}><Edit size={14} /></button>
                                  <button onClick={() => setApprovalsDeleteTarget(m)} className="p-1.5 rounded-lg hover:bg-white/10 text-rose-400 hover:text-rose-300" title={t('common.delete')}><Trash2 size={14} /></button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Rules-only sub-tab */}
            {workflowSubTab === 'rules' && (
              <div className="grid gap-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: t('setup.totalRules'), value: rules.length, color: 'from-cyan-500 to-blue-500', icon: Layers },
                    { label: t('setup.activeRules'), value: rules.filter(r => r.active).length, color: 'from-emerald-500 to-teal-500', icon: Check },
                    { label: t('setup.notifications'), value: rules.reduce((s, r) => s + r.actions.filter((a: any) => a.type === 'notify').length, 0), color: 'from-amber-500 to-orange-500', icon: Bell },
                    { label: t('setup.automations'), value: rules.reduce((s, r) => s + r.actions.filter((a: any) => a.type !== 'notify').length, 0), color: 'from-purple-500 to-pink-500', icon: Settings },
                  ].map((s, idx) => {
                    const Icon = s.icon;
                    return (
                      <article key={idx} className={`rounded-xl p-4 flex items-center gap-3 ${themeConfig.panel} ${themeConfig.shadow}`}>
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center shadow text-white`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <span suppressHydrationWarning className={`text-2xl font-black ${themeConfig.textPrimary}`}>{s.value}</span>
                          <p className={`text-xs ${themeConfig.textMuted}`}>{s.label}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className={`rounded-xl p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
                  <div className="flex items-center justify-between border-b pb-4 mb-4 border-white/10">
                    <div>
                      <h3 className={`text-base font-bold ${themeConfig.textPrimary}`}>{t('setup.ruleEngine')}</h3>
                      <p className={`text-xs ${themeConfig.textMuted}`}>{t('setup.manageItems')}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowRulesTrash(v => !v)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow ${
                          showRulesTrash
                            ? 'bg-red-600 hover:bg-red-500 text-white'
                            : `${themeConfig.secondaryButton}`
                        }`}
                      >
                        <Trash2 size={14} />
                        {showRulesTrash ? t('common.viewActive') : t('common.trashBin')}
                      </button>
                      {showRulesTrash && rules.filter(r => r.deletedAt).length > 0 && (
                        <button
                          onClick={() => setRulesEmptyTrashOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow text-red-400 border border-red-500/30 hover:bg-red-500/10"
                        >
                          <Trash2 size={14} />
                          {t('setup.emptyTrash')}
                        </button>
                      )}
                      {!showRulesTrash && (
                        <button onClick={() => {
                          setRuleName('');
                          setRuleField(fieldOptions[0] || 'ink.daysToExpiry');
                          setRuleOp(opOptions[0] || '<');
                          setRuleVal('');
                          setRuleActionType('notify');
                          setRuleActionDesc('');
                          setShowAddRuleModal(true);
                        }} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow ${themeConfig.primaryButton}`}>
                          <Plus size={14} />{t('setup.addRule')}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {rules.filter(r => showRulesTrash ? r.deletedAt : !r.deletedAt).map(rule => (
                      <div key={rule.id} className={`p-4 rounded-xl border border-white/5 transition bg-white/5 ${!rule.active ? 'opacity-40' : ''}`}>
                        <div className="flex items-start gap-4">
                          {!showRulesTrash && (
                            <button onClick={() => toggleRuleActive(rule.id)} className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 mt-1 ${rule.active ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${rule.active ? 'left-5' : 'left-0.5'}`}></div>
                            </button>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-bold ${themeConfig.textPrimary} mb-2.5`}>{rule.name}</h4>
                            <div className={`flex items-center gap-2 p-2.5 rounded-lg mb-2.5 bg-black/20 border ${themeConfig.border}`}>
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-gradient-to-r from-cyan-500 to-blue-500 text-white">IF</span>
                              <span className={`text-xs font-mono font-bold ${themeConfig.primaryText}`}>{rule.condition.field}</span>
                              <span className={`text-xs font-black ${themeConfig.textPrimary}`}>{rule.condition.op}</span>
                              {rule.condition.value && (<span className="text-xs font-mono font-bold text-amber-400">{rule.condition.value}</span>)}
                            </div>
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-white">THEN</span>
                              {rule.actions.map((action: any, i: number) => {
                                const ai = ruleActionIcons[action.type as keyof typeof ruleActionIcons] || ruleActionIcons.notify;
                                const ActionIcon = ai.icon;
                                return (<div key={i} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${ai.color}`}><ActionIcon size={12} /><span>{action.target || action.desc}</span></div>);
                              })}
                            </div>
                          </div>
                          {showRulesTrash ? (
                            <div className="flex gap-1">
                              <button onClick={() => { setRules(prev => prev.map(r => r.id === rule.id ? { ...r, deletedAt: undefined } : r)); }} className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-400 hover:text-emerald-300" title={t('common.restore')}><RotateCcw size={15} /></button>
                              <button onClick={() => setRulesPermDeleteTarget(rule)} className="p-1.5 rounded-lg hover:bg-white/10 text-rose-500 hover:text-rose-400" title={t('common.permanentDelete')}><Trash2 size={15} /></button>
                            </div>
                          ) : (
                            <button onClick={() => setRulesDeleteTarget(rule)} className="p-1.5 rounded-lg hover:bg-white/10 text-rose-400 hover:text-rose-300" title={t('common.delete')}><Trash2 size={15} /></button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Approvals-only sub-tab */}
            {workflowSubTab === 'approvals' && (
              <div className={`rounded-xl p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
                <div className="flex items-center justify-between border-b pb-4 mb-4 border-white/10">
                  <div>
                    <h3 className={`text-base font-bold ${themeConfig.textPrimary}`}>{t('setup.approvalMatrix')}</h3>
                    <p className={`text-xs ${themeConfig.textMuted}`}>{t('setup.manageItems')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowApprovalsTrash(v => !v)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow ${
                        showApprovalsTrash
                          ? 'bg-red-600 hover:bg-red-500 text-white'
                          : `${themeConfig.secondaryButton}`
                      }`}
                    >
                      <Trash2 size={14} />
                      {showApprovalsTrash ? t('common.viewActive') : t('common.trashBin')}
                    </button>
                    {showApprovalsTrash && matrix.filter(m => m.deletedAt).length > 0 && (
                      <button
                        onClick={() => setApprovalsEmptyTrashOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow text-red-400 border border-red-500/30 hover:bg-red-500/10"
                      >
                        <Trash2 size={14} />
                        {t('setup.emptyTrash')}
                      </button>
                    )}
                    {!showApprovalsTrash && (
                      <button onClick={() => setEditApprovalRow('new')} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow ${themeConfig.primaryButton}`}>
                        <Plus size={14} />{t('btn.add')}
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className={`border-b ${themeConfig.border} ${themeConfig.tableHead}`}>
                        <th className="p-3 text-xs font-bold uppercase">{t('setup.event')}</th>
                        <th className="p-3 text-xs font-bold uppercase">ประเภท</th>
                        <th className="p-3 text-xs font-bold uppercase">Steps</th>
                        <th className="p-3 text-xs font-bold uppercase">ผู้เห็น</th>
                        <th className="p-3 text-xs font-bold uppercase text-center">{t('col.status')}</th>
                        <th className="p-3 text-xs font-bold uppercase text-right">{t('col.action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrix.filter(m => showApprovalsTrash ? m.deletedAt : !m.deletedAt).map(m => (
                        <tr key={m.id} className={`border-b ${themeConfig.border} ${themeConfig.tableRow} transition ${!m.active ? 'opacity-45' : ''}`}>
                          <td className={`p-3 font-semibold ${themeConfig.textPrimary}`}>{m.event}</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-cyan-300">{m.refType}</span></td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {(m.steps || []).map((s: any, i: number) => (
                                <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${s.type === 'notify' ? 'border-amber-500/30 text-amber-300' : 'border-emerald-500/30 text-emerald-300'} bg-white/5`}>
                                  {i > 0 && <span className="text-gray-500 mr-0.5">→</span>}
                                  {s.role} {s.sla ? `(${s.sla})` : ''}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {(m.visibleToRoles || []).map((r: string) => (
                                <span key={r} className="px-1.5 py-0.5 rounded text-[9px] font-mono border border-blue-500/20 text-blue-300 bg-blue-500/5">{r}</span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                              {!showApprovalsTrash && (
                                <button onClick={() => toggleApprovalActive(m.id)} className={`w-10 h-5 rounded-full transition-all relative inline-block ${m.active ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${m.active ? 'left-5' : 'left-0.5'}`}></div>
                                </button>
                              )}
                            </td>
                          <td className="p-3 text-right">
                            {showApprovalsTrash ? (
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => { setMatrix(prev => prev.map(x => x.id === m.id ? { ...x, deletedAt: undefined } : x)); }} className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-400 hover:text-emerald-300" title={t('common.restore')}><RotateCcw size={14} /></button>
                                <button onClick={() => setApprovalsPermDeleteTarget(m)} className="p-1.5 rounded-lg hover:bg-white/10 text-rose-500 hover:text-rose-400" title={t('common.permanentDelete')}><Trash2 size={14} /></button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => setEditApprovalRow(m)} className={`p-1.5 rounded-lg hover:bg-white/10 ${themeConfig.textSecondary}`}><Edit size={14} /></button>
                                <button onClick={() => setApprovalsDeleteTarget(m)} className="p-1.5 rounded-lg hover:bg-white/10 text-rose-400 hover:text-rose-300" title={t('common.delete')}><Trash2 size={14} /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CRUD Add/Edit Master Data item modal */}
      {showAddMasterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 ${themeConfig.dialogOverlay}`} onClick={() => setShowAddMasterModal(false)}></div>
          <div className={`relative rounded-2xl max-w-md w-full p-6 shadow-2xl z-10 ${themeConfig.dialog}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-lg font-bold ${themeConfig.textPrimary}`}>{t('btn.add')} — {currentCategory?.label}</h3>
              <button onClick={() => setShowAddMasterModal(false)} className={`p-1 rounded hover:bg-white/10 ${themeConfig.textMuted}`}>
                <X size={18} />
              </button>
            </div>
            
             <div className="space-y-4">
              {masterDuplicateError && (
                <div className="p-3 rounded-lg text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30">
                  {masterDuplicateError}
                </div>
              )}
              <div className="grid gap-1.5">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>Name (EN)</label>
                <input 
                  type="text" 
                  id="master-en-name"
                  placeholder="e.g. Chrome Recoat" 
                  className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${themeConfig.input}`}
                />
              </div>
              <div className="grid gap-1.5">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>Name (TH)</label>
                <input 
                  type="text" 
                  id="master-th-name"
                  placeholder="เช่น ชุบ Chrome ใหม่" 
                  className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${themeConfig.input}`}
                />
              </div>
              <div className="grid gap-1.5">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('setup.description')}</label>
                <input 
                  type="text" 
                  id="master-desc"
                  placeholder="..." 
                  className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${themeConfig.input}`}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6 justify-end">
              <button 
                onClick={() => { setShowAddMasterModal(false); setMasterDuplicateError(''); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold ${themeConfig.secondaryButton}`}
              >
                {t('btn.cancel')}
              </button>
              <button 
                onClick={async () => {
                  const enInput = document.getElementById('master-en-name') as HTMLInputElement;
                  const thInput = document.getElementById('master-th-name') as HTMLInputElement;
                  const descInput = document.getElementById('master-desc') as HTMLInputElement;
                  setMasterDuplicateError('');
                  const name = enInput?.value?.trim();
                  if (!name) return;
                  const existing = (masterData[activeCategory] || []).find(
                    (i: any) => !i.deletedAt && i.name?.toLowerCase() === name.toLowerCase()
                  );
                  if (existing) {
                    setMasterDuplicateError(`"${name}" ${t('common.alreadyExists') || 'already exists'} in ${currentCategory?.label}`);
                    return;
                  }
                  try {
                    await createMasterData({ category: activeCategory, name, nameTh: thInput?.value?.trim() || undefined, extra: { desc: descInput?.value?.trim() || '' } });
                    queryClient.invalidateQueries({ queryKey: ['masterData'] });
                    setShowAddMasterModal(false);
                  } catch (err: any) {
                    setMasterDuplicateError(err?.response?.data?.message || err?.message || t('common.alreadyExists'));
                  }
                }}
                className={`px-5 py-2 rounded-lg text-xs font-bold text-white shadow ${themeConfig.primaryButton}`}
              >
                {t('btn.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Rule Modal */}
      {showAddRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className={`absolute inset-0 ${themeConfig.dialogOverlay}`} onClick={() => setShowAddRuleModal(false)}></div>
          <div className={`relative rounded-2xl max-w-lg w-full p-6 shadow-2xl z-10 overflow-visible ${themeConfig.dialog}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-lg font-bold ${themeConfig.textPrimary}`}>{t('setup.addRule')}</h3>
              <button onClick={() => setShowAddRuleModal(false)} className={`p-1 rounded hover:bg-white/10 ${themeConfig.textMuted}`}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {ruleDuplicateError && (
                <div className="p-3 rounded-lg text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30">
                  {ruleDuplicateError}
                </div>
              )}
              {/* Name */}
              <div className="grid gap-1.5">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('setup.ruleName')}</label>
                <input 
                  type="text" 
                  id="rule-name" 
                  value={ruleName}
                  onChange={e => setRuleName(e.target.value)}
                  placeholder="e.g. Ink Low Stock Alert" 
                  className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${themeConfig.input}`}
                />
              </div>

              {/* Condition */}
              <div className={`p-4 rounded-xl border bg-black/10 ${themeConfig.border}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-gradient-to-r from-cyan-500 to-blue-500 text-white">IF</span>
                  <span className={`text-xs font-bold ${themeConfig.textSecondary}`}>{t('setup.condition')}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <SearchableSelect
                    value={ruleField}
                    onChange={setRuleField}
                    placeholder="Field"
                    options={(dynamicFieldOptions.length > 0 ? [...new Set([...fieldOptions, ...dynamicFieldOptions])] : fieldOptions).map(f => ({ value: f, label: f }))}
                  />
                  <SearchableSelect
                    value={ruleOp}
                    onChange={setRuleOp}
                    placeholder="Operator"
                    options={opOptions.map(o => ({ value: o, label: o }))}
                  />
                  <input 
                    type="text" 
                    id="rule-val" 
                    value={ruleVal}
                    onChange={e => setRuleVal(e.target.value)}
                    placeholder="Value" 
                    className={`rounded-lg px-3 py-2 text-sm outline-none h-10 ${themeConfig.input}`}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className={`p-4 rounded-xl border bg-black/10 ${themeConfig.border}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-white">THEN</span>
                    <span className={`text-xs font-bold ${themeConfig.textSecondary}`}>{t('setup.actions')}</span>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <div className="w-1/3">
                    <SearchableSelect
                      value={ruleActionType}
                      onChange={setRuleActionType}
                      placeholder="Action"
                      options={['notify', 'highlight', 'block', 'status', 'task'].map(actType => ({ value: actType, label: actType }))}
                    />
                  </div>
                  {ruleActionType === 'notify' ? (
                    <input 
                      type="text" 
                      id="rule-action-desc" 
                      value={ruleActionDesc}
                      onChange={e => setRuleActionDesc(e.target.value)}
                      placeholder="Target role / channel (e.g. supervisor, email, line)" 
                      className={`flex-1 rounded-lg px-3 py-2 text-sm outline-none h-10 ${themeConfig.input}`}
                    />
                  ) : (
                    <input 
                      type="text" 
                      id="rule-action-desc" 
                      value={ruleActionDesc}
                      onChange={e => setRuleActionDesc(e.target.value)}
                      placeholder="Description" 
                      className={`flex-1 rounded-lg px-3 py-2 text-sm outline-none h-10 ${themeConfig.input}`}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6 justify-end">
              <button 
                onClick={() => { setShowAddRuleModal(false); setRuleDuplicateError(''); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold ${themeConfig.secondaryButton}`}
              >
                {t('btn.cancel')}
              </button>
              <button 
                onClick={() => {
                  setRuleDuplicateError('');
                  const name = ruleName.trim();
                  if (!name) return;
                  if (rules.some(r => !r.deletedAt && r.name.toLowerCase() === name.toLowerCase())) {
                    setRuleDuplicateError(`"${name}" ${t('common.alreadyExists') || 'already exists'}`);
                    return;
                  }
                  setRules(prev => [...prev, {
                    id: Date.now(),
                    name: name,
                    active: true,
                    condition: {
                      field: ruleField,
                      op: ruleOp,
                      value: ruleVal
                    },
                    actions: [{
                      type: ruleActionType,
                      [ruleActionType === 'notify' ? 'target' : 'desc']: ruleActionDesc
                    }]
                  }]);
                  setShowAddRuleModal(false);
                }}
                className={`px-5 py-2 rounded-lg text-xs font-bold text-white shadow ${themeConfig.primaryButton}`}
              >
                {t('btn.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Approval Matrix Modal */}
      {editApprovalRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className={`absolute inset-0 ${themeConfig.dialogOverlay}`} onClick={() => setEditApprovalRow(null)}></div>
          <div className={`relative rounded-2xl max-w-2xl w-full p-6 shadow-2xl z-10 overflow-visible ${themeConfig.dialog}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-lg font-bold ${themeConfig.textPrimary}`}>
                {editApprovalRow === 'new' ? t('btn.add') : t('btn.edit')} — {t('setup.approvalMatrix')}
              </h3>
              <button onClick={() => setEditApprovalRow(null)} className={`p-1 rounded hover:bg-white/10 ${themeConfig.textMuted}`}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {approvalDuplicateError && (
                <div className="p-3 rounded-lg text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30">
                  {approvalDuplicateError}
                </div>
              )}
              <div className="grid gap-1.5">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('setup.event')}</label>
                <input 
                  type="text" 
                  id="approval-event"
                  defaultValue={editApprovalRow === 'new' ? '' : editApprovalRow.event}
                  placeholder="e.g. Formula Revision Change" 
                  className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${themeConfig.input}`}
                />
              </div>

              <div className="grid gap-1.5">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>ประเภทเอกสาร (refType)</label>
                <input 
                  type="text"
                  id="approval-reftype"
                  defaultValue={editApprovalRow === 'new' ? '' : editApprovalRow.refType}
                  placeholder="e.g. formula_change, purchase_order (admin กำหนดเอง)"
                  className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${themeConfig.input}`}
                />
              </div>

              {/* ใครเห็นเอกสารนี้ได้บ้าง */}
              <div className={`p-4 rounded-xl border bg-black/10 ${themeConfig.border}`}>
                <label className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${themeConfig.textMuted}`}>Role ที่เห็นเอกสารนี้ (visibleToRoles)</label>
                <div className="flex flex-wrap gap-2">
                  {roles.map(r => {
                    const checked = editApprovalRow === 'new'
                      ? r === 'admin'
                      : (editApprovalRow.visibleToRoles || ['admin']).includes(r);
                    return (
                      <label key={r} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10">
                        <input type="checkbox" defaultChecked={checked} data-role={r}
                          className="rounded"
                        />
                        {r}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Multi-step approval chain */}
              <div className={`p-4 rounded-xl border bg-black/10 ${themeConfig.border}`}>
                <div className="flex items-center justify-between mb-3">
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>ขั้นตอนอนุมัติ (Approval Chain)</label>
                  <button onClick={addApprovalStep} className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-500">
                    + เพิ่มขั้น
                  </button>
                </div>
                <div className="space-y-2">
                  {approvalSteps.map((step: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 w-16">Step {idx + 1}</span>
                       <div className="flex-1 text-slate-100">
                        <SearchableSelect
                          value={step.role}
                          onChange={(v) => updateApprovalStep(idx, 'role', v)}
                          options={roles.map(r => ({ value: r, label: r }))}
                          placeholder={t('common.select')}
                        />
                      </div>
                      <div className="w-24 text-slate-100">
                        <SearchableSelect
                          value={step.sla}
                          onChange={(v) => updateApprovalStep(idx, 'sla', v)}
                          options={['30min', '1h', '2h', '4h', '8h', '24h', '48h'].map(s => ({ value: s, label: s }))}
                          placeholder="SLA"
                        />
                      </div>
                      <div className="w-28 text-slate-100">
                        <SearchableSelect
                          value={step.type}
                          onChange={(v) => updateApprovalStep(idx, 'type', v)}
                          options={[
                            { value: 'approve', label: 'อนุมัติ' },
                            { value: 'notify', label: 'แจ้งเตือน' },
                          ]}
                          placeholder="Type"
                        />
                      </div>
                      {approvalSteps.length > 1 && (
                        <button onClick={() => removeApprovalStep(idx)} className="p-1 text-rose-400 hover:text-rose-300"><X size={14} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6 justify-end">
              {editApprovalRow !== 'new' && (
                <button 
                  onClick={() => { setMatrix(prev => prev.map(x => x.id === editApprovalRow.id ? { ...x, deletedAt: Date.now() } : x)); setEditApprovalRow(null); }}
                  className="px-3 py-2 rounded-lg text-xs font-bold text-white shadow bg-rose-600 hover:bg-rose-500 transition mr-auto"
                >
                  <Trash2 size={15} /> {t('common.delete')}
                </button>
              )}
              <button 
                onClick={() => { setEditApprovalRow(null); setApprovalDuplicateError(''); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold ${themeConfig.secondaryButton}`}
              >
                {t('btn.cancel')}
              </button>
              <button 
                onClick={() => {
                  setApprovalDuplicateError('');
                  const evInput = document.getElementById('approval-event') as HTMLInputElement;
                  const refTypeInput = document.getElementById('approval-reftype') as HTMLInputElement;
                  const roleChecks = document.querySelectorAll<HTMLInputElement>('[data-role]');
                  const visibleToRoles = Array.from(roleChecks).filter(c => c.checked).map(c => c.dataset.role || '');
                  const eventName = evInput?.value?.trim();
                  if (!eventName) return;
                  const isNew = editApprovalRow === 'new';
                  const duplicate = matrix.find(m =>
                    !m.deletedAt &&
                    m.event.toLowerCase() === eventName.toLowerCase() &&
                    (isNew || m.id !== editApprovalRow.id)
                  );
                  if (duplicate) {
                    setApprovalDuplicateError(`"${eventName}" ${t('common.alreadyExists') || 'already exists'}`);
                    return;
                  }
                  saveApprovalRow({
                    id: isNew ? null : editApprovalRow.id,
                    event: eventName,
                    refType: refTypeInput?.value?.trim() || '',
                    steps: approvalSteps,
                    visibleToRoles,
                    active: isNew ? true : editApprovalRow.active
                  });
                }}
                className={`px-5 py-2 rounded-lg text-xs font-bold text-white shadow ${themeConfig.primaryButton}`}
              >
                {t('btn.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Master Data Confirm Dialogs */}
      <ConfirmDialog
        open={!!masterDeleteTarget}
        titleKey="common.delete"
        descriptionKey="setup.deleteConfirm"
        onConfirm={() => { if (masterDeleteTarget) deleteMasterItem(masterDeleteTarget.id); }}
        onClose={() => setMasterDeleteTarget(null)}
      />
      <ConfirmDialog
        open={!!masterPermDeleteTarget}
        titleKey="common.permanentDelete"
        descriptionKey="setup.permanentDeleteConfirm"
        onConfirm={() => { if (masterPermDeleteTarget) permanentDeleteMasterItem(masterPermDeleteTarget.id); }}
        onClose={() => setMasterPermDeleteTarget(null)}
      />
      <ConfirmDialog
        open={masterEmptyTrashOpen}
        titleKey="setup.emptyTrash"
        descriptionKey="setup.emptyTrashConfirm"
        onConfirm={handleEmptyMasterTrash}
        onClose={() => setMasterEmptyTrashOpen(false)}
      />

      {/* Rules Confirm Dialogs */}
      <ConfirmDialog
        open={!!rulesDeleteTarget}
        titleKey="common.delete"
        descriptionKey="setup.deleteConfirm"
        onConfirm={handleRulesSoftDelete}
        onClose={() => setRulesDeleteTarget(null)}
      />
      <ConfirmDialog
        open={!!rulesPermDeleteTarget}
        titleKey="common.permanentDelete"
        descriptionKey="setup.permanentDeleteConfirm"
        onConfirm={handleRulesPermanentDelete}
        onClose={() => setRulesPermDeleteTarget(null)}
      />
      <ConfirmDialog
        open={rulesEmptyTrashOpen}
        titleKey="setup.emptyTrash"
        descriptionKey="setup.emptyTrashConfirm"
        onConfirm={handleRulesEmptyTrash}
        onClose={() => setRulesEmptyTrashOpen(false)}
      />

      {/* Approvals Confirm Dialogs */}
      <ConfirmDialog
        open={!!approvalsDeleteTarget}
        titleKey="common.delete"
        descriptionKey="setup.deleteConfirm"
        onConfirm={handleApprovalsSoftDelete}
        onClose={() => setApprovalsDeleteTarget(null)}
      />
      <ConfirmDialog
        open={!!approvalsPermDeleteTarget}
        titleKey="common.permanentDelete"
        descriptionKey="setup.permanentDeleteConfirm"
        onConfirm={handleApprovalsPermanentDelete}
        onClose={() => setApprovalsPermDeleteTarget(null)}
      />
      <ConfirmDialog
        open={approvalsEmptyTrashOpen}
        titleKey="setup.emptyTrash"
        descriptionKey="setup.emptyTrashConfirm"
        onConfirm={handleApprovalsEmptyTrash}
        onClose={() => setApprovalsEmptyTrashOpen(false)}
      />
    </AppLayout>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-sm text-gray-400">Loading...</div>}>
      <SetupPageContent />
    </Suspense>
  );
}
