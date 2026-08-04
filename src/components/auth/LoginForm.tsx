"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginUser, parseApiError } from "@/lib/api/auth-client";
import {
  loginSchema,
  type LoginInput,
} from "@/lib/validations/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField, TextInput } from "@/components/auth/FormField";

type LoginFormProps = {
  redirectTo?: string;
};

export function LoginForm({ redirectTo = "/" }: LoginFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    const response = await loginUser(values);

    if (response.ok) {
      router.push(redirectTo);
      router.refresh();
      return;
    }

    const body = await parseApiError(response);

    if (body.details) {
      for (const [field, messages] of Object.entries(body.details)) {
        if (messages?.[0] && (field === "email" || field === "password")) {
          setError(field, { message: messages[0] });
        }
      }
    }

    setServerError(body.error ?? "Login failed. Please try again.");
  });

  const registerHref =
    redirectTo !== "/"
      ? `/register?next=${encodeURIComponent(redirectTo)}`
      : "/register";

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue ordering."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href={registerHref}
            className="font-medium text-orange-600 hover:text-orange-700"
          >
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {serverError ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {serverError}
          </div>
        ) : null}

        <FormField label="Email" error={errors.email?.message}>
          <TextInput
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            hasError={Boolean(errors.email)}
            disabled={isSubmitting}
            {...register("email")}
          />
        </FormField>

        <FormField label="Password" error={errors.password?.message}>
          <TextInput
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            hasError={Boolean(errors.password)}
            disabled={isSubmitting}
            {...register("password")}
          />
        </FormField>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-lg bg-orange-600 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
