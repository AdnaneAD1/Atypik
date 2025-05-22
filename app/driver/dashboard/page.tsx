import { AppLayout } from '@/components/layouts/app-layout';
import { DriverDashboard } from '@/components/driver/driver-dashboard';

export default function DriverDashboardPage() {
  return (
    <AppLayout allowedRoles={['driver']}>
      <DriverDashboard />
    </AppLayout>
  );
}