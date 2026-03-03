export type Pod = {
  description: string | null;
  id: number;
  name: string;
  role: 'member' | 'owner';
};

export type EventRecord = {
  id: number;
  location: string | null;
  podName: string | null;
  scheduledFor: string | null;
  title: string;
};

export type SessionUser = {
  email: string;
  id: string;
  name: string | null;
};
