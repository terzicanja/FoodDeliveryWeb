import { Role } from "@prisma/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyToken, type JwtPayload } from "@/lib/auth";

/**
 * Read and verify the auth JWT from the HTTP-only cookie.
 * Returns `null` when missing or invalid.
 */
export async function getAuthPayload(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

type RoleAuthSuccess = {
  ok: true;
  auth: JwtPayload;
};

type RoleAuthFailure = {
  ok: false;
  response: NextResponse;
};

async function requireRoleAuth(
  role: Role,
  forbiddenMessage: string,
): Promise<RoleAuthSuccess | RoleAuthFailure> {
  const auth = await getAuthPayload();

  if (!auth) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    };
  }

  if (auth.role !== role) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: forbiddenMessage },
        { status: 403 },
      ),
    };
  }

  return { ok: true, auth };
}

/**
 * Require a valid JWT whose role is ADMIN.
 * Returns 401 when unauthenticated, 403 when authenticated but not ADMIN.
 */
export async function requireAdminAuth(): Promise<
  RoleAuthSuccess | RoleAuthFailure
> {
  return requireRoleAuth(Role.ADMIN, "Admin access required");
}

/**
 * Require a valid JWT whose role is COURIER.
 * Returns 401 when unauthenticated, 403 when authenticated but not COURIER.
 */
export async function requireCourierAuth(): Promise<
  RoleAuthSuccess | RoleAuthFailure
> {
  return requireRoleAuth(Role.COURIER, "Courier access required");
}

/**
 * Require a valid JWT whose role is CUSTOMER.
 * Returns 401 when unauthenticated, 403 when authenticated but not CUSTOMER.
 */
export async function requireCustomerAuth(): Promise<
  RoleAuthSuccess | RoleAuthFailure
> {
  return requireRoleAuth(Role.CUSTOMER, "Customer access required");
}
