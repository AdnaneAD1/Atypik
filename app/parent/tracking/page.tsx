'use client';

import { AppLayout } from '@/components/layouts/app-layout';
import { ParentTracking } from '@/components/parent/parent-tracking';

export default function ParentTrackingPage() {
  return (
    <AppLayout allowedRoles={['parent']}>
      <ParentTracking />
    </AppLayout>
  );
}