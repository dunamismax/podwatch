import { Navigate, Outlet } from 'react-router';
import { useAuth } from '~/hooks/use-auth';

export default function AuthLayout() {
  const { status } = useAuth();

  if (status === 'loading') {
    return null;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
