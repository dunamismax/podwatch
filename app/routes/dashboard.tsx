import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardBody } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { useAuth } from '~/hooks/use-auth';
import { apiFetch } from '~/lib/api';
import { getApiErrorMessage } from '~/lib/api-error';

type Pod = {
  description: string | null;
  id: number;
  name: string;
  role: 'member' | 'owner';
};

type EventRecord = {
  id: number;
  location: string | null;
  podName: string | null;
  scheduledFor: string | null;
  title: string;
};

type DashboardData = {
  events: EventRecord[];
  pods: Pod[];
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [podName, setPodName] = useState('');
  const [podDescription, setPodDescription] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canCreatePod = podName.trim().length >= 2;

  const fetchData = useCallback(async () => {
    try {
      const [podsRes, eventsRes] = await Promise.all([
        apiFetch<{ pods: Pod[] }>('/api/pods'),
        apiFetch<{ events: EventRecord[] }>('/api/events'),
      ]);
      setData({ pods: podsRes.pods, events: eventsRes.events });
      setFetchError(null);
    } catch (err) {
      setFetchError(getApiErrorMessage(err, 'Failed to load dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreatePod(event: FormEvent) {
    event.preventDefault();
    setActionError(null);
    setSaving(true);

    try {
      await apiFetch('/api/pods', {
        method: 'POST',
        body: { name: podName, description: podDescription },
      });
      setPodName('');
      setPodDescription('');
      await fetchData();
    } catch (caught) {
      setActionError(getApiErrorMessage(caught, 'Failed to create pod.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const displayError = actionError ?? fetchError;

  return (
    <main className="space-y-6 py-4">
      <header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[color:var(--pod-panel-strong)] p-6 shadow-2xl shadow-cyan-950/20 ring-1 ring-white/5 backdrop-blur sm:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <Badge color="info" variant="soft" className="rounded-full px-3 py-1">
              Control Center
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                PodDashboard
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Pods, events, and the mildly suspicious confidence that comes from having the
                schedule in one place.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Signed in as</p>
              <p className="mt-1 text-sm font-medium text-slate-100">{session?.email}</p>
            </div>
            <Button
              className="justify-center"
              color="neutral"
              variant="soft"
              size="lg"
              onClick={handleSignOut}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {displayError && (
        <p className="rounded-2xl border border-rose-400/35 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          {displayError}
        </p>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
        <Card>
          <CardBody>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-200/80">
                Workspace
              </p>
              <div>
                <h2 className="text-2xl font-semibold text-white">Create a pod</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Start a new pod, become the owner, and stop organizing group logistics from
                  memory.
                </p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleCreatePod}>
              <div className="space-y-2">
                <label className="text-sm text-slate-200" htmlFor="pod-name">
                  Pod name
                </label>
                <Input
                  id="pod-name"
                  placeholder="Friday Pod"
                  value={podName}
                  onChange={(e) => setPodName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-200" htmlFor="pod-description">
                  Description
                </label>
                <Textarea
                  id="pod-description"
                  rows={4}
                  placeholder="Casual commander table, bring sleeves and snacks."
                  value={podDescription}
                  onChange={(e) => setPodDescription(e.target.value)}
                />
              </div>

              <Button
                className="w-full justify-center"
                size="xl"
                disabled={!canCreatePod}
                loading={saving}
                type="submit"
              >
                Create pod
              </Button>
            </form>
          </CardBody>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardBody className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200/80">
                    Membership
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Your pods</h2>
                </div>
                <Badge color="neutral" variant="outline" className="rounded-full px-3 py-1">
                  {data?.pods.length ?? 0} total
                </Badge>
              </div>

              {loading ? (
                <div className="text-sm text-slate-300">Loading pods...</div>
              ) : !data?.pods.length ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-300">
                  No pods yet. Create the first one and the dashboard stops feeling like an
                  abandoned bridge.
                </div>
              ) : (
                <ul className="grid gap-3">
                  {data.pods.map((pod) => (
                    <li
                      key={pod.id}
                      className="rounded-3xl border border-white/10 bg-slate-950/30 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-white">{pod.name}</p>
                          {pod.description && (
                            <p className="mt-1 text-sm leading-6 text-slate-300">
                              {pod.description}
                            </p>
                          )}
                        </div>
                        <Badge
                          color={pod.role === 'owner' ? 'warning' : 'neutral'}
                          variant="soft"
                          className="rounded-full"
                        >
                          {pod.role}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200/80">
                  Schedule
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Upcoming events</h2>
              </div>

              {loading ? (
                <div className="text-sm text-slate-300">Loading events...</div>
              ) : !data?.events.length ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-300">
                  No upcoming events. Quiet is fine, but now you know it is quiet on purpose.
                </div>
              ) : (
                <ul className="grid gap-3 lg:grid-cols-2">
                  {data.events.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-3xl border border-white/10 bg-slate-950/30 p-4"
                    >
                      <div className="space-y-2">
                        <p className="text-base font-semibold text-white">{event.title}</p>
                        <p className="text-sm leading-6 text-slate-300">
                          {event.podName ?? 'Unknown pod'}
                        </p>
                        <p className="text-sm text-slate-400">
                          {event.scheduledFor
                            ? new Date(event.scheduledFor).toLocaleString()
                            : 'TBD'}
                        </p>
                        {event.location && (
                          <p className="text-xs uppercase tracking-[0.2em] text-amber-200/75">
                            {event.location}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </section>
    </main>
  );
}
