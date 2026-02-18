import { signIn, useSession } from 'next-auth/react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';

export default function RegisterRoute() {
  const navigate = useNavigate();
  const { status } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiFetch('/api/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          passwordConfirmation,
        }),
      });

      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!signInResult || signInResult.error) {
        throw new Error('Account created, but sign in failed. Please sign in manually.');
      }

      navigate('/dashboard');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/85">Auth</p>
        <h1 className="mt-3 text-2xl font-semibold">Create account</h1>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm text-zinc-300" htmlFor="name">
              Name
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

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

          <div>
            <label className="mb-2 block text-sm text-zinc-300" htmlFor="passwordConfirmation">
              Confirm password
            </label>
            <Input
              id="passwordConfirmation"
              name="passwordConfirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              required
            />
          </div>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <Button className="w-full" disabled={loading} type="submit">
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-zinc-400">
          Already have an account?{' '}
          <Link className="text-cyan-300 hover:text-cyan-200" to="/login">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
