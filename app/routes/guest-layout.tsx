import { Navigate, Outlet } from 'react-router';
import { LoadingScreen } from '~/components/loading-screen';
import { useAuth } from '~/hooks/use-auth';

export default function GuestLayout() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
