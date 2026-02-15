import React from 'react';
import { Button } from "@/components/ui/button"
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const UnauthorizedPage = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="text-center max-w-md">
                <h1 className="text-6xl font-bold text-red-500 mb-4">403</h1>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Access Denied
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    You don't have permission to access this page.
                </p>

                {/* Show current user info to help debug */}
                {user && (
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 rounded-lg p-4 mb-6 text-left">
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Current Session:
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            User ID: <strong>{user.id}</strong> | Role: <strong>{user.role || 'USER'}</strong>
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                            💡 Admin access requires User ID 1. Log out and log in as User 1.
                        </p>
                    </div>
                )}



                <div className="space-x-4">
                    <Button
                        variant="secondary"
                        onClick={() => navigate(-1)}
                        className="px-6"
                    >
                        Go Back
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleLogout}
                        className="px-6"
                    >
                        Logout & Switch User
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default UnauthorizedPage;

