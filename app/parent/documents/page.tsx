'use client';

import { AppLayout } from '@/components/layouts/app-layout';
import { ParentDocuments } from '@/components/parent/parent-documents';

export default function ParentDocumentsPage() {
  return (
    <AppLayout allowedRoles={['parent']}>
      <ParentDocuments />
    </AppLayout>
  );
}