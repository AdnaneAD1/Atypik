import { Suspense } from 'react';
import { AuthLayout } from '@/components/layouts/auth-layout';
import { VerifyEmailForm } from '@/components/auth/verify-email-form';
import { CarLoader } from '@/components/ui/loader';

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <CarLoader size={130} />
          </div>
        }
      >
        <VerifyEmailForm />
      </Suspense>
    </AuthLayout>
  );
}
