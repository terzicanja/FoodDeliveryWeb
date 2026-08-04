"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseApiError, registerUser } from "@/lib/api/auth-client";
import {
  registerSchema,
  type RegisterInput,
} from "@/lib/validations/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField, TextInput } from "@/components/auth/FormField";

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      address: "",
      phone: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    const response = await registerUser(values);

    if (response.ok) {
      router.push("/login");
      return;
    }

    const body = await parseApiError(response);

    if (body.details) {
      for (const [field, messages] of Object.entries(body.details)) {
        if (
          messages?.[0] &&
          (field === "firstName" ||
            field === "lastName" ||
            field === "email" ||
            field === "password" ||
            field === "address" ||
            field === "phone")
        ) {
          setError(field, { message: messages[0] });
        }
      }
    }

    setServerError(body.error ?? "Registration failed. Please try again.");
  });

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join FoodDelivery and start ordering."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-orange-600 hover:text-orange-700"
          >
            Sign in
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

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First name" error={errors.firstName?.message}>
            <TextInput
              type="text"
              autoComplete="given-name"
              placeholder="Ana"
              hasError={Boolean(errors.firstName)}
              disabled={isSubmitting}
              {...register("firstName")}
            />
          </FormField>

          <FormField label="Last name" error={errors.lastName?.message}>
            <TextInput
              type="text"
              autoComplete="family-name"
              placeholder="Priv"
              hasError={Boolean(errors.lastName)}
              disabled={isSubmitting}
              {...register("lastName")}
            />
          </FormField>
        </div>

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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            hasError={Boolean(errors.password)}
            disabled={isSubmitting}
            {...register("password")}
          />
        </FormField>

        <FormField label="Address" error={errors.address?.message}>
          <TextInput
            type="text"
            autoComplete="street-address"
            placeholder="Main St 1"
            hasError={Boolean(errors.address)}
            disabled={isSubmitting}
            {...register("address")}
          />
        </FormField>

        <FormField label="Phone" error={errors.phone?.message}>
          <TextInput
            type="tel"
            autoComplete="tel"
            placeholder="+385911234567"
            hasError={Boolean(errors.phone)}
            disabled={isSubmitting}
            {...register("phone")}
          />
        </FormField>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-lg bg-orange-600 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
