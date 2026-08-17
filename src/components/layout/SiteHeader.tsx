"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartProvider";
import { fetchCurrentUser, logoutUser } from "@/lib/api/auth-client";

type AuthStatus = "loading" | "authenticated" | "guest";

export function SiteHeader() {
  const router = useRouter();
  const { itemCount, isReady } = useCart();
  const badgeCount = isReady ? itemCount : 0;
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAuth() {
      const response = await fetchCurrentUser();

      if (cancelled) {
        return;
      }

      if (!response.ok) {
        setAuthStatus("guest");
        setUserRole(null);
        return;
      }

      const body = (await response.json()) as { user: { role: string } };
      setAuthStatus("authenticated");
      setUserRole(body.user.role);
    }

    void loadAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await logoutUser();
      setAuthStatus("guest");
      setUserRole(null);
      router.push("/");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="shrink-0 text-lg font-semibold tracking-tight text-orange-600"
        >
          FoodDelivery
        </Link>

        <nav className="flex items-center gap-1.5 text-sm sm:gap-3">
          {authStatus === "authenticated" && userRole === "ADMIN" ? (
            <Link
              href="/admin"
              className="rounded-lg px-2.5 py-2 font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 sm:px-3"
            >
              Admin
            </Link>
          ) : null}

          {authStatus === "authenticated" && userRole === "COURIER" ? (
            <Link
              href="/courier"
              className="rounded-lg px-2.5 py-2 font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 sm:px-3"
            >
              Courier
            </Link>
          ) : null}

          {authStatus === "authenticated" ? (
            <Link
              href="/orders"
              className="rounded-lg px-2.5 py-2 font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 sm:px-3"
            >
              <span className="sm:hidden">Orders</span>
              <span className="hidden sm:inline">My Orders</span>
            </Link>
          ) : null}

          <Link
            href="/cart"
            className="relative inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 sm:px-3"
            aria-label={`Cart with ${badgeCount} items`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="20" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="17" cy="20" r="1.2" fill="currentColor" stroke="none" />
              <path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.2L20 8H7" />
            </svg>
            <span className="hidden sm:inline">Cart</span>
            {badgeCount > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-orange-600 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white">
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            ) : null}
          </Link>

          {authStatus === "authenticated" ? (
            <button
              type="button"
              onClick={() => {
                void handleLogout();
              }}
              disabled={isLoggingOut}
              className="rounded-lg px-2.5 py-2 font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3"
            >
              {isLoggingOut ? "Signing out..." : "Log out"}
            </button>
          ) : authStatus === "guest" ? (
            <>
              <Link
                href="/login"
                className="hidden font-medium text-zinc-600 transition hover:text-zinc-900 sm:inline"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-orange-600 px-2.5 py-2 font-semibold text-white transition hover:bg-orange-700 sm:px-3"
              >
                <span className="sm:hidden">Join</span>
                <span className="hidden sm:inline">Create account</span>
              </Link>
            </>
          ) : (
            <div className="h-9 w-20 animate-pulse rounded-lg bg-zinc-100" />
          )}
        </nav>
      </div>
    </header>
  );
}
