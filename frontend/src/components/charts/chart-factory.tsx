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

interface Props {
  chartType: ChartType;
  dataSource: string;
  height?: number;
  title?: string;
}

export function ChartFactory({ chartType, dataSource, height = 200 }: Props) {
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
        return <GaugeChart config={mockData.gauge} height={height} label={dataSource} />;

      case 'barGauge':
        return <BarGaugeChart data={mockData.stats.map((s, i) => ({ ...s, color: s.color || colors[i % colors.length] }))} height={height} />;

      case 'table':
        return <TableChart data={mockData.table} height={height} />;

      case 'stateTimeline':
        return (
          <StateTimelineChart
            states={mockData.statuses.map((s, i) => ({
              state: s,
              start: `${8 + i}:00`,
              end: i < mockData.statuses.length - 1 ? `${9 + i}:00` : undefined,
              color: colors[i % colors.length],
            }))}
            height={height}
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
            height={height}
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
            height={height}
          />
        );

      case 'text':
        return <TextChart content={`**${dataSource}** — Configure this text panel with markdown or HTML content.`} height={height} />;

      case 'alertList':
        return (
          <AlertListChart
            alerts={[
              { severity: 'critical', message: 'Cylinder CYL-1024 overdue for inspection', time: '2 min ago' },
              { severity: 'warning', message: 'Ink batch INK-2012 expiring in 3 days', time: '15 min ago' },
              { severity: 'warning', message: 'Machine #3 maintenance due', time: '1 hour ago' },
              { severity: 'info', message: 'Job JOB-3042 completed successfully', time: '2 hours ago' },
              { severity: 'resolved', message: 'Network latency issue resolved', time: '3 hours ago' },
            ]}
            height={height}
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
        return <StackedBarChart segments={mockData.distribution} height={height} />;

      case 'cylinderStatus':
        return <CylinderStatusChart height={height} />;

      default:
        return <div className="flex items-center justify-center h-full text-gray-500 text-sm">Unknown chart type: {chartType}</div>;
    }
  };

  return <>{renderChart()}</>;
}

export type { ChartType };
