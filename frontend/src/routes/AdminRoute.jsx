import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/**
 * AdminRoute - Requires ADMIN role
 * Waits for auth to finish loading before making redirect decisions.
 */
const AdminRoute = ({ children }) => {
    const { isAdmin, loading, user } = useAuth();

    // Debug logging
    console.log('[AdminRoute] loading:', loading, 'isAdmin:', isAdmin, 'user:', user?.id, 'role:', user?.role);

    // Wait for auth to finish loading before checking permissions
    if (loading) {
        console.log('[AdminRoute] Still loading, showing spinner');
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isAdmin) {
        console.log('[AdminRoute] Not admin, redirecting to /unauthorized');
        return <Navigate to="/unauthorized" replace />;
    }

    console.log('[AdminRoute] Admin access granted');
    return children;
};

export default AdminRoute;

