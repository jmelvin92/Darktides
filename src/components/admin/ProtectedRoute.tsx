import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isAdmin, loading } = useAuth();

  console.log('ProtectedRoute check:', { user: user?.email, isAdmin, loading });

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    console.log('Access denied - redirecting to login', { hasUser: !!user, isAdmin });
    return <Navigate to="/admin/login" replace />;
  }

  console.log('Access granted to admin panel');
  return <>{children}</>;
}

export default ProtectedRoute;