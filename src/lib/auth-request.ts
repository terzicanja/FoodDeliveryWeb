import { cookies } from "next/headers";
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
