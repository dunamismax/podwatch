import {
  ensureAccessControlBootstrap,
  handleEventsIndex,
  handlePodsCreate,
  handlePodsIndex,
  handleRegister,
} from './api';
import { handleAuthRequest } from './auth';
import { env } from './env';
import { json } from './http';

await ensureAccessControlBootstrap();

const server = Bun.serve({
  port: env.PORT,
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/auth/')) {
      return handleAuthRequest(request);
    }

    if (url.pathname === '/api/register' && request.method === 'POST') {
      return handleRegister(request);
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
