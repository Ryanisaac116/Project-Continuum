import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const OAuthSuccess = () => {
    const [searchParams] = useSearchParams();
    const { handleOAuthLogin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            handleOAuthLogin(token)
                .then(() => {
                    navigate('/app');
                })
                .catch((err) => {
                    console.error('OAuth login failed:', err);
                    navigate('/login?error=oauth_failed');
                });
        } else {
            navigate('/login');
        }
    }, [searchParams, handleOAuthLogin, navigate]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black">
            <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Authenticating...</h2>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
        </div>
    );
};

export default OAuthSuccess;
