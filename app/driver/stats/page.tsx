'use client';

import { AppLayout } from '@/components/layouts/app-layout';
import { DriverStats } from '@/components/driver/driver-stats';

export default function DriverStatsPage() {
  return (
    <AppLayout allowedRoles={['driver']}>
      <DriverStats />
    </AppLayout>
  );
}