"use client";

import { useEffect, useState } from "react";
import { ORDER_NOTE_MAX_LENGTH } from "@/lib/validations/orders";

type FailDeliveryDialogProps = {
  open: boolean;
  isSubmitting: boolean;
  error: string | null;
  onConfirm: (failureNote: string) => void;
  onCancel: () => void;
};

export function FailDeliveryDialog({
  open,
  isSubmitting,
  error,
  onConfirm,
  onCancel,
}: FailDeliveryDialogProps) {
  const [failureNote, setFailureNote] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFailureNote("");
      setLocalError(null);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleConfirm = () => {
    const trimmed = failureNote.trim();

    if (!trimmed) {
      setLocalError("Please explain why the delivery failed.");
      return;
    }

    if (trimmed.length > ORDER_NOTE_MAX_LENGTH) {
      setLocalError(
        `Reason must be at most ${ORDER_NOTE_MAX_LENGTH} characters.`,
      );
      return;
    }

    setLocalError(null);
    onConfirm(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4"
      role="presentation"
      onClick={() => {
        if (!isSubmitting) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fail-delivery-dialog-title"
        aria-describedby="fail-delivery-dialog-description"
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="fail-delivery-dialog-title"
          className="text-lg font-semibold tracking-tight text-zinc-900"
        >
          Mark delivery as failed
        </h2>
        <p
          id="fail-delivery-dialog-description"
          className="mt-2 text-sm leading-relaxed text-zinc-600"
        >
          Explain why this delivery could not be completed. The customer will
          see this reason.
        </p>

        <label
          htmlFor="failure-note"
          className="mt-4 block text-sm font-medium text-zinc-700"
        >
          Reason
        </label>
        <textarea
          id="failure-note"
          rows={4}
          value={failureNote}
          disabled={isSubmitting}
          maxLength={ORDER_NOTE_MAX_LENGTH}
          placeholder="Customer did not answer the phone or door after several attempts."
          onChange={(event) => {
            setFailureNote(event.target.value);
            setLocalError(null);
          }}
          className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 disabled:cursor-not-allowed disabled:bg-zinc-50"
        />
        <p className="mt-1 text-xs text-zinc-500">
          {failureNote.trim().length}/{ORDER_NOTE_MAX_LENGTH}
        </p>

        {localError || error ? (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {localError ?? error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Marking failed..." : "Mark as failed"}
          </button>
        </div>
      </div>
    </div>
  );
}
