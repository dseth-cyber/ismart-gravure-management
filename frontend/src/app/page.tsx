'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { DashboardGrid } from '@/components/dashboard/dashboard-grid';

export default function Home() {
  return (
    <AppLayout>
      <DashboardGrid />
    </AppLayout>
  );
}
