import { signOut, useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';

type Pod = {
  id: number;
  name: string;
  description: string | null;
  role: 'owner' | 'member';
};

type Event = {
  id: number;
  podName: string | null;
  title: string;
  location: string | null;
  scheduledFor: string | null;
};

export default function DashboardRoute() {
  const navigate = useNavigate();
  const { data: session, status } = useSession();
  const [pods, setPods] = useState<Pod[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const userEmail = useMemo(() => session?.user?.email ?? null, [session]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/login');
    }
  }, [navigate, status]);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    Promise.all([
      apiFetch<{ pods: Pod[] }>('/api/pods'),
      apiFetch<{ events: Event[] }>('/api/events'),
    ])
      .then(([podsResponse, eventsResponse]) => {
        setPods(podsResponse.pods);
        setEvents(eventsResponse.events);
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : 'Failed to load dashboard data.');
      });
  }, [status]);

  async function createPod(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await apiFetch<{ pod: Pod }>('/api/pods', {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      });

      setPods((current) => [response.pod, ...current]);
      setName('');
      setDescription('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to create pod.');
    } finally {
      setSaving(false);
    }
  }

  if (status === 'loading') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10">
        <p className="text-zinc-400">Loading session...</p>
      </main>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-zinc-900/50 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/85">
            Control Center
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Magic Pod Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">{userEmail}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/register">Invite Member</Link>
          </Button>
          <Button variant="ghost" onClick={() => signOut({ callbackUrl: '/login' })}>
            Sign out
          </Button>
        </div>
      </header>

      {error ? (
        <p className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/85">
            Workspace
          </p>
          <h2 className="mt-2 text-lg font-semibold">Create a pod</h2>
          <p className="mt-2 text-sm text-zinc-400">Set up a new pod and join as owner.</p>

          <form className="mt-6 space-y-4" onSubmit={createPod}>
            <div>
              <label className="mb-2 block text-sm text-zinc-300" htmlFor="name">
                Pod name
              </label>
              <Input
                id="name"
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Friday Pod"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300" htmlFor="description">
                Description
              </label>
              <Input
                id="description"
                maxLength={500}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Casual commander table"
              />
            </div>

            <Button className="w-full" disabled={saving} type="submit">
              {saving ? 'Creating pod...' : 'Create pod'}
            </Button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/85">
            Membership
          </p>
          <h2 className="mt-2 text-lg font-semibold">Your pods</h2>

          {pods.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">No pods yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {pods.map((pod) => (
                <li key={pod.id} className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
                  <p className="text-sm font-semibold">{pod.name}</p>
                  {pod.description ? (
                    <p className="mt-1 text-sm text-zinc-400">{pod.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/85">
            Schedule
          </p>
          <h2 className="mt-2 text-lg font-semibold">Upcoming events</h2>

          {events.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">No upcoming events.</p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4"
                >
                  <p className="text-sm font-semibold">{event.title}</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {event.podName ?? 'Unknown pod'}{' '}
                    {event.scheduledFor ? `· ${new Date(event.scheduledFor).toLocaleString()}` : ''}
                  </p>
                  {event.location ? (
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-zinc-500">
                      {event.location}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </main>
  );
}
