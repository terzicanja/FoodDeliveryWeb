import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { Role } from "@prisma/client";
import type { NextResponse } from "next/server";

const SALT_ROUNDS = 12;
const DEFAULT_TOKEN_EXPIRES_IN: SignOptions["expiresIn"] = "7d";
/** Cookie / session lifetime in seconds (matches default JWT expiry of 7 days). */
const DEFAULT_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const AUTH_COOKIE_NAME = "auth_token";

export type JwtPayload = {
  userId: number;
  role: Role;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is not set. Add it to your .env file before using authentication.",
    );
  }

  return secret;
}

function getTokenExpiresIn(): SignOptions["expiresIn"] {
  return (
    (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"] | undefined) ??
    DEFAULT_TOKEN_EXPIRES_IN
  );
}

function getTokenMaxAgeSeconds(): number {
  const raw = process.env.JWT_MAX_AGE_SECONDS;
  if (!raw) {
    return DEFAULT_TOKEN_MAX_AGE_SECONDS;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_TOKEN_MAX_AGE_SECONDS;
}

/**
 * Hash a plain-text password with bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain-text password against a stored bcrypt hash.
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign a JWT containing the authenticated user's identity.
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: getTokenExpiresIn(),
  });
}

/**
 * Verify a JWT and return its typed payload, or `null` if invalid/expired.
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret());

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof decoded.userId !== "number" ||
      typeof decoded.role !== "string"
    ) {
      return null;
    }

    return {
      userId: decoded.userId,
      role: decoded.role as Role,
    };
  } catch {
    return null;
  }
}

/**
 * Secure defaults for the auth JWT cookie.
 */
export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: getTokenMaxAgeSeconds(),
  };
}

/**
 * Attach the JWT as an HTTP-only cookie on the given response.
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
}

/**
 * Clear the auth cookie (same attributes as set, with maxAge 0).
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    ...getAuthCookieOptions(),
    maxAge: 0,
  });
}
