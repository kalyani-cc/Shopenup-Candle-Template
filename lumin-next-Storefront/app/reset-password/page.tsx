import { ResetPasswordForm } from "@/components/pages/reset-password-form";

type PageProps = {
  searchParams?: {
    token?: string;
    email?: string;
  };
};

export default function ResetPasswordPage({ searchParams }: PageProps) {
  return (
    <ResetPasswordForm initialEmail={searchParams?.email} initialToken={searchParams?.token} />
  );
}
