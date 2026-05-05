import { AccountAuth } from "@/components/pages/account-auth";

type PageProps = {
  searchParams?: { next?: string };
};

export default function LoginPage({ searchParams }: PageProps) {
  return <AccountAuth initialMode="login" redirectTo={searchParams?.next} />;
}
