import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const AuthSuccess = () => {
    const { handleOAuthLogin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const token = new URLSearchParams(window.location.search).get("token");

        if (token) {
            // Explicitly store token first as requested
            localStorage.setItem("token", token);

            // Use handleOAuthLogin to ensure state is updated before redirecting
            console.log('[AuthSuccess] Token found, initiating login...');
            handleOAuthLogin(token)
                .then((user) => {
                    console.log('[AuthSuccess] Login successful! Navigating to /app. User:', user);
                    navigate('/app', { replace: true });
                })
                .catch((err) => {
                    console.error('[AuthSuccess] OAuth login failed explicitly:', err);
                    navigate('/login', { replace: true });
                });
        } else {
            navigate('/login', { replace: true });
        }
    }, [handleOAuthLogin, navigate]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black">
            <p className="text-xl font-semibold">Signing you in...</p>
        </div>
    );
};

export default AuthSuccess;
