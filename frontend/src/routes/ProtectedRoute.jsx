import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

export default ProtectedRoute;
