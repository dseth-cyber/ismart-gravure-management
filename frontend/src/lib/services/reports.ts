import { apiClient } from '@/lib/api/client';

export interface ScheduledReport {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  format: 'pdf' | 'xlsx';
  cron: string;
  recipients: string[];
  params?: Record<string, any> | null;
  active: boolean;
  lastRunAt?: string | null;
  lastError?: string | null;
  createdBy?: string | null;
}

export async function listScheduledReports() {
  const res = await apiClient.get('/api/v1/reports');
  return res.data.data as ScheduledReport[];
}

export async function getScheduledReport(id: string) {
  const res = await apiClient.get(`/api/v1/reports/${id}`);
  return res.data.data as ScheduledReport;
}

export async function createScheduledReport(data: {
  name: string; description?: string; type: string; format: 'pdf' | 'xlsx';
  cron: string; recipients: string[]; params?: Record<string, any>;
}) {
  const res = await apiClient.post('/api/v1/reports', data);
  return res.data.data as ScheduledReport;
}

export async function updateScheduledReport(id: string, data: Partial<ScheduledReport>) {
  const res = await apiClient.put(`/api/v1/reports/${id}`, data);
  return res.data.data as ScheduledReport;
}

export async function deleteScheduledReport(id: string) {
  await apiClient.delete(`/api/v1/reports/${id}`);
}

export async function runScheduledReport(id: string) {
  const res = await apiClient.post(`/api/v1/reports/${id}/run`);
  return res.data.data as { success: boolean; message?: string; error?: string };
}
