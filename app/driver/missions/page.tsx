'use client';

import { AppLayout } from '@/components/layouts/app-layout';
import { DriverMissions } from '@/components/driver/driver-missions';

export default function DriverMissionsPage() {
  return (
    <AppLayout allowedRoles={['driver']}>
      <DriverMissions />
    </AppLayout>
  );
}