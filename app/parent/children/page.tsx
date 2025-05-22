'use client';

import { AppLayout } from '@/components/layouts/app-layout';
import { ParentChildren } from '@/components/parent/parent-children';

export default function ParentChildrenPage() {
  return (
    <AppLayout allowedRoles={['parent']}>
      <ParentChildren />
    </AppLayout>
  );
}