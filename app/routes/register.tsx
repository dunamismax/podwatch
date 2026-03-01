import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '~/components/ui/button';
import { Card, CardBody } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { useAuth } from '~/hooks/use-auth';
import { apiFetch } from '~/lib/api';
import { getApiErrorMessage } from '~/lib/api-error';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      await apiFetch('/api/register', {
        method: 'POST',
        body: { name, email, password, passwordConfirmation },
      });
      await signIn({ email, password });
      navigate('/dashboard');
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Registration failed.'));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
      <Card className="w-full max-w-xl shadow-2xl shadow-amber-950/30">
        <CardBody className="space-y-6 p-8 sm:p-9">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/85">
              New Crew
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-white">Create account</h1>
              <p className="text-sm text-slate-300">
                Join the dashboard, claim your seat, and keep the pod list from becoming folklore.
              </p>
            </div>
          </div>

          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm text-slate-200" htmlFor="name">
                Name
              </label>
              <Input
                id="name"
                placeholder="Test User"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm text-slate-200" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="test@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-200" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-200" htmlFor="passwordConfirmation">
                Confirm password
              </label>
              <Input
                id="passwordConfirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
              />
            </div>

            {error && (
              <p className="rounded-2xl border border-rose-400/35 bg-rose-950/40 px-3 py-2 text-sm text-rose-200 sm:col-span-2">
                {error}
              </p>
            )}

            <div className="sm:col-span-2">
              <Button className="w-full justify-center" size="xl" loading={pending} type="submit">
                Create account
              </Button>
            </div>
          </form>

          <p className="text-sm text-slate-300">
            Already have an account?{' '}
            <Link className="font-medium text-cyan-300 transition hover:text-cyan-200" to="/login">
              Sign in
            </Link>
          </p>
        </CardBody>
      </Card>
    </main>
  );
}
