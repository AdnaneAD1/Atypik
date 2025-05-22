'use client';

import { AppLayout } from '@/components/layouts/app-layout';
import { DriverCalendar } from '@/components/driver/driver-calendar';

export default function DriverCalendarPage() {
  return (
    <AppLayout allowedRoles={['driver']}>
      <DriverCalendar />
    </AppLayout>
  );
}