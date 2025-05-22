import { AppLayout } from '@/components/layouts/app-layout';
import { ParentDashboard } from '@/components/parent/parent-dashboard';

export default function ParentDashboardPage() {
  return (
    <AppLayout allowedRoles={['parent']}>
      <ParentDashboard />
    </AppLayout>
  );
}