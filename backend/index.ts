import { handleEventsIndex, handlePodsCreate, handlePodsIndex } from './api';
import { auth } from './auth';
import { env } from './env';
import { json } from './http';
import { ensureAccessControlBootstrap } from './permissions';

await ensureAccessControlBootstrap();

const server = Bun.serve({
  port: env.PORT,
  async fetch(request) {
    const url = new URL(request.url);

    // Better Auth handles all /api/auth/* routes
    if (url.pathname.startsWith('/api/auth')) {
      return auth.handler(request);
    }

    if (url.pathname === '/api/pods' && request.method === 'GET') {
      return handlePodsIndex(request);
    }

    if (url.pathname === '/api/pods' && request.method === 'POST') {
      return handlePodsCreate(request);
    }

    if (url.pathname === '/api/events' && request.method === 'GET') {
      return handleEventsIndex(request);
    }

    if (url.pathname === '/health' && request.method === 'GET') {
      return json({ status: 'ok' });
    }

    return json({ error: 'Not Found' }, 404);
  },
});

console.log(`API listening on ${server.url}`);
