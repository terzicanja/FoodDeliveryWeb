import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSafeRedirectPath } from "@/lib/auth-redirect";

export const metadata: Metadata = {
  title: "Login | FoodDelivery",
  description: "Sign in to your FoodDelivery account.",
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = getSafeRedirectPath(params.next) ?? "/";

  return <LoginForm redirectTo={redirectTo} />;
}
