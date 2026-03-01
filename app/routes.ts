import { index, layout, type RouteConfig, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  layout('routes/guest-layout.tsx', [
    route('login', 'routes/login.tsx'),
    route('register', 'routes/register.tsx'),
  ]),
  layout('routes/auth-layout.tsx', [route('dashboard', 'routes/dashboard.tsx')]),
] satisfies RouteConfig;
