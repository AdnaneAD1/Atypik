'use client';

import { AppLayout } from '@/components/layouts/app-layout';
import { DriverFormations } from '@/components/driver/driver-formations';

export default function DriverFormationsPage() {
  return (
    <AppLayout allowedRoles={['driver']}>
      <DriverFormations />
    </AppLayout>
  );
}