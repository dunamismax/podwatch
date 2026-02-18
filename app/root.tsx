import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

import './app.css';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <SessionProvider>{children}</SessionProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
