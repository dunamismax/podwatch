import { Navigate, Outlet } from 'react-router';
import { useAuth } from '~/hooks/use-auth';

export default function GuestLayout() {
  const { status } = useAuth();

  if (status === 'loading') {
    return null;
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
