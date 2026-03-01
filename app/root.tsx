import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import { AuthProvider } from '~/hooks/use-auth';
import './app.css';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </div>
    </AuthProvider>
  );
}
