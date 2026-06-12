'use client';

import { useState, useEffect, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { useTheme } from '@/lib/theme/theme-provider';
import { ROLES } from '@/lib/constants/roles';
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
  Settings 
} from 'lucide-react';

function SetupPageContent() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();

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

  const [masterData, setMasterData] = useState<Record<string, any[]>>({
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
  });

  const toggleMasterActive = (id: number) => {
    setMasterData(prev => ({
      ...prev,
      [activeCategory]: prev[activeCategory].map(item =>
        item.id === id ? { ...item, active: !item.active } : item
      ),
    }));
  };

  const deleteMasterItem = (id: number) => {
    setMasterData(prev => ({
      ...prev,
      [activeCategory]: prev[activeCategory].filter(item => item.id !== id),
    }));
  };

  const currentCategory = categories.find(c => c.id === activeCategory);
  const currentCategoryItems = masterData[activeCategory] || [];

  // 2. RULE ENGINE TAB STATE
  const [rules, setRules] = useState<any[]>([
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

  const toggleRuleActive = (id: number) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const deleteRule = (id: number) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

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
  const [matrix, setMatrix] = useState<any[]>([
    { id: 1, event: 'Formula Revision Change', refType: 'formula_change', steps: [{ step: 1, role: 'qa_manager', sla: '24h', type: 'approve' }], visibleToRoles: ['admin', 'qa_manager', 'plant_manager'], active: true },
    { id: 2, event: 'Override FEFO', refType: 'override_fefo', steps: [{ step: 1, role: 'supervisor', sla: '1h', type: 'approve' }], visibleToRoles: ['admin', 'supervisor'], active: true },
    { id: 3, event: 'Expired Ink Override', refType: 'ink_override', steps: [{ step: 1, role: 'plant_manager', sla: '30min', type: 'approve' }], visibleToRoles: ['admin', 'plant_manager', 'qa_manager'], active: true },
    { id: 4, event: 'Delete Formula', refType: 'delete_formula', steps: [{ step: 1, role: 'admin', sla: '48h', type: 'approve' }], visibleToRoles: ['admin'], active: true },
    { id: 5, event: 'Cylinder Scrap', refType: 'cylinder_scrap', steps: [{ step: 1, role: 'production_manager', sla: '24h', type: 'approve' }], visibleToRoles: ['admin', 'production_manager', 'plant_manager'], active: true },
    { id: 6, event: 'QC Hold Release', refType: 'qc_release', steps: [{ step: 1, role: 'qa_supervisor', sla: '2h', type: 'approve' }, { step: 2, role: 'qa_manager', sla: '8h', type: 'approve' }], visibleToRoles: ['admin', 'qa_manager', 'qa_supervisor'], active: true },
  ]);

  const [editApprovalRow, setEditApprovalRow] = useState<any | null>(null);
  const [approvalSteps, setApprovalSteps] = useState<any[]>([]);

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
    setMatrix(prev => prev.filter(x => x.id !== id));
    setEditApprovalRow(null);
  };

  const toggleApprovalActive = (id: number) => {
    setMatrix(prev => prev.map(x => x.id === id ? { ...x, active: !x.active } : x));
  };

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
                    <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] ${
                      active ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400'
                    }`}>
                      {(masterData[cat.id] || []).length}
                    </span>
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
                <button
                  onClick={() => setShowAddMasterModal(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow ${themeConfig.primaryButton}`}
                >
                  <Plus size={14} />
                  {t('btn.add')}
                </button>
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

                    {/* Edit item action */}
                    <button 
                      onClick={() => setEditMasterItem(item)}
                      className={`p-1.5 rounded-lg hover:bg-white/10 ${themeConfig.textSecondary}`}
                    >
                      <Edit size={14} />
                    </button>

                    {/* Delete item action */}
                    <button 
                      onClick={() => deleteMasterItem(item.id)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-rose-400 hover:text-rose-300"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
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
                          <span className={`text-2xl font-black ${themeConfig.textPrimary}`}>{s.value}</span>
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
                      <button
                        onClick={() => { setWorkflowSubTab('rules'); setRuleActionType('notify'); setShowAddRuleModal(true); }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow ${themeConfig.primaryButton}`}
                      >
                        <Plus size={14} />
                        {t('setup.addRule')}
                      </button>
                      <button
                        onClick={() => setEditApprovalRow('new')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow ${themeConfig.secondaryButton}`}
                      >
                        <Plus size={14} />
                        {t('btn.add')} {t('setup.approval')}
                      </button>
                    </div>
                  </div>

                  {/* Rules section */}
                  <div className="mb-6">
                    <h4 className={`text-sm font-bold ${themeConfig.textSecondary} mb-3 flex items-center gap-2`}>
                      <Layers size={14} />
                      {t('setup.ruleEngine')}
                    </h4>
                    {rules.map(rule => (
                      <div key={rule.id} className={`p-4 rounded-xl border border-white/5 transition bg-white/5 mb-2 ${!rule.active ? 'opacity-40' : ''}`}>
                        <div className="flex items-start gap-4">
                          <button onClick={() => toggleRuleActive(rule.id)}
                            className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 mt-1 ${rule.active ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${rule.active ? 'left-5' : 'left-0.5'}`}></div>
                          </button>
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
                          <button onClick={() => deleteRule(rule.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-rose-400 hover:text-rose-300"><X size={15} /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Approvals section */}
                  <div>
                    <h4 className={`text-sm font-bold ${themeConfig.textSecondary} mb-3 flex items-center gap-2`}>
                      <Settings size={14} />
                      {t('setup.approvalMatrix')}
                    </h4>
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
                        {matrix.map(m => (
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
                              <button onClick={() => toggleApprovalActive(m.id)} className={`w-10 h-5 rounded-full transition-all relative inline-block ${m.active ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${m.active ? 'left-5' : 'left-0.5'}`}></div>
                              </button>
                            </td>
                            <td className="p-3 text-right">
                              <button onClick={() => setEditApprovalRow(m)} className={`p-1.5 rounded-lg hover:bg-white/10 ${themeConfig.textSecondary}`}><Edit size={14} /></button>
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
                          <span className={`text-2xl font-black ${themeConfig.textPrimary}`}>{s.value}</span>
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
                    <button onClick={() => { setRuleActionType('notify'); setShowAddRuleModal(true); }} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow ${themeConfig.primaryButton}`}>
                      <Plus size={14} />{t('setup.addRule')}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {rules.map(rule => (
                      <div key={rule.id} className={`p-4 rounded-xl border border-white/5 transition bg-white/5 ${!rule.active ? 'opacity-40' : ''}`}>
                        <div className="flex items-start gap-4">
                          <button onClick={() => toggleRuleActive(rule.id)} className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 mt-1 ${rule.active ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${rule.active ? 'left-5' : 'left-0.5'}`}></div>
                          </button>
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
                          <button onClick={() => deleteRule(rule.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-rose-400 hover:text-rose-300"><X size={15} /></button>
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
                  <button onClick={() => setEditApprovalRow('new')} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow ${themeConfig.primaryButton}`}>
                    <Plus size={14} />{t('btn.add')}
                  </button>
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
                      {matrix.map(m => (
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
                            <button onClick={() => toggleApprovalActive(m.id)} className={`w-10 h-5 rounded-full transition-all relative inline-block ${m.active ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${m.active ? 'left-5' : 'left-0.5'}`}></div>
                            </button>
                          </td>
                          <td className="p-3 text-right">
                            <button onClick={() => setEditApprovalRow(m)} className={`p-1.5 rounded-lg hover:bg-white/10 ${themeConfig.textSecondary}`}><Edit size={14} /></button>
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
                onClick={() => setShowAddMasterModal(false)}
                className={`px-4 py-2 rounded-lg text-xs font-bold ${themeConfig.secondaryButton}`}
              >
                {t('btn.cancel')}
              </button>
              <button 
                onClick={() => {
                  const enInput = document.getElementById('master-en-name') as HTMLInputElement;
                  const thInput = document.getElementById('master-th-name') as HTMLInputElement;
                  const descInput = document.getElementById('master-desc') as HTMLInputElement;
                  if (enInput?.value) {
                    setMasterData(prev => ({
                      ...prev,
                      [activeCategory]: [...prev[activeCategory], { 
                        id: Date.now(), 
                        name: enInput.value, 
                        nameTh: thInput.value, 
                        desc: descInput.value, 
                        active: true 
                      }],
                    }));
                    setShowAddMasterModal(false);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 ${themeConfig.dialogOverlay}`} onClick={() => setShowAddRuleModal(false)}></div>
          <div className={`relative rounded-2xl max-w-lg w-full p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto ${themeConfig.dialog}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-lg font-bold ${themeConfig.textPrimary}`}>{t('setup.addRule')}</h3>
              <button onClick={() => setShowAddRuleModal(false)} className={`p-1 rounded hover:bg-white/10 ${themeConfig.textMuted}`}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="grid gap-1.5">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('setup.ruleName')}</label>
                <input 
                  type="text" 
                  id="rule-name" 
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select id="rule-field" className={`rounded-lg px-2 py-2 text-xs outline-none ${themeConfig.input} [&>option]:bg-slate-900`}>
                    {(dynamicFieldOptions.length > 0 ? [...new Set([...fieldOptions, ...dynamicFieldOptions])] : fieldOptions).map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <select id="rule-op" className={`rounded-lg px-2 py-2 text-xs outline-none ${themeConfig.input} [&>option]:bg-slate-900`}>
                    {opOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <input 
                    type="text" 
                    id="rule-val" 
                    placeholder="Value" 
                    className={`rounded-lg px-2 py-2 text-xs outline-none ${themeConfig.input}`}
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
                <div className="flex items-center gap-2">
                  <select id="rule-action-type" value={ruleActionType} onChange={e => setRuleActionType(e.target.value)} className={`rounded-lg px-2.5 py-2 text-xs outline-none ${themeConfig.input} [&>option]:bg-slate-900`}>
                    {['notify', 'highlight', 'block', 'status', 'task'].map(actType => (
                      <option key={actType} value={actType}>{actType}</option>
                    ))}
                  </select>
                  {ruleActionType === 'notify' ? (
                    <input 
                      type="text" 
                      id="rule-action-desc" 
                      placeholder="Target role / channel (e.g. supervisor, email, line)" 
                      className={`flex-1 rounded-lg px-2.5 py-2 text-xs outline-none ${themeConfig.input}`}
                    />
                  ) : (
                    <input 
                      type="text" 
                      id="rule-action-desc" 
                      placeholder="Description" 
                      className={`flex-1 rounded-lg px-2.5 py-2 text-xs outline-none ${themeConfig.input}`}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6 justify-end">
              <button 
                onClick={() => setShowAddRuleModal(false)}
                className={`px-4 py-2 rounded-lg text-xs font-bold ${themeConfig.secondaryButton}`}
              >
                {t('btn.cancel')}
              </button>
              <button 
                onClick={() => {
                  const nameInput = document.getElementById('rule-name') as HTMLInputElement;
                  const fieldInput = document.getElementById('rule-field') as HTMLSelectElement;
                  const opInput = document.getElementById('rule-op') as HTMLSelectElement;
                  const valInput = document.getElementById('rule-val') as HTMLInputElement;
                  const actTypeInput = document.getElementById('rule-action-type') as HTMLSelectElement;
                  const actDescInput = document.getElementById('rule-action-desc') as HTMLSelectElement | HTMLInputElement;

                  if (nameInput?.value) {
                    setRules(prev => [...prev, {
                      id: Date.now(),
                      name: nameInput.value,
                      active: true,
                      condition: {
                        field: fieldInput.value,
                        op: opInput.value,
                        value: valInput.value
                      },
                      actions: [{
                        type: actTypeInput.value,
                        [actTypeInput.value === 'notify' ? 'target' : 'desc']: actDescInput.value
                      }]
                    }]);
                    setShowAddRuleModal(false);
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

      {/* Edit Approval Matrix Modal */}
      {editApprovalRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 ${themeConfig.dialogOverlay}`} onClick={() => setEditApprovalRow(null)}></div>
          <div className={`relative rounded-2xl max-w-2xl w-full p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto ${themeConfig.dialog}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-lg font-bold ${themeConfig.textPrimary}`}>
                {editApprovalRow === 'new' ? t('btn.add') : t('btn.edit')} — {t('setup.approvalMatrix')}
              </h3>
              <button onClick={() => setEditApprovalRow(null)} className={`p-1 rounded hover:bg-white/10 ${themeConfig.textMuted}`}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
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
                  {ROLES.map(r => {
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
                      <select value={step.role} onChange={e => updateApprovalStep(idx, 'role', e.target.value)}
                        className={`flex-1 rounded-lg px-2 py-1.5 text-xs outline-none ${themeConfig.input} [&>option]:bg-slate-900`}>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <select value={step.sla} onChange={e => updateApprovalStep(idx, 'sla', e.target.value)}
                        className={`w-20 rounded-lg px-2 py-1.5 text-xs outline-none ${themeConfig.input} [&>option]:bg-slate-900`}>
                        {['30min', '1h', '2h', '4h', '8h', '24h', '48h'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select value={step.type} onChange={e => updateApprovalStep(idx, 'type', e.target.value)}
                        className={`w-24 rounded-lg px-2 py-1.5 text-xs outline-none ${themeConfig.input} [&>option]:bg-slate-900`}>
                        <option value="approve">อนุมัติ</option>
                        <option value="notify">แจ้งเตือน</option>
                      </select>
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
                  onClick={() => deleteApprovalRow(editApprovalRow.id)}
                  className="px-3 py-2 rounded-lg text-xs font-bold text-white shadow bg-rose-600 hover:bg-rose-500 transition mr-auto"
                >
                  <X size={15} /> ลบ
                </button>
              )}
              <button 
                onClick={() => setEditApprovalRow(null)}
                className={`px-4 py-2 rounded-lg text-xs font-bold ${themeConfig.secondaryButton}`}
              >
                {t('btn.cancel')}
              </button>
              <button 
                onClick={() => {
                  const evInput = document.getElementById('approval-event') as HTMLInputElement;
                  const refTypeInput = document.getElementById('approval-reftype') as HTMLInputElement;
                  const roleChecks = document.querySelectorAll<HTMLInputElement>('[data-role]');
                  const visibleToRoles = Array.from(roleChecks).filter(c => c.checked).map(c => c.dataset.role || '');

                  if (evInput?.value) {
                    saveApprovalRow({
                      id: editApprovalRow === 'new' ? null : editApprovalRow.id,
                      event: evInput.value,
                      refType: refTypeInput.value,
                      steps: approvalSteps,
                      visibleToRoles,
                      active: editApprovalRow === 'new' ? true : editApprovalRow.active
                    });
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
