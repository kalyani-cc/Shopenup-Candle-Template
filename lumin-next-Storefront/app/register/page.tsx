import { AccountAuth } from "@/components/pages/account-auth";

type PageProps = {
  searchParams?: { next?: string };
};

export default function RegisterPage({ searchParams }: PageProps) {
  return <AccountAuth initialMode="signup" redirectTo={searchParams?.next} />;
}
