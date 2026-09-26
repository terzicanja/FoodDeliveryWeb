"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  deleteAdminUser,
  fetchAdminUsers,
  type AdminUserDto,
} from "@/lib/api/admin-client";
import { formatOrderDate, formatRole } from "@/lib/format";

type ViewStatus = "loading" | "ready" | "unauthenticated" | "forbidden" | "error";

function deletionBlockReason(user: AdminUserDto): string | null {
  if (user.isSelf) {
    return "You cannot delete your own account.";
  }

  const blockers: string[] = [];

  if (user.customerOrderCount > 0) {
    blockers.push("orders");
  }

  if (user.reviewCount > 0) {
    blockers.push("reviews");
  }

  if (user.courierOrderCount > 0) {
    blockers.push("courier assignments");
  }

  if (blockers.length === 0) {
    return null;
  }

  return `Cannot delete while related ${blockers.join(", ")} exist.`;
}

export function AdminUsersView() {
  const router = useRouter();
  const [status, setStatus] = useState<ViewStatus>("loading");
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<AdminUserDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      const result = await fetchAdminUsers();

      if (cancelled) {
        return;
      }

      if (!result.ok) {
        if (result.status === 401) {
          setStatus("unauthenticated");
          router.replace("/login?next=/admin");
          return;
        }

        if (result.status === 403) {
          setStatus("forbidden");
          return;
        }

        setError(result.error);
        setStatus("error");
        return;
      }

      setUsers(result.users);
      setStatus("ready");
    }

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleDelete = async () => {
    if (!pendingUser || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setActionError(null);

    try {
      const result = await deleteAdminUser(pendingUser.id);

      if (!result.ok) {
        setActionError(result.error);
        setPendingUser(null);
        return;
      }

      setUsers((current) => current.filter((user) => user.id !== pendingUser.id));
      setSuccess(`${pendingUser.firstName} ${pendingUser.lastName} was deleted.`);
      setPendingUser(null);
    } catch {
      setActionError("Could not delete the user.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
        {status === "unauthenticated"
          ? "Redirecting to login..."
          : "Loading users..."}
      </div>
    );
  }

  if (status === "forbidden") {
    return <AdminAccessDenied />;
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <p className="text-sm text-red-700">{error ?? "Could not load users."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
          Users
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          View registered accounts. Users with orders, reviews, or courier
          assignments cannot be deleted.
        </p>
      </div>

      {success ? (
        <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {success}
        </p>
      ) : null}

      {actionError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      ) : null}

      {users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
          <h3 className="text-lg font-semibold tracking-tight text-zinc-900">
            No users yet
          </h3>
          <p className="mt-2 text-sm text-zinc-500">
            Registered accounts will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {users.map((user) => {
            const blockReason = deletionBlockReason(user);

            return (
              <li
                key={user.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-zinc-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-zinc-600">{user.email}</p>
                    <p className="text-sm text-zinc-500">
                      {formatRole(user.role)}
                      {user.isSelf ? " · your account" : ""}
                    </p>
                    <p className="text-sm text-zinc-500">{user.phone}</p>
                    <p className="text-sm text-zinc-500">{user.address}</p>
                    <p className="text-xs text-zinc-400">
                      Joined {formatOrderDate(user.createdAt)}
                    </p>
                    {blockReason ? (
                      <p className="pt-1 text-sm text-amber-700">{blockReason}</p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    disabled={Boolean(blockReason) || isDeleting}
                    onClick={() => {
                      setActionError(null);
                      setSuccess(null);
                      setPendingUser(user);
                    }}
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-red-200 px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={pendingUser !== null}
        title="Delete user?"
        description={
          pendingUser
            ? `Delete ${pendingUser.firstName} ${pendingUser.lastName}? This cannot be undone.`
            : ""
        }
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        onConfirm={() => {
          void handleDelete();
        }}
        onCancel={() => {
          if (!isDeleting) {
            setPendingUser(null);
          }
        }}
      />
    </div>
  );
}
