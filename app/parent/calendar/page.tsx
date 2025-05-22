'use client';

import { AppLayout } from '@/components/layouts/app-layout';
import { ParentCalendar } from '@/components/parent/parent-calendar';

export default function ParentCalendarPage() {
  return (
    <AppLayout allowedRoles={['parent']}>
      <ParentCalendar />
    </AppLayout>
  );
}