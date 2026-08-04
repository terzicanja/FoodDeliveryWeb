/**
 * Allow only same-origin relative paths for post-login redirects.
 */
export function getSafeRedirectPath(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return null;
  }

  return value;
}
