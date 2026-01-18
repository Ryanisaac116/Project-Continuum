import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';

/**
 * ProtectedRoute - Requires authentication and wraps with AppLayout
 * @param {boolean} noLayout - Skip AppLayout wrapping (for pages with custom layouts)
 */
const ProtectedRoute = ({ children, noLayout = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Skip layout for pages with custom layouts (e.g., ChatPage)
  if (noLayout) {
    return children;
  }

  return <AppLayout>{children}</AppLayout>;
};

export default ProtectedRoute;
