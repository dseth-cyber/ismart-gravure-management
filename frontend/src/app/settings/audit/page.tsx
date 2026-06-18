'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { AppButton } from '@/components/shared/app-button';
import { useTheme } from '@/lib/theme/theme-provider';
import { listAuditLogs } from '@/lib/services/audit';
import { listSettings, saveSetting } from '@/lib/services/setting';
import type { AuditLogDto } from '@shared/dto/audit/audit.dto';
import { Search, Filter, Calendar, ShieldAlert, CheckSquare, Trash2, RefreshCw } from 'lucide-react';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function AuditSettingsPage() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const optionClass = themeConfig.name === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white';

  // Localize Action name
  const getLocalizedAction = (action: string) => {
    return t(`audit.action.${action}`) || action;
  };

  // Localize Details description dynamically
  const getLocalizedDetails = (action: string, details: string) => {
    // 1. User {username} logged in successfully
    const loginSuccessMatch = details.match(/^User (.*) logged in successfully$/);
    if (loginSuccessMatch) {
      return t('audit.details.login_success', { username: loginSuccessMatch[1] }) || details;
    }

    // 2. Failed login attempt for username: {username}
    const loginFailedMatch = details.match(/^Failed login attempt for username: (.*)$/);
    if (loginFailedMatch) {
      return t('audit.details.login_failed', { username: loginFailedMatch[1] }) || details;
    }

    // 3. Successfully generated {reportName} report in the background
    const reportMatch = details.match(/^Successfully generated (.*) report in the background$/);
    if (reportMatch) {
      return t('audit.details.report_gen_success', { reportName: reportMatch[1] }) || details;
    }

    // 4. Enqueued background job {jobId} of type {type} successfully
    const jobEnqueuedMatch = details.match(/^Enqueued background job (.*) of type (.*) successfully$/);
    if (jobEnqueuedMatch) {
      return t('audit.details.job_enqueued', { jobId: jobEnqueuedMatch[1], type: jobEnqueuedMatch[2] }) || details;
    }

    // 5. Recorded QC inspection for Job {jobId}. Result: {result}
    const qcMatch = details.match(/^Recorded QC inspection for Job (.*)\. Result: (.*)$/);
    if (qcMatch) {
      return t('audit.details.qc_create', { jobId: qcMatch[1], result: qcMatch[2] }) || details;
    }

    // 6. Logged run for Job {jobId}. Start: {start}, End: {end}, Total: {total}, Scrap: {scrap}
    const logRunMatch = details.match(/^Logged run for Job (.*)\. Start: (.*), End: (.*), Total: (.*), Scrap: (.*)$/);
    if (logRunMatch) {
      return t('audit.details.job_log_run', {
        jobId: logRunMatch[1],
        start: logRunMatch[2],
        end: logRunMatch[3],
        total: logRunMatch[4],
        scrap: logRunMatch[5]
      }) || details;
    }

    // 7. Updated Production Job {jobId} status to {status}
    const updateStatusMatch = details.match(/^Updated Production Job (.*) status to (.*)$/);
    if (updateStatusMatch) {
      return t('audit.details.job_update_status', { jobId: updateStatusMatch[1], status: updateStatusMatch[2] }) || details;
    }

    // 8. Supervisor override applied for Job {jobId} by {username}
    const overrideMatch = details.match(/^Supervisor override applied for Job (.*) by (.*)$/);
    if (overrideMatch) {
      return t('audit.details.job_override', { jobId: overrideMatch[1], username: overrideMatch[2] }) || details;
    }

    // 9. Verified items for Job {jobId}. Passed: {passed}, Requires Override: {requires}
    const verifyMatch = details.match(/^Verified items for Job (.*)\. Passed: (.*), Requires Override: (.*)$/);
    if (verifyMatch) {
      return t('audit.details.job_verify', { jobId: verifyMatch[1], passed: verifyMatch[2], requires: verifyMatch[3] }) || details;
    }

    // 10. Created Production Job {jobId} for product {productCode}
    const jobCreateMatch = details.match(/^Created Production Job (.*) for product (.*)$/);
    if (jobCreateMatch) {
      return t('audit.details.job_create', { jobId: jobCreateMatch[1], productCode: jobCreateMatch[2] }) || details;
    }

    // 11. Created Sales Order {orderId} for product {productCode}
    const orderCreateMatch = details.match(/^Created Sales Order (.*) for product (.*)$/);
    if (orderCreateMatch) {
      return t('audit.details.order_create', { orderId: orderCreateMatch[1], productCode: orderCreateMatch[2] }) || details;
    }

    // 12. Granted permission {permName} to user {username}
    const grantUserMatch = details.match(/^Granted permission (.*) to user (.*)$/);
    if (grantUserMatch) {
      return t('audit.details.permission.grant_user', { permission: grantUserMatch[1], username: grantUserMatch[2] }) || details;
    }

    // 13. Denied permission {permName} to user {username}
    const denyUserMatch = details.match(/^Denied permission (.*) to user (.*)$/);
    if (denyUserMatch) {
      return t('audit.details.permission.deny_user', { permission: denyUserMatch[1], username: denyUserMatch[2] }) || details;
    }

    // 14. Assigned permission {permName} to role {roleName}
    const assignRoleMatch = details.match(/^Assigned permission (.*) to role (.*)$/);
    if (assignRoleMatch) {
      return t('audit.details.permission.assign_role', { permission: assignRoleMatch[1], role: assignRoleMatch[2] }) || details;
    }

    // 15. Removed permission {permName} from role {roleName}
    const removeRoleMatch = details.match(/^Removed permission (.*) from role (.*)$/);
    if (removeRoleMatch) {
      return t('audit.details.permission.remove_role', { permission: removeRoleMatch[1], role: removeRoleMatch[2] }) || details;
    }

    // 16. Updated setting {key} to {value}
    const settingsUpdateMatch = details.match(/^Updated setting (.*) to (.*)$/);
    if (settingsUpdateMatch) {
      return t('audit.details.settings.update', { key: settingsUpdateMatch[1], value: settingsUpdateMatch[2] }) || details;
    }

    // 17. Cylinder actions: Created/Updated/Deleted/Restored/Permanently deleted cylinder {id}
    const cylinderActionMatch = details.match(/^(Created|Updated|Deleted|Restored|Permanently deleted) cylinder (.*)$/);
    if (cylinderActionMatch) {
      const action = cylinderActionMatch[1];
      const id = cylinderActionMatch[2];
      const key = `audit.details.cylinder.${action === 'Permanently deleted' ? 'permanent_delete' : action.toLowerCase()}`;
      return t(key, { id }) || details;
    }

    // 18. Cylinder batch actions: Batch updated/deleted/restored {count} cylinder(s) [to {status}]
    const cylinderBatchMatch = details.match(/^Batch (updated|deleted|restored) (\d+) cylinder\(s\)(?: to (\w+))?$/);
    if (cylinderBatchMatch) {
      const action = cylinderBatchMatch[1];
      const count = cylinderBatchMatch[2];
      const status = cylinderBatchMatch[3];
      const key = `audit.details.cylinder.batch_${action}`;
      return t(key, { count, ...(status ? { status } : {}) }) || details;
    }

    // 19. Emptied cylinder trash bin. Purged {count} cylinder(s)
    const cylinderEmptyTrashMatch = details.match(/^Emptied cylinder trash bin. Purged (\d+) cylinder\(s\)$/);
    if (cylinderEmptyTrashMatch) {
      return t('audit.details.cylinder.empty_trash', { count: cylinderEmptyTrashMatch[1] }) || details;
    }

    // 20. Ink formula actions: Created/Updated/Deleted/Restored/Permanently deleted ink formula {code}
    const formulaActionMatch = details.match(/^(Created|Updated|Deleted|Restored|Permanently deleted) ink formula (.*)$/);
    if (formulaActionMatch) {
      const action = formulaActionMatch[1];
      const code = formulaActionMatch[2];
      const key = `audit.details.formula.${action === 'Permanently deleted' ? 'permanent_delete' : action.toLowerCase()}`;
      return t(key, { code }) || details;
    }

    // 21. Ink batch actions: Created/Updated/Deleted/Restored/Permanently deleted ink batch {id}
    const batchActionMatch = details.match(/^(Created|Updated|Deleted|Restored|Permanently deleted) ink batch (.*)$/);
    if (batchActionMatch) {
      const action = batchActionMatch[1];
      const id = batchActionMatch[2];
      const key = `audit.details.batch.${action === 'Permanently deleted' ? 'permanent_delete' : action.toLowerCase()}`;
      return t(key, { id }) || details;
    }

    // 22. User actions: Admin created/updated/deleted/restored/permanently deleted user {username}
    const userActionMatch = details.match(/^Admin (created|updated|deleted|restored|permanently deleted) user (.*)$/);
    if (userActionMatch) {
      const action = userActionMatch[1];
      const username = userActionMatch[2];
      const key = `audit.details.user.${action === 'permanently deleted' ? 'permanent_delete' : action.toLowerCase()}`;
      return t(key, { username }) || details;
    }

    // 23. Admin emptied user trash bin. Purged {count} user(s)
    const userEmptyTrashMatch = details.match(/^Admin emptied user trash bin. Purged (\d+) user\(s\)$/);
    if (userEmptyTrashMatch) {
      return t('audit.details.user.empty_trash', { count: userEmptyTrashMatch[1] }) || details;
    }

    // 24. Production job deleted/restored/permanently deleted
    const jobActionMatch = details.match(/^(Deleted|Restored|Permanently deleted) production job (.*)$/);
    if (jobActionMatch) {
      const action = jobActionMatch[1];
      const jobNumber = jobActionMatch[2];
      const key = `audit.details.production_job.${action === 'Permanently deleted' ? 'permanent_delete' : action.toLowerCase()}`;
      return t(key, { jobNumber }) || details;
    }

    // 25. Emptied production job trash/bin. Purged {count} job(s)
    const jobEmptyTrashMatch = details.match(/^Emptied production job trash bin. Purged (\d+) job\(s\)$/);
    if (jobEmptyTrashMatch) {
      return t('audit.details.production_job.empty_trash', { count: jobEmptyTrashMatch[1] }) || details;
    }

    // 26. Job batch actions: Batch updated/deleted/restored {count} job(s) [to {status}]
    const jobBatchMatch = details.match(/^Batch (updated|deleted|restored) (\d+) job\(s\)(?: to (\w+))?$/);
    if (jobBatchMatch) {
      const action = jobBatchMatch[1];
      const count = jobBatchMatch[2];
      const status = jobBatchMatch[3];
      const key = `audit.details.job.batch_${action}`;
      return t(key, { count, ...(status ? { status } : {}) }) || details;
    }

    // 27. Ink batch formula actions: Batch updated/deleted/restored {count} formula(s) [to {status}]
    const inkFormulaBatchMatch = details.match(/^Batch (updated|deleted|restored) (\d+) formula\(s\)(?: to (\w+))?$/);
    if (inkFormulaBatchMatch) {
      const action = inkFormulaBatchMatch[1];
      const count = inkFormulaBatchMatch[2];
      const status = inkFormulaBatchMatch[3];
      const key = `audit.details.ink.batch_formula_${action}`;
      return t(key, { count, ...(status ? { status } : {}) }) || details;
    }

    // 28. Ink batch batch actions: Batch deleted/restored {count} batch(es)
    const inkBatchBatchMatch = details.match(/^Batch (deleted|restored) (\d+) batch\(es\)$/);
    if (inkBatchBatchMatch) {
      const action = inkBatchBatchMatch[1];
      const count = inkBatchBatchMatch[2];
      const key = `audit.details.ink.batch_batch_${action}`;
      return t(key, { count }) || details;
    }

    // 29. Sales Order status update / deleted
    const salesOrderMatch = details.match(/^Updated Sales Order (.*) status to (.*)$/);
    if (salesOrderMatch) {
      return t('audit.details.sales_order.update_status', { orderNumber: salesOrderMatch[1], status: salesOrderMatch[2] }) || details;
    }
    const salesOrderDeleteMatch = details.match(/^Deleted Sales Order (.*)$/);
    if (salesOrderDeleteMatch) {
      return t('audit.details.sales_order.delete', { orderNumber: salesOrderDeleteMatch[1] }) || details;
    }

    // 30. Permission/Role/Scope actions: Created/Updated/Deleted {type}: {name}
    const genericCrudMatch = details.match(/^(Created|Updated|Deleted) (permission|role|scope): (.*)$/);
    if (genericCrudMatch) {
      const action = genericCrudMatch[1].toLowerCase();
      const entity = genericCrudMatch[2];
      const name = genericCrudMatch[3];
      const key = `audit.details.${entity}.${action}`;
      return t(key, { name }) || details;
    }

    // 31. Permission batch actions: Batch granted/denied {count} permissions to/for user {userId}
    const batchGrantMatch = details.match(/^Batch granted (\d+) permissions to user (.*)$/);
    if (batchGrantMatch) {
      return t('audit.details.permission.batch_grant', { count: batchGrantMatch[1], userId: batchGrantMatch[2] }) || details;
    }
    const batchDenyMatch = details.match(/^Batch denied (\d+) permissions for user (.*)$/);
    if (batchDenyMatch) {
      return t('audit.details.permission.batch_deny', { count: batchDenyMatch[1], userId: batchDenyMatch[2] }) || details;
    }

    // 32. User password/MFA actions
    const passwordChangeMatch = details.match(/^User (.*) changed password$/);
    if (passwordChangeMatch) {
      return t('audit.details.auth.password.change', { username: passwordChangeMatch[1] }) || details;
    }
    const mfaEnableMatch = details.match(/^User (.*) enabled MFA$/);
    if (mfaEnableMatch) {
      return t('audit.details.auth.mfa.enable', { username: mfaEnableMatch[1] }) || details;
    }
    const mfaDisableMatch = details.match(/^User (.*) disabled MFA$/);
    if (mfaDisableMatch) {
      return t('audit.details.auth.mfa.disable', { username: mfaDisableMatch[1] }) || details;
    }
    const mfaVerifyMatch = details.match(/^User (.*) completed MFA verification$/);
    if (mfaVerifyMatch) {
      return t('audit.details.auth.mfa.verify', { username: mfaVerifyMatch[1] }) || details;
    }

    // 33. QC inspection delete
    const qcDeleteMatch = details.match(/^Deleted QC inspection ID (.*) for Job (.*)$/);
    if (qcDeleteMatch) {
      return t('audit.details.qc_inspection.delete', { id: qcDeleteMatch[1], jobNumber: qcDeleteMatch[2] }) || details;
    }

    // 34. Workflow actions
    const workflowDefCreateMatch = details.match(/^Created workflow definition: (.*)$/);
    if (workflowDefCreateMatch) {
      return t('audit.details.workflow.def.create', { name: workflowDefCreateMatch[1] }) || details;
    }
    const workflowDefUpdateMatch = details.match(/^Updated workflow definition: (.*)$/);
    if (workflowDefUpdateMatch) {
      return t('audit.details.workflow.def.update', { name: workflowDefUpdateMatch[1] }) || details;
    }
    const workflowStartMatch = details.match(/^Started workflow: (.*) \((.*):(.*)\)$/);
    if (workflowStartMatch) {
      return t('audit.details.workflow.instance.start', { title: workflowStartMatch[1], refType: workflowStartMatch[2], refId: workflowStartMatch[3] }) || details;
    }
    const workflowApproveMatch = details.match(/^Approved workflow: (.*) \(step (.*)\)$/);
    if (workflowApproveMatch) {
      return t('audit.details.workflow.approve', { title: workflowApproveMatch[1], step: workflowApproveMatch[2] }) || details;
    }
    const workflowRejectMatch = details.match(/^Rejected workflow: (.*)$/);
    if (workflowRejectMatch) {
      return t('audit.details.workflow.reject', { title: workflowRejectMatch[1] }) || details;
    }
    const workflowCancelMatch = details.match(/^Cancelled workflow: (.*)$/);
    if (workflowCancelMatch) {
      return t('audit.details.workflow.cancel', { title: workflowCancelMatch[1] }) || details;
    }

    // 35. Empty trash fallback: Emptied {entity} trash bin. Purged {count} {items}
    const emptyTrashMatch = details.match(/^Emptied (formula|batch|production job|cylinder) trash bin. Purged (\d+) .*$/);
    if (emptyTrashMatch) {
      const entity = emptyTrashMatch[1].replace(' ', '_');
      const count = emptyTrashMatch[2];
      return t(`audit.details.${entity}.empty_trash`, { count }) || details;
    }

    return details;
  };

  const getFieldLabel = (entity: string, field: string) => {
    if (entity === 'cylinder') {
      if (field === 'id') return t('col.code') || 'Cylinder Code';
      if (field === 'productCode') return t('col.productCode') || 'Product Code';
      if (field === 'customer') return t('col.customer') || 'Customer';
      if (field === 'size') return t('cyl.size') || 'Size';
      if (field === 'location') return t('col.location') || 'Location';
      if (field === 'color') return t('col.color') || 'Color';
      if (field === 'type') return 'Type';
    }
    if (entity === 'inkFormula') {
      if (field === 'code') return t('col.formula') || 'Formula Code';
      if (field === 'productCode') return t('col.productCode') || 'Product Code';
      if (field === 'pantone') return t('col.pantone') || 'Pantone';
      if (field === 'viscosity') return t('col.viscosity') || 'Viscosity';
      if (field === 'color') return t('col.color') || 'Color';
      if (field === 'solvent') return 'Solvent';
      if (field === 'labTarget') return t('col.labTarget') || 'Lab Target';
    }
    if (entity === 'inkBatch') {
      if (field === 'mixProduct') return t('col.productCode') || 'Product Code';
      if (field === 'mixColor') return t('col.color') || 'Color';
      if (field === 'weight') return t('ink.weightUsed') || 'Weight';
      if (field === 'mixDate') return t('ink.mixDate') || 'Mix Date';
      if (field === 'expiryDate') return t('ink.expiryDate') || 'Expiry Date';
      if (field === 'operator') return t('ink.operator') || 'Operator';
    }
    if (entity === 'user') {
      if (field === 'username') return t('settings.username') || 'Username';
      if (field === 'email') return t('settings.email') || 'Email';
      if (field === 'role') return t('settings.role') || 'Role';
      if (field === 'password') return t('settings.password') || 'Password';
    }
    return field;
  };
  
  // Tabs: 'logs', 'retention', 'required'
  const [activeTab, setActiveTab] = useState<'logs' | 'retention' | 'required'>('logs');
  const queryClient = useQueryClient();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const limit = 20;

  // Retention Settings State
  const [retentionDays, setRetentionDays] = useState('90');
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [retentionSuccess, setRetentionSuccess] = useState(false);

  // Required Fields Checklist State
  const [requiredFields, setRequiredFields] = useState<{
    cylinder: string[];
    inkFormula: string[];
    inkBatch: string[];
    user: string[];
  }>({
    cylinder: [],
    inkFormula: [],
    inkBatch: [],
    user: []
  });
  const [requiredFieldsLoading, setRequiredFieldsLoading] = useState(false);
  const [requiredFieldsSuccess, setRequiredFieldsSuccess] = useState(false);

  // Audit Logs Query fetching
  const { data: logResult, isLoading: loading, error: queryError, refetch: fetchLogs } = useQuery({
    queryKey: ['audit-logs', page, searchQuery, actionFilter, moduleFilter, startDate, endDate],
    queryFn: () => listAuditLogs({
      limit,
      offset: (page - 1) * limit,
      search: searchQuery || undefined,
      action: actionFilter || undefined,
      module: moduleFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    }),
    enabled: activeTab === 'logs'
  });

  const logs = logResult?.data || [];
  const total = logResult?.total || 0;

  // Settings Query fetching
  const { data: dbSettings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => listSettings()
  });

  // Local/Mutation Errors State
  const [error, setError] = useState('');

  // Sync settings when loaded
  useEffect(() => {
    if (dbSettings.length > 0) {
      const retSetting = dbSettings.find(s => s.key === 'retention.auditLogsDays');
      if (retSetting) {
        setRetentionDays(retSetting.value);
      }
      
      const newRequiredFields = { cylinder: [], inkFormula: [], inkBatch: [], user: [] };
      
      const cylRequired = dbSettings.find(s => s.key === 'requiredFields.cylinder');
      if (cylRequired) {
        try { newRequiredFields.cylinder = JSON.parse(cylRequired.value); } catch (e) {}
      }

      const formulaRequired = dbSettings.find(s => s.key === 'requiredFields.inkFormula');
      if (formulaRequired) {
        try { newRequiredFields.inkFormula = JSON.parse(formulaRequired.value); } catch (e) {}
      }

      const batchRequired = dbSettings.find(s => s.key === 'requiredFields.inkBatch');
      if (batchRequired) {
        try { newRequiredFields.inkBatch = JSON.parse(batchRequired.value); } catch (e) {}
      }

      const userRequired = dbSettings.find(s => s.key === 'requiredFields.user');
      if (userRequired) {
        try { newRequiredFields.user = JSON.parse(userRequired.value); } catch (e) {}
      }

      setRequiredFields(newRequiredFields);
    }
  }, [dbSettings]);

  // Sync query error
  useEffect(() => {
    if (queryError) {
      setError(queryError instanceof Error ? queryError.message : String(queryError));
    } else {
      setError('');
    }
  }, [queryError]);

  // Save Retention Setting
  const handleSaveRetention = async () => {
    setRetentionLoading(true);
    setRetentionSuccess(false);
    try {
      await saveSetting('retention.auditLogsDays', retentionDays);
      setRetentionSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setTimeout(() => setRetentionSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save retention settings');
    } finally {
      setRetentionLoading(false);
    }
  };

  // Save Required Fields configuration
  const handleSaveRequiredFields = async () => {
    setRequiredFieldsLoading(true);
    setRequiredFieldsSuccess(false);
    try {
      await saveSetting('requiredFields.cylinder', JSON.stringify(requiredFields.cylinder));
      await saveSetting('requiredFields.inkFormula', JSON.stringify(requiredFields.inkFormula));
      await saveSetting('requiredFields.inkBatch', JSON.stringify(requiredFields.inkBatch));
      await saveSetting('requiredFields.user', JSON.stringify(requiredFields.user));
      setRequiredFieldsSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setTimeout(() => setRequiredFieldsSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save required fields settings');
    } finally {
      setRequiredFieldsLoading(false);
    }
  };

  // Toggle checklist checkbox
  const handleToggleRequiredField = (entity: 'cylinder' | 'inkFormula' | 'inkBatch' | 'user', field: string) => {
    setRequiredFields(prev => {
      const currentList = prev[entity];
      const newList = currentList.includes(field)
        ? currentList.filter(f => f !== field)
        : [...currentList, field];
      return {
        ...prev,
        [entity]: newList
      };
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AppLayout>
      <div className="grid gap-6">
        <PageHeader
          titleKey="settings.auditLogs"
          subtitleKey="settings.auditLogsDesc"
        />

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
        )}

        {/* Tab Headers */}
        <div className="flex border-b" style={{ borderColor: 'var(--border-color, #e5e7eb)' }}>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'logs'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('settings.auditLogs') || 'Audit Logs'}
          </button>
          <button
            onClick={() => setActiveTab('retention')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'retention'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('settings.retentionPolicy') || 'Log Retention Settings'}
          </button>
          <button
            onClick={() => setActiveTab('required')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'required'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('settings.requiredFields') || 'Required Fields Settings'}
          </button>
        </div>

        {/* TAB 1: Audit Logs Viewer */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className={`grid gap-4 p-4 rounded-xl border sm:grid-cols-2 md:grid-cols-5 ${themeConfig.panel} ${themeConfig.border}`}>
              {/* Search text */}
              <div className="relative">
                <Search className={`absolute left-3 top-2.5 h-4 w-4 ${themeConfig.textMuted}`} />
                <input
                  type="text"
                  placeholder={t('common.search') || 'Search users, details, IP...'}
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className={`w-full rounded-lg border pl-9 pr-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`}
                />
              </div>

              {/* Action type */}
              <div className="text-slate-100">
                <SearchableSelect
                  value={actionFilter}
                  onChange={(v) => { setActionFilter(v); setPage(1); }}
                  placeholder={t('settings.allActions') || 'All Actions'}
                  options={[
                    { value: 'create', label: t('settings.actionAdd') || 'Add (Create)' },
                    { value: 'update', label: t('settings.actionEdit') || 'Edit (Update)' },
                    { value: 'delete', label: t('settings.actionDelete') || 'Delete' },
                    { value: 'login', label: t('settings.actionLogin') || 'Login' },
                    { value: 'print', label: t('settings.actionPrint') || 'Print Label' },
                  ]}
                />
              </div>

              {/* Module Filter */}
              <div className="text-slate-100">
                <SearchableSelect
                  value={moduleFilter}
                  onChange={(v) => { setModuleFilter(v); setPage(1); }}
                  placeholder={t('settings.allModules') || 'All Modules'}
                  options={[
                    { value: 'cylinder', label: t('menu.cylinders') || 'Cylinders' },
                    { value: 'ink', label: t('menu.inks') || 'Inks (Formula & Batch)' },
                    { value: 'auth', label: t('settings.userMgt') || 'Users & Auth' },
                    { value: 'job', label: t('menu.jobs') || 'Production Jobs & QC' },
                    { value: 'order', label: t('menu.orders') || 'Sales Orders' },
                  ]}
                />
              </div>

              {/* Start Date */}
              <div className="relative">
                <Calendar className={`absolute left-3 top-2.5 h-4 w-4 ${themeConfig.textMuted}`} />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className={`w-full rounded-lg border pl-9 pr-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`}
                />
              </div>

              {/* End Date */}
              <div className="relative">
                <Calendar className={`absolute left-3 top-2.5 h-4 w-4 ${themeConfig.textMuted}`} />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className={`w-full rounded-lg border pl-9 pr-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`}
                />
              </div>
            </div>

            {/* Refresh button */}
            <div className="flex justify-end">
              <AppButton variant="ghost" onClick={() => fetchLogs()} className="gap-1.5 text-xs">
                <RefreshCw className="h-3.5 w-3.5" />
                {t('common.refresh') || 'Refresh'}
              </AppButton>
            </div>

            {/* Table */}
            {loading ? (
              <div className={`rounded-lg p-12 text-center text-sm ${themeConfig.textMuted}`}>{t('common.loading') || 'Loading...'}</div>
            ) : logs.length === 0 ? (
              <div className={`rounded-lg p-12 text-center text-sm ${themeConfig.textMuted}`}>{t('common.empty') || 'No audit logs found'}</div>
            ) : (
              <div className={`overflow-x-auto rounded-lg border ${themeConfig.border}`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${themeConfig.border} bg-gray-50/50 dark:bg-gray-800/50`}>
                      <th className="p-3 text-left text-xs font-bold uppercase tracking-wider">{t('audit.dateTime') || 'Date / Time'}</th>
                      <th className="p-3 text-left text-xs font-bold uppercase tracking-wider">{t('audit.user') || 'User'}</th>
                      <th className="p-3 text-left text-xs font-bold uppercase tracking-wider">{t('audit.action') || 'Action'}</th>
                      <th className="p-3 text-left text-xs font-bold uppercase tracking-wider">{t('audit.details') || 'Details'}</th>
                      <th className="p-3 text-left text-xs font-bold uppercase tracking-wider">{t('audit.ipAddress') || 'IP Address'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-color, #e5e7eb)' }}>
                    {logs.map((log) => (
                      <tr key={log.id} className={`transition hover:${themeConfig.panelHover}`}>
                        <td className="p-3 whitespace-nowrap text-xs font-medium">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-semibold" title={log.userId || ''}>{log.username || 'System'}</span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            log.action.includes('.create') ? 'bg-green-500/20 text-green-400' :
                            log.action.includes('.update') ? 'bg-blue-500/20 text-blue-400' :
                            log.action.includes('.delete') || log.action.includes('.permanent') ? 'bg-red-500/20 text-red-400' :
                            log.action.includes('login') ? 'bg-amber-500/20 text-amber-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {getLocalizedAction(log.action)}
                          </span>
                        </td>
                        <td className="p-3 text-xs leading-relaxed max-w-md break-words">
                          {getLocalizedDetails(log.action, log.details)}
                        </td>
                        <td className={`p-3 whitespace-nowrap text-xs ${themeConfig.textMuted}`}>
                          {log.ipAddress || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-2">
                <span className={`text-xs ${themeConfig.textMuted}`}>
                  {t('common.showingEntries', { from: (page - 1) * limit + 1, to: Math.min(page * limit, total), total: total }) || `Showing ${(page - 1) * limit + 1} to ${Math.min(page * limit, total)} of ${total} entries`}
                </span>
                <div className="flex gap-2">
                  <AppButton
                    variant="ghost"
                    className="min-h-8 px-2.5 text-xs"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                  >
                    {t('common.previous') || 'Previous'}
                  </AppButton>
                  <span className="flex items-center px-3 text-xs font-bold">
                    {page} / {totalPages}
                  </span>
                  <AppButton
                    variant="ghost"
                    className="min-h-8 px-2.5 text-xs"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  >
                    {t('common.next') || 'Next'}
                  </AppButton>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Log Retention Policy */}
        {activeTab === 'retention' && (
          <div className={`rounded-xl border p-6 space-y-6 max-w-xl ${themeConfig.panel} ${themeConfig.border}`}>
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className={`font-bold text-base ${themeConfig.textPrimary}`}>{t('settings.retentionTitle') || 'Log Auto-Deletion Settings'}</h3>
                <p className={`mt-1 text-xs ${themeConfig.textSecondary}`}>
                  {t('settings.retentionDesc') || 'Configure how long system logs are retained before auto-purging. Under Thai Computer Crimes Act and PDPA, user audit logs must be kept for a minimum of 90 days.'}
                </p>
              </div>
            </div>

            <hr className={`border-t ${themeConfig.border}`} />

            <div className="space-y-4">
              <div>
                <SearchableSelect
                  label={t('settings.retentionPeriod') || 'Retention Period'}
                  value={retentionDays}
                  onChange={setRetentionDays}
                  placeholder={t('common.select')}
                  options={[
                    { value: '90', label: t('settings.retention.90') || '90 Days (Thai Law Minimum)' },
                    { value: '180', label: t('settings.retention.180') || '180 Days (Recommended)' },
                    { value: '365', label: t('settings.retention.365') || '365 Days (1 Year)' },
                    { value: '730', label: t('settings.retention.730') || '730 Days (2 Years)' },
                    { value: 'forever', label: t('settings.retention.forever') || 'Forever (No auto-deletion)' },
                  ]}
                />
              </div>

              {retentionSuccess && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                  {t('settings.retentionSaved') || 'Log retention settings saved successfully.'}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <AppButton
                  variant="primary"
                  onClick={handleSaveRetention}
                  disabled={retentionLoading}
                >
                  {retentionLoading ? t('common.saving') || 'Saving...' : t('common.save') || 'Save Policy'}
                </AppButton>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Required Fields Checklist */}
        {activeTab === 'required' && (
          <div className="space-y-6">
            <div className={`rounded-xl border p-6 ${themeConfig.panel} ${themeConfig.border}`}>
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <CheckSquare className="h-6 w-6" />
                </div>
                <div>
                  <h3 className={`font-bold text-base ${themeConfig.textPrimary}`}>{t('settings.requiredFieldsTitle') || 'Configure Mandatory Form Fields'}</h3>
                  <p className={`mt-1 text-xs ${themeConfig.textSecondary}`}>
                    {t('settings.requiredFieldsDesc') || 'Select checkboxes below to define which fields are mandatory for creating cylinders, ink formulas, and ink batches.'}
                  </p>
                </div>
              </div>

              <hr className={`my-6 border-t ${themeConfig.border}`} />

              <div className="grid gap-6 md:grid-cols-4">
                {/* Cylinder fields */}
                <div className="space-y-3">
                  <h4 className={`text-sm font-bold border-b pb-1 ${themeConfig.textPrimary} ${themeConfig.border}`}>
                    {t('menu.cylinders') || 'Cylinders'}
                  </h4>
                  {['id', 'productCode', 'customer', 'size', 'location', 'color', 'type'].map((field) => (
                    <label key={field} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={requiredFields.cylinder.includes(field)}
                        onChange={() => handleToggleRequiredField('cylinder', field)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{getFieldLabel('cylinder', field)}</span>
                    </label>
                  ))}
                </div>

                {/* Ink Formula fields */}
                <div className="space-y-3">
                  <h4 className={`text-sm font-bold border-b pb-1 ${themeConfig.textPrimary} ${themeConfig.border}`}>
                    {t('ink.formula') || 'Ink Formula'}
                  </h4>
                  {['code', 'productCode', 'pantone', 'viscosity', 'color', 'solvent', 'labTarget'].map((field) => (
                    <label key={field} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={requiredFields.inkFormula.includes(field)}
                        onChange={() => handleToggleRequiredField('inkFormula', field)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{getFieldLabel('inkFormula', field)}</span>
                    </label>
                  ))}
                </div>

                {/* Ink Batch fields */}
                <div className="space-y-3">
                  <h4 className={`text-sm font-bold border-b pb-1 ${themeConfig.textPrimary} ${themeConfig.border}`}>
                    {t('ink.batch') || 'Ink Batch'}
                  </h4>
                  {['mixProduct', 'mixColor', 'weight', 'mixDate', 'expiryDate', 'operator'].map((field) => (
                    <label key={field} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={requiredFields.inkBatch.includes(field)}
                        onChange={() => handleToggleRequiredField('inkBatch', field)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{getFieldLabel('inkBatch', field)}</span>
                    </label>
                  ))}
                </div>

                {/* User fields */}
                <div className="space-y-3">
                  <h4 className={`text-sm font-bold border-b pb-1 ${themeConfig.textPrimary} ${themeConfig.border}`}>
                    {t('settings.userMgt') || 'Users'}
                  </h4>
                  {['username', 'email', 'role', 'password'].map((field) => (
                    <label key={field} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={requiredFields.user?.includes(field) || false}
                        onChange={() => handleToggleRequiredField('user', field)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{getFieldLabel('user', field)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {requiredFieldsSuccess && (
                <div className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                  {t('settings.requiredFieldsSaved') || 'Required fields configured successfully.'}
                </div>
              )}

              <div className="flex justify-end mt-6 pt-2">
                <AppButton
                  variant="primary"
                  onClick={handleSaveRequiredFields}
                  disabled={requiredFieldsLoading}
                >
                  {requiredFieldsLoading ? t('common.saving') || 'Saving...' : t('common.save') || 'Save Requirements'}
                </AppButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
