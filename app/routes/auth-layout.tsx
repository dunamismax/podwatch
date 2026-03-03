import { Navigate, Outlet } from 'react-router';
import { LoadingScreen } from '~/components/loading-screen';
import { useAuth } from '~/hooks/use-auth';

export default function AuthLayout() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
