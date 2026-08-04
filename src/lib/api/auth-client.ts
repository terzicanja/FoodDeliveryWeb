export type ApiErrorBody = {
  error?: string;
  details?: Record<string, string[] | undefined>;
};

export async function parseApiError(response: Response): Promise<ApiErrorBody> {
  try {
    return (await response.json()) as ApiErrorBody;
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function registerUser(data: unknown) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return response;
}

export async function loginUser(data: unknown) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  return response;
}

export async function fetchCurrentUser() {
  return fetch("/api/auth/me", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
}

export async function logoutUser() {
  return fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}

