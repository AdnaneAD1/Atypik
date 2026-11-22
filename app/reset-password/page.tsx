import { Suspense } from 'react';
import { AuthLayout } from '@/components/layouts/auth-layout';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { CarLoader } from '@/components/ui/loader';

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <CarLoader size={130} />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
