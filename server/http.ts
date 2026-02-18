export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function parseCookies(request: Request): Map<string, string> {
  const header = request.headers.get('cookie');
  const map = new Map<string, string>();

  if (!header) {
    return map;
  }

  for (const chunk of header.split(';')) {
    const [key, ...valueParts] = chunk.trim().split('=');
    if (!key) {
      continue;
    }

    map.set(key, decodeURIComponent(valueParts.join('=')));
  }

  return map;
}
