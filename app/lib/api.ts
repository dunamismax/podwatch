export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = (await response.json()) as { error?: string };
      if (typeof data.error === 'string' && data.error.length > 0) {
        message = data.error;
      }
    } catch {
      // Ignore body parsing errors and keep the fallback message.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}
