type CookieJar = Map<string, string>;

const apiUrl = process.env.SMOKE_API_URL ?? 'http://localhost:3001';
const appUrl = process.env.SMOKE_APP_URL ?? 'http://localhost:3000';
const seededEmail = process.env.SMOKE_SEEDED_EMAIL ?? 'test@example.com';
const seededPassword = process.env.SMOKE_SEEDED_PASSWORD ?? 'password';
const uniqueSuffix = Date.now();
const registeredEmail = `smoke-${uniqueSuffix}@example.com`;
const registeredPassword = 'password123';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function applySetCookie(jar: CookieJar, response: Response) {
  const getSetCookie = Reflect.get(response.headers, 'getSetCookie');
  const values =
    typeof getSetCookie === 'function'
      ? (getSetCookie.call(response.headers) as string[])
      : response.headers.get('set-cookie')
        ? [response.headers.get('set-cookie') as string]
        : [];

  for (const header of values) {
    const [cookie = ''] = header.split(';', 1);
    const [rawName, ...rawValue] = cookie.split('=');
    const name = rawName?.trim() ?? '';

    if (!name) {
      continue;
    }

    const value = rawValue.join('=');

    if (value.length === 0) {
      jar.delete(name);
      continue;
    }

    jar.set(name, value);
  }
}

function serializeCookies(jar: CookieJar): string | undefined {
  if (jar.size === 0) {
    return undefined;
  }

  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
}

async function request(
  jar: CookieJar,
  baseUrl: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  const cookieHeader = serializeCookies(jar);

  if (cookieHeader) {
    headers.set('cookie', cookieHeader);
  }

  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(new URL(path, baseUrl), {
    ...init,
    headers,
    redirect: 'manual',
  });

  applySetCookie(jar, response);
  return response;
}

async function main() {
  const jar = new Map<string, string>();

  // Check session is empty for anonymous user
  let response = await request(jar, apiUrl, '/api/auth/get-session');
  assert(response.ok, 'Anonymous session request failed.');

  // Sign in with seeded user
  response = await request(jar, apiUrl, '/api/auth/sign-in/email', {
    method: 'POST',
    body: JSON.stringify({
      email: seededEmail,
      password: seededPassword,
    }),
  });
  assert(response.ok, 'Seeded user login failed.');

  // Verify session persists
  response = await request(jar, apiUrl, '/api/auth/get-session');
  const sessionData = (await response.json()) as { session: unknown; user: { email: string } };
  assert(sessionData.user?.email === seededEmail, 'Seeded user session did not persist.');

  // Check dashboard renders
  response = await request(jar, appUrl, '/dashboard');
  const dashboardHtml = await response.text();
  assert(response.status === 200, 'Authenticated dashboard request should return 200.');
  assert(
    dashboardHtml.includes('PodDashboard'),
    'Dashboard response did not render the app shell.',
  );

  // Check business API endpoints work with session
  response = await request(jar, apiUrl, '/api/pods');
  assert(response.ok, 'Seeded user pod list failed.');

  response = await request(jar, apiUrl, '/api/events');
  assert(response.ok, 'Seeded user event list failed.');

  // Create a pod
  response = await request(jar, apiUrl, '/api/pods', {
    method: 'POST',
    body: JSON.stringify({
      name: `Smoke Pod ${uniqueSuffix}`,
      description: 'Created by the smoke check.',
    }),
  });
  assert(response.status === 201, 'Seeded user pod creation failed.');

  // Sign out
  response = await request(jar, apiUrl, '/api/auth/sign-out', {
    method: 'POST',
  });
  assert(response.ok, 'Seeded user sign-out failed.');

  // Register a new user
  response = await request(jar, apiUrl, '/api/auth/sign-up/email', {
    method: 'POST',
    body: JSON.stringify({
      email: registeredEmail,
      name: 'Smoke User',
      password: registeredPassword,
    }),
  });
  assert(response.ok, 'User registration failed.');

  // Verify registered user has a session
  response = await request(jar, apiUrl, '/api/auth/get-session');
  const regSession = (await response.json()) as { session: unknown; user: { email: string } };
  assert(regSession.user?.email === registeredEmail, 'Registered user session did not persist.');

  // Registered user can create a pod
  response = await request(jar, apiUrl, '/api/pods', {
    method: 'POST',
    body: JSON.stringify({
      name: `Smoke Member Pod ${uniqueSuffix}`,
      description: 'Created by the registered member.',
    }),
  });
  assert(response.status === 201, 'Registered member pod creation failed.');

  console.log(`Smoke check passed against ${apiUrl}`);
}

main().catch((error) => {
  console.error('Smoke check failed.');
  console.error(error);
  process.exitCode = 1;
});
