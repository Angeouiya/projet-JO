import { ResetPasswordForm } from '@/components/shared/ResetPasswordForm';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const params = await searchParams;
  return <ResetPasswordForm email={params.email || ''} token={params.token || ''} />;
}
