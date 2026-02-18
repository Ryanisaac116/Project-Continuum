import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/**
 * AdminRoute - Requires ADMIN role
 * Waits for auth to finish loading before making redirect decisions.
 */
const AdminRoute = ({ children }) => {
    const { isAdmin, loading } = useAuth();

    // Wait for auth to finish loading before checking permissions
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default AdminRoute;
