'use client';

import type { ChartType, ChartDataPoint, TimeSeriesPoint, GaugeConfig } from '@/lib/dashboard/dashboard-config';
import { getMockDataSource } from '@/lib/dashboard/dashboard-config';
import { TimeSeriesChart } from './time-series-chart';
import { BarChartComponent } from './bar-chart';
import { PieChartComponent } from './pie-chart';
import { HistogramChart } from './histogram-chart';
import { StatChart } from './stat-chart';
import { GaugeChart } from './gauge-chart';
import { BarGaugeChart } from './bar-gauge-chart';
import { TableChart } from './table-chart';
import { StateTimelineChart } from './state-timeline-chart';
import { HeatmapChart } from './heatmap-chart';
import { StatusHistoryChart } from './status-history-chart';
import { TextChart } from './text-chart';
import { AlertListChart } from './alert-list-chart';
import { DashboardListChart } from './dashboard-list-chart';
import { StackedBarChart } from './stacked-bar-chart';
import { CylinderStatusChart } from './cylinder-status-chart';
import { ActivityFeedChart } from './activity-feed-chart';
import { LocationChart } from './location-chart';
import { QuickMenuChart } from './quick-menu-chart';

interface Props {
  chartType: ChartType;
  dataSource: string;
  height?: number | string;
  title?: string;
}

export function ChartFactory({ chartType, dataSource, height = '100%' }: Props) {
  const mockData = getMockDataSource(dataSource as any);
  const colors = ['#22d3ee', '#d946ef', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#a855f7', '#14b8a6'];

  const renderChart = () => {
    switch (chartType) {
      case 'timeSeries':
        return <TimeSeriesChart data={mockData.timeSeries} height={height} />;

      case 'bar':
        return <BarChartComponent data={mockData.categories.map((c, i) => ({ label: c, value: Math.floor(Math.random() * 100) + 10, color: colors[i % colors.length] }))} height={height} />;

      case 'pie':
        return <PieChartComponent data={mockData.stats.map((s, i) => ({ ...s, color: s.color || colors[i % colors.length] }))} height={height} />;

      case 'histogram':
        return <HistogramChart data={mockData.stats.map((s, i) => ({ label: s.label, value: s.value, color: colors[i % colors.length] }))} height={height} />;

      case 'stat':
        return <StatChart data={mockData.stats} trend="up" trendValue={dataSource === 'cylinders' ? '+3.2%' : dataSource === 'inks' ? '+1.8%' : '+2.1%'} unit={dataSource === 'qc' ? '%' : ''} dataSource={dataSource} />;

      case 'gauge':
        return <GaugeChart config={mockData.gauge} label={dataSource} />;

      case 'barGauge':
        return <BarGaugeChart data={mockData.stats.map((s, i) => ({ ...s, color: s.color || colors[i % colors.length] }))} />;

      case 'table':
        return <TableChart data={mockData.table} />;

      case 'stateTimeline':
        return (
          <StateTimelineChart
            states={mockData.statuses.map((s, i) => ({
              state: s,
              start: `${8 + i}:00`,
              end: i < mockData.statuses.length - 1 ? `${9 + i}:00` : undefined,
              color: colors[i % colors.length],
            }))}
          />
        );

      case 'heatmap':
        return (
          <HeatmapChart
            data={mockData.categories.flatMap((cat, ci) =>
              ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, di) => ({
                x: day,
                y: cat,
                value: Math.floor(Math.random() * 100),
              }))
            )}
          />
        );

      case 'statusHistory':
        return (
          <StatusHistoryChart
            events={mockData.statuses.map((s, i) => ({
              status: s,
              time: `${6 + i * 2}:00`,
              color: colors[i % colors.length],
              label: s,
            }))}
          />
        );

      case 'text':
        return <TextChart content={`**${dataSource}** — Configure this text panel with markdown or HTML content.`} />;

      case 'alertList':
        return (
          <AlertListChart
            subtitle={dataSource === 'inks' ? 'Ink formulas near expiry' : dataSource === 'cylinders' ? 'Cylinder maintenance alerts' : 'Recent system alerts'}
            alerts={
              dataSource === 'inks'
                ? [
                    { id: 'INK-2012', icon: 'droplet' as const, swatchColor: '#06b6d4', details: 'Cyan • 250kg', statusDate: 'Expired: 2026-07-15', pillColor: '#ef4444', pillText: 'Expired' },
                    { id: 'INK-2087', icon: 'droplet' as const, swatchColor: '#d946ef', details: 'Magenta • 180kg', statusDate: 'Expires: 2026-06-20', pillColor: '#f59e0b', pillText: '3 days' },
                    { id: 'INK-2156', icon: 'droplet' as const, swatchColor: '#eab308', details: 'Yellow • 200kg', statusDate: 'Expires: 2026-06-25', pillColor: '#f59e0b', pillText: '8 days' },
                    { id: 'INK-1903', icon: 'droplet' as const, swatchColor: '#1e293b', details: 'Black • 300kg', statusDate: 'Expires: 2026-07-01', pillColor: '#22c55e', pillText: 'Active' },
                    { id: 'INK-2234', icon: 'droplet' as const, swatchColor: '#a855f7', details: 'Violet • 120kg', statusDate: 'Expires: 2026-06-30', pillColor: '#22c55e', pillText: 'Active' },
                  ]
                : dataSource === 'cylinders'
                  ? [
                      { id: 'CYL-1024', icon: 'alert' as const, swatchColor: '#ef4444', details: 'Overdue · 45,230m', statusDate: 'Inspection: 2026-05-01', pillColor: '#ef4444', pillText: 'Critical' },
                      { id: 'CYL-1089', icon: 'warning' as const, swatchColor: '#f59e0b', details: 'Scheduled · 38,100m', statusDate: 'Due: 2026-06-20', pillColor: '#f59e0b', pillText: 'Warning' },
                      { id: 'CYL-1156', icon: 'check' as const, swatchColor: '#22c55e', details: 'Completed · 52,000m', statusDate: 'Checked: 2026-06-10', pillColor: '#22c55e', pillText: 'OK' },
                    ]
                  : [
                      { id: 'ALR-042', icon: 'alert' as const, swatchColor: '#ef4444', details: 'Machine #3 · Temperature', statusDate: 'Reported: 2 min ago', pillColor: '#ef4444', pillText: 'Critical' },
                      { id: 'ALR-041', icon: 'warning' as const, swatchColor: '#f59e0b', details: 'Ink Tank #7 · Low level', statusDate: 'Reported: 15 min ago', pillColor: '#f59e0b', pillText: 'Warning' },
                      { id: 'ALR-040', icon: 'warning' as const, swatchColor: '#f59e0b', details: 'Cylinder #215 · Due soon', statusDate: 'Reported: 1 hour ago', pillColor: '#f59e0b', pillText: 'Warning' },
                      { id: 'ALR-039', icon: 'check' as const, swatchColor: '#22c55e', details: 'Job JOB-3042 completed', statusDate: 'Completed: 2 hours ago', pillColor: '#22c55e', pillText: 'Resolved' },
                    ]
            }
          />
        );

      case 'dashboardList':
        return (
          <DashboardListChart
            dashboards={[
              { id: 'exec', name: 'Executive Overview', href: '/' },
              { id: 'ops', name: 'Operations Dashboard', href: '/?template=operations' },
              { id: 'quality', name: 'Quality Dashboard', href: '/?template=quality' },
              { id: 'custom', name: 'Custom Dashboard', href: '/?template=custom' },
            ]}
          />
        );

      case 'stackedBar':
        return <StackedBarChart segments={mockData.distribution} />;

      case 'cylinderStatus':
        return <CylinderStatusChart />;

      case 'activityFeed':
        return (
          <ActivityFeedChart
            activities={[
              { id: '1', type: 'cylinder' as const, formatKey: 'activity.updatedCyl', args: ['สมชาย', 'CYL-1024', 'available'], timestamp: '14:32' },
              { id: '2', type: 'ink' as const, formatKey: 'activity.mixedInk', args: ['วิชัย', 'INK-2012', 'Cyan', '250kg'], timestamp: '14:15' },
              { id: '3', type: 'job' as const, formatKey: 'activity.startedJob', args: ['ประยุทธ์', 'J2024-045', 'M-03'], timestamp: '13:50' },
              { id: '4', type: 'qc' as const, formatKey: 'activity.passedQc', args: ['สมหมาย', 'J2024-044', '43', '45'], timestamp: '13:22' },
              { id: '5', type: 'machine' as const, formatKey: 'activity.completedMaint', args: ['M-02'], timestamp: '12:45' },
              { id: '6', type: 'system' as const, formatKey: 'activity.autoAssigned', args: ['CYL-1089', 'J2024-046'], timestamp: '12:10' },
            ]}
          />
        );

      case 'location':
        return (
          <LocationChart
            locations={[
              { name: 'Rack A',     count: 42, unit: 'ชิ้น' },
              { name: 'Rack B',     count: 38, unit: 'ชิ้น' },
              { name: 'Rack C',     count: 28, unit: 'ชิ้น' },
              { name: 'Rack D',     count: 22, unit: 'ชิ้น' },
              { name: 'Machine Area', count: 48, unit: 'ชิ้น' },
              { name: 'QC / Repair',  count: 18, unit: 'ชิ้น' },
            ]}
          />
        );

      case 'quickMenu':
        return <QuickMenuChart />;

      default:
        return <div className="flex items-center justify-center h-full text-gray-500 text-sm">Unknown chart type: {chartType}</div>;
    }
  };

  return <>{renderChart()}</>;
}

export type { ChartType };
