type ApiFetchOptions = {
  body?: Record<string, unknown>;
  method?: string;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const init: RequestInit = {
    method: options.method ?? 'GET',
    credentials: 'include',
  };

  if (options.body) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(path, init);

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const error = new Error(data?.error ?? response.statusText);
    Object.assign(error, { data, status: response.status });
    throw error;
  }

  return response.json();
}
