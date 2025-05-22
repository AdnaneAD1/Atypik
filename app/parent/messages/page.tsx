'use client';

import { AppLayout } from '@/components/layouts/app-layout';
import { ParentMessages } from '@/components/parent/parent-messages';

export default function ParentMessagesPage() {
  return (
    <AppLayout allowedRoles={['parent']}>
      <ParentMessages />
    </AppLayout>
  );
}