'use client';

import { AppLayout } from '@/components/layouts/app-layout';
import { DriverMessages } from '@/components/driver/driver-messages';

export default function DriverMessagesPage() {
  return (
    <AppLayout allowedRoles={['driver']}>
      <DriverMessages />
    </AppLayout>
  );
}