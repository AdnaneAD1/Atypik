import { AuthLayout } from '@/components/layouts/auth-layout';
import { LoginForm } from '@/components/auth/login-form';
// import { InsertRegionsButton } from './InsertRegionsButton';

export default function LoginPage() {
  return (
    <AuthLayout>
      {/* <InsertRegionsButton /> */}
      <LoginForm />
    </AuthLayout>
  );
}