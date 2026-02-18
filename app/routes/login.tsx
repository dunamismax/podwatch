import { signIn, useSession } from 'next-auth/react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function LoginRoute() {
  const navigate = useNavigate();
  const { status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!result || result.error) {
      setError('Invalid credentials.');
      return;
    }

    navigate('/dashboard');
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/85">Auth</p>
        <h1 className="mt-3 text-2xl font-semibold">Sign in</h1>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm text-zinc-300" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-300" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <Button className="w-full" disabled={loading} type="submit">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-zinc-400">
          Need an account?{' '}
          <Link className="text-cyan-300 hover:text-cyan-200" to="/register">
            Register
          </Link>
        </p>
      </Card>
    </main>
  );
}
