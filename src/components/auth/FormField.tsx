import type { InputHTMLAttributes, ReactNode } from "react";

type FormFieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-700">{label}</label>
      {children}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

export function TextInput({ hasError, className = "", ...props }: TextInputProps) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 ${
        hasError ? "border-red-400" : "border-zinc-300"
      } ${className}`}
    />
  );
}
