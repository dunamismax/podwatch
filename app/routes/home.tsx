import { Navigate } from 'react-router';
import { LoadingScreen } from '~/components/loading-screen';
import { useAuth } from '~/hooks/use-auth';

export default function Home() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}
