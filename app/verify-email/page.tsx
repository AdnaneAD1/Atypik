import { Suspense } from 'react';
import { AuthLayout } from '@/components/layouts/auth-layout';
import { VerifyEmailForm } from '@/components/auth/verify-email-form';

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
          </div>
        }
      >
        <VerifyEmailForm />
      </Suspense>
    </AuthLayout>
  );
}
