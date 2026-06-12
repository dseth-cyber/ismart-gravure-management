'use client';

export type ChartType =
  | 'timeSeries'
  | 'bar'
  | 'stat'
  | 'gauge'
  | 'barGauge'
  | 'table'
  | 'pie'
  | 'stateTimeline'
  | 'heatmap'
  | 'statusHistory'
  | 'histogram'
  | 'text'
  | 'alertList'
  | 'dashboardList'
  | 'stackedBar'
  | 'cylinderStatus'
  | 'activityFeed'
  | 'location';

export type DataSource = 'cylinders' | 'inks' | 'jobs' | 'qc' | 'production' | 'alerts' | 'inventory' | 'custom';

export interface DashboardCard {
  id: string;
  titleKey: string;
  customTitle?: string;
  chartType: ChartType;
  dataSource: DataSource;
  colSpan: 1 | 2 | 3;
  rowSpan: 1 | 2 | 3;
  width: number;
  height: number;
  config?: Record<string, unknown>;
}

export const TEMPLATE_VERSION = 3;

export interface DashboardLayout {
  cards: DashboardCard[];
  cardOrder: string[];
  hiddenCards: string[];
  activeTemplate: string;
  templateVersion?: number;
}

export interface DashboardTemplate {
  id: string;
  nameKey: string;
  cards: Omit<DashboardCard, 'id'>[];
}

export const CHART_TYPE_META: Record<ChartType, { nameKey: string; icon: string; defaultColSpan: 1 | 2 | 3; defaultRowSpan: 1 | 2 | 3 }> = {
  timeSeries:     { nameKey: 'chart.timeSeries',     icon: '📊', defaultColSpan: 2, defaultRowSpan: 2 },
  bar:            { nameKey: 'chart.bar',            icon: '📊', defaultColSpan: 2, defaultRowSpan: 2 },
  stat:           { nameKey: 'chart.stat',           icon: '📊', defaultColSpan: 1, defaultRowSpan: 1 },
  gauge:          { nameKey: 'chart.gauge',          icon: '📊', defaultColSpan: 1, defaultRowSpan: 2 },
  barGauge:       { nameKey: 'chart.barGauge',       icon: '📊', defaultColSpan: 1, defaultRowSpan: 2 },
  table:          { nameKey: 'chart.table',          icon: '📊', defaultColSpan: 3, defaultRowSpan: 2 },
  pie:            { nameKey: 'chart.pie',            icon: '📊', defaultColSpan: 1, defaultRowSpan: 2 },
  stateTimeline:  { nameKey: 'chart.stateTimeline',  icon: '📊', defaultColSpan: 2, defaultRowSpan: 2 },
  heatmap:        { nameKey: 'chart.heatmap',        icon: '🌡️', defaultColSpan: 2, defaultRowSpan: 2 },
  statusHistory:  { nameKey: 'chart.statusHistory',  icon: '📊', defaultColSpan: 2, defaultRowSpan: 1 },
  histogram:      { nameKey: 'chart.histogram',      icon: '📊', defaultColSpan: 2, defaultRowSpan: 2 },
  text:           { nameKey: 'chart.text',           icon: '📊', defaultColSpan: 1, defaultRowSpan: 1 },
  alertList:      { nameKey: 'chart.alertList',      icon: '📊', defaultColSpan: 1, defaultRowSpan: 2 },
  dashboardList:  { nameKey: 'chart.dashboardList',  icon: '📊', defaultColSpan: 1, defaultRowSpan: 1 },
  stackedBar:     { nameKey: 'chart.stackedBar',     icon: '▬', defaultColSpan: 2, defaultRowSpan: 1 },
  cylinderStatus: { nameKey: 'chart.cylinderStatus', icon: '🖨️', defaultColSpan: 2, defaultRowSpan: 2 },
  activityFeed:   { nameKey: 'chart.activityFeed',   icon: '📊', defaultColSpan: 2, defaultRowSpan: 2 },
  location:       { nameKey: 'chart.location',       icon: '📊', defaultColSpan: 2, defaultRowSpan: 1 },
};

export const DATA_SOURCE_META: Record<DataSource, { nameKey: string }> = {
  cylinders:   { nameKey: 'ds.cylinders' },
  inks:        { nameKey: 'ds.inks' },
  jobs:        { nameKey: 'ds.jobs' },
  qc:          { nameKey: 'ds.qc' },
  production:  { nameKey: 'ds.production' },
  alerts:      { nameKey: 'ds.alerts' },
  inventory:   { nameKey: 'ds.inventory' },
  custom:      { nameKey: 'ds.custom' },
};

export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: 'executive',
    nameKey: 'template.executive',
    cards: [
      { titleKey: 'dash.totalCylinders', chartType: 'stat', dataSource: 'cylinders', colSpan: 1, rowSpan: 1, width: 1, height: 1 },
      { titleKey: 'dash.activeFormulas', chartType: 'stat', dataSource: 'inks', colSpan: 1, rowSpan: 1, width: 1, height: 1 },
      { titleKey: 'dash.activeJobs', chartType: 'stat', dataSource: 'jobs', colSpan: 1, rowSpan: 1, width: 1, height: 1 },
      { titleKey: 'dash.cylinderStatus', chartType: 'cylinderStatus', dataSource: 'cylinders', colSpan: 3, rowSpan: 1, width: 3, height: 1 },
      { titleKey: 'dash.inkAlerts', chartType: 'alertList', dataSource: 'inks', colSpan: 1, rowSpan: 2, width: 1, height: 2 },
      { titleKey: 'dash.recentJobs', chartType: 'table', dataSource: 'jobs', colSpan: 2, rowSpan: 2, width: 2, height: 2 },
      { titleKey: 'dash.qcRate', chartType: 'pie', dataSource: 'qc', colSpan: 1, rowSpan: 2, width: 1, height: 2 },
      { titleKey: 'dash.recentActivity', chartType: 'activityFeed', dataSource: 'jobs', colSpan: 1, rowSpan: 1, width: 1, height: 1 },
      { titleKey: 'dash.cylinderByLocation', chartType: 'location', dataSource: 'cylinders', colSpan: 2, rowSpan: 1, width: 2, height: 1 },
    ],
  },
  {
    id: 'operations',
    nameKey: 'template.operations',
    cards: [
      { titleKey: 'dash.cylinderStatus', chartType: 'timeSeries', dataSource: 'cylinders', colSpan: 2, rowSpan: 2, width: 2, height: 2 },
      { titleKey: 'dash.recentJobs', chartType: 'bar', dataSource: 'jobs', colSpan: 1, rowSpan: 2, width: 1, height: 2 },
      { titleKey: 'dash.title', chartType: 'heatmap', dataSource: 'production', colSpan: 2, rowSpan: 2, width: 2, height: 2 },
      { titleKey: 'dash.title', chartType: 'stat', dataSource: 'production', colSpan: 1, rowSpan: 1, width: 1, height: 1 },
    ],
  },
  {
    id: 'quality',
    nameKey: 'template.quality',
    cards: [
      { titleKey: 'dash.qcRate', chartType: 'pie', dataSource: 'qc', colSpan: 1, rowSpan: 2, width: 1, height: 2 },
      { titleKey: 'dash.title', chartType: 'stateTimeline', dataSource: 'jobs', colSpan: 2, rowSpan: 2, width: 2, height: 2 },
      { titleKey: 'dash.title', chartType: 'stat', dataSource: 'qc', colSpan: 1, rowSpan: 1, width: 1, height: 1 },
      { titleKey: 'dash.title', chartType: 'barGauge', dataSource: 'qc', colSpan: 1, rowSpan: 2, width: 1, height: 2 },
      { titleKey: 'dash.recentActivity', chartType: 'statusHistory', dataSource: 'jobs', colSpan: 2, rowSpan: 1, width: 2, height: 1 },
    ],
  },
  {
    id: 'custom',
    nameKey: 'template.custom',
    cards: [],
  },
];

export interface RglItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export type RglLayouts = Record<string, RglItem[]>;

export const DEFAULT_RGL_LAYOUTS: RglLayouts = {
  lg: [
    { i: 'card_cylinders',   x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
    { i: 'card_inks',        x: 4, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
    { i: 'card_jobs',        x: 8, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
    { i: 'card_cylinderStatus', x: 0, y: 3, w: 12, h: 4, minW: 4, minH: 3 },
    { i: 'card_recentJobs',  x: 0, y: 7, w: 8, h: 5, minW: 4, minH: 3 },
    { i: 'card_qc',          x: 8, y: 7, w: 4, h: 5, minW: 2, minH: 3 },
    { i: 'card_activity',    x: 0, y: 12, w: 4, h: 3, minW: 2, minH: 2 },
    { i: 'card_location',    x: 4, y: 12, w: 8, h: 3, minW: 4, minH: 2 },
  ],
  md: [
    { i: 'card_cylinders',   x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
    { i: 'card_inks',        x: 4, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'card_jobs',        x: 7, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'card_cylinderStatus', x: 0, y: 3, w: 10, h: 4, minW: 4, minH: 3 },
    { i: 'card_recentJobs',  x: 0, y: 7, w: 6, h: 5, minW: 4, minH: 3 },
    { i: 'card_qc',          x: 6, y: 7, w: 4, h: 5, minW: 2, minH: 3 },
    { i: 'card_activity',    x: 0, y: 12, w: 4, h: 3, minW: 2, minH: 2 },
    { i: 'card_location',    x: 4, y: 12, w: 6, h: 3, minW: 4, minH: 2 },
  ],
  sm: [
    { i: 'card_cylinders',   x: 0, y: 0, w: 6, h: 3, minW: 2, minH: 2 },
    { i: 'card_inks',        x: 0, y: 3, w: 6, h: 3, minW: 2, minH: 2 },
    { i: 'card_jobs',        x: 0, y: 6, w: 6, h: 3, minW: 2, minH: 2 },
    { i: 'card_cylinderStatus', x: 0, y: 9, w: 6, h: 5, minW: 4, minH: 3 },
    { i: 'card_recentJobs',  x: 0, y: 14, w: 6, h: 5, minW: 4, minH: 3 },
    { i: 'card_qc',          x: 0, y: 19, w: 6, h: 5, minW: 2, minH: 3 },
    { i: 'card_activity',    x: 0, y: 24, w: 6, h: 3, minW: 2, minH: 2 },
    { i: 'card_location',    x: 0, y: 27, w: 6, h: 3, minW: 4, minH: 2 },
  ],
};

export const DEFAULT_LAYOUT: DashboardLayout = {
  cards: [],
  cardOrder: [],
  hiddenCards: [],
  activeTemplate: 'executive',
  templateVersion: TEMPLATE_VERSION,
};

function buildCardsFromTemplate(templateId: string): { cards: DashboardCard[]; cardOrder: string[] } {
  const tmpl = DASHBOARD_TEMPLATES.find(t => t.id === templateId);
  if (!tmpl) return { cards: [], cardOrder: [] };

  const cards: DashboardCard[] = tmpl.cards.map((c, i) => ({
    ...c,
    id: `card_${templateId}_${i}`,
  }));
  const cardOrder = cards.map(c => c.id);
  return { cards, cardOrder };
}

export function createInitialLayout(templateId?: string): DashboardLayout {
  const tid = templateId || 'executive';
  const { cards, cardOrder } = buildCardsFromTemplate(tid);
  return {
    cards,
    cardOrder,
    hiddenCards: [],
    activeTemplate: tid,
    templateVersion: TEMPLATE_VERSION,
  };
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  [key: string]: unknown;
}

export interface TimeSeriesPoint {
  time: string;
  value: number;
  category?: string;
}

export interface GaugeConfig {
  min: number;
  max: number;
  value: number;
  thresholds: Array<{ value: number; color: string }>;
}

export function getMockDataSource(dataSource: DataSource): { stats: ChartDataPoint[]; timeSeries: TimeSeriesPoint[]; table: Record<string, unknown>[]; gauge: GaugeConfig; statuses: string[]; categories: string[]; distribution: ChartDataPoint[] } {
  const now = new Date();
  const timeSeries: TimeSeriesPoint[] = Array.from({ length: 24 }, (_, i) => ({
    time: new Date(now.getTime() - (23 - i) * 3600000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    value: Math.floor(Math.random() * 80) + 10,
    category: 'total',
  }));

  switch (dataSource) {
    case 'cylinders':
      return {
        stats: [
          { label: 'Total', value: 284, color: '#22d3ee' },
          { label: 'Available', value: 156, color: '#10b981' },
          { label: 'In Production', value: 48, color: '#3b82f6' },
          { label: 'Repair', value: 12, color: '#ef4444' },
        ],
        timeSeries,
        table: Array.from({ length: 10 }, (_, i) => ({ id: `CYL-${1000 + i}`, status: ['available', 'inProduction', 'repair'][i % 3], location: `Rack ${String.fromCharCode(65 + i % 4)}`, meter: Math.floor(Math.random() * 50000) })),
        gauge: { min: 0, max: 300, value: 284, thresholds: [{ value: 100, color: '#ef4444' }, { value: 200, color: '#f59e0b' }, { value: 300, color: '#10b981' }] },
        statuses: ['available', 'inProduction', 'reserved', 'inspection', 'repair'],
        categories: ['Rack A', 'Rack B', 'Rack C', 'Rack D', 'Machine'],
        distribution: [
          { label: 'Available', value: 156, color: '#10b981' },
          { label: 'In Production', value: 48, color: '#3b82f6' },
          { label: 'Reserved', value: 38, color: '#d946ef' },
          { label: 'Inspection', value: 30, color: '#f59e0b' },
          { label: 'Repair', value: 12, color: '#ef4444' },
        ],
      };
    case 'inks':
      return {
        stats: [
          { label: 'Active Formulas', value: 127, color: '#d946ef' },
          { label: 'Total Batches', value: 312, color: '#a855f7' },
          { label: 'Near Expiry', value: 5, color: '#f59e0b' },
          { label: 'Expired', value: 3, color: '#ef4444' },
        ],
        timeSeries,
        table: Array.from({ length: 10 }, (_, i) => ({ id: `INK-${2000 + i}`, color: ['Cyan', 'Magenta', 'Yellow', 'Black'][i % 4], expiry: '2026-07-15', remaining: Math.floor(Math.random() * 100) + '%' })),
        gauge: { min: 0, max: 200, value: 127, thresholds: [{ value: 80, color: '#10b981' }, { value: 150, color: '#f59e0b' }, { value: 200, color: '#ef4444' }] },
        statuses: ['active', 'nearExpiry', 'expired'],
        categories: ['Cyan', 'Magenta', 'Yellow', 'Black', 'White', 'Special'],
        distribution: [],
      };
    case 'jobs':
      return {
        stats: [
          { label: 'Active Jobs', value: 12, color: '#10b981' },
          { label: 'Completed Today', value: 8, color: '#3b82f6' },
          { label: 'On Hold', value: 3, color: '#f59e0b' },
          { label: 'Cancelled', value: 1, color: '#ef4444' },
        ],
        timeSeries,
        table: [
          { jobNumber: 'J2024-045', productCode: 'AGH-001', machineName: 'M-03', operator: 'สมชาย', status: 'active', totalPrinted: 15200 },
          { jobNumber: 'J2024-044', productCode: 'BKK-002', machineName: 'M-01', operator: 'วิชัย', status: 'completed', totalPrinted: 22000 },
          { jobNumber: 'J2024-043', productCode: 'BKK-003', machineName: 'M-02', operator: 'สมชาย', status: 'completed', totalPrinted: 18500 },
          { jobNumber: 'J2024-042', productCode: 'AGH-002', machineName: 'M-03', operator: 'ประยุทธ์', status: 'completed', totalPrinted: 30100 },
          { jobNumber: 'J2024-046', productCode: 'CNX-001', machineName: 'M-04', operator: 'สมหมาย', status: 'pending', totalPrinted: 0 },
        ],
        gauge: { min: 0, max: 30, value: 12, thresholds: [{ value: 10, color: '#10b981' }, { value: 20, color: '#f59e0b' }, { value: 30, color: '#ef4444' }] },
        statuses: ['pending', 'active', 'completed', 'hold', 'cancelled'],
        categories: ['Job Type A', 'Job Type B', 'Job Type C', 'Job Type D'],
        distribution: [],
      };
    case 'qc':
      return {
        stats: [
          { label: 'QC Passed', value: 43, color: '#10b981' },
          { label: 'Hold', value: 2, color: '#f59e0b' },
          { label: 'Failed', value: 0, color: '#ef4444' },
          { label: 'Pass Rate', value: 96.5, color: '#22d3ee' },
        ],
        timeSeries,
        table: Array.from({ length: 10 }, (_, i) => ({ job: `QC-${4000 + i}`, inspector: `Inspector ${i % 3 + 1}`, result: ['pass', 'pass', 'hold'][i % 3], date: '2026-06-12' })),
        gauge: { min: 0, max: 100, value: 96.5, thresholds: [{ value: 50, color: '#ef4444' }, { value: 80, color: '#f59e0b' }, { value: 100, color: '#10b981' }] },
        statuses: ['pass', 'hold', 'fail'],
        categories: ['Shade', 'Barcode', 'Color Seq', 'Adhesion'],
        distribution: [],
      };
    case 'production':
      return {
        stats: [
          { label: 'Today Output', value: 12500, color: '#22d3ee' },
          { label: 'Scrap Rate', value: 1.2, color: '#f59e0b' },
          { label: 'Efficiency', value: 87, color: '#10b981' },
          { label: 'Machines Active', value: 5, color: '#3b82f6' },
        ],
        timeSeries,
        table: Array.from({ length: 10 }, (_, i) => ({ job: `PROD-${5000 + i}`, meter: Math.floor(Math.random() * 5000), scrap: Math.floor(Math.random() * 50), efficiency: (85 + Math.random() * 15).toFixed(1) + '%' })),
        gauge: { min: 0, max: 100, value: 87, thresholds: [{ value: 60, color: '#ef4444' }, { value: 80, color: '#f59e0b' }, { value: 100, color: '#10b981' }] },
        statuses: ['running', 'idle', 'maintenance', 'offline'],
        categories: ['Shift A', 'Shift B', 'Shift C'],
        distribution: [],
      };
    case 'alerts':
      return {
        stats: [
          { label: 'Critical', value: 2, color: '#ef4444' },
          { label: 'Warning', value: 7, color: '#f59e0b' },
          { label: 'Info', value: 15, color: '#3b82f6' },
          { label: 'Resolved (24h)', value: 23, color: '#10b981' },
        ],
        timeSeries,
        table: Array.from({ length: 10 }, (_, i) => ({ alert: `ALR-${6000 + i}`, severity: ['critical', 'warning', 'info'][i % 3], message: `Alert message ${i + 1}`, time: new Date(now.getTime() - i * 3600000).toLocaleTimeString() })),
        gauge: { min: 0, max: 50, value: 24, thresholds: [{ value: 10, color: '#10b981' }, { value: 25, color: '#f59e0b' }, { value: 50, color: '#ef4444' }] },
        statuses: ['critical', 'warning', 'info', 'resolved'],
        categories: ['Cylinder', 'Ink', 'Machine', 'QC'],
        distribution: [],
      };
    case 'inventory':
      return {
        stats: [
          { label: 'Cylinders', value: 1250, color: '#22d3ee' },
          { label: 'Ink Batches', value: 312, color: '#d946ef' },
          { label: 'Raw Materials', value: 89, color: '#f59e0b' },
          { label: 'Low Stock Items', value: 5, color: '#ef4444' },
        ],
        timeSeries,
        table: Array.from({ length: 10 }, (_, i) => ({ item: `MAT-${7000 + i}`, stock: Math.floor(Math.random() * 200), minLevel: 20, status: ['ok', 'low', 'critical'][i % 3] })),
        gauge: { min: 0, max: 100, value: 78, thresholds: [{ value: 40, color: '#ef4444' }, { value: 70, color: '#f59e0b' }, { value: 100, color: '#10b981' }] },
        statuses: ['ok', 'low', 'critical', 'out'],
        categories: ['Raw', 'WIP', 'Finished'],
        distribution: [],
      };
    default:
      return {
        stats: [],
        timeSeries: [],
        table: [],
        gauge: { min: 0, max: 100, value: 50, thresholds: [{ value: 30, color: '#ef4444' }, { value: 70, color: '#f59e0b' }, { value: 100, color: '#10b981' }] },
        statuses: ['active', 'inactive'],
        categories: ['A', 'B', 'C'],
        distribution: [],
      };
  }
}
