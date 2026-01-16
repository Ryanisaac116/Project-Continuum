import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { disconnectChatSocket } from '../ws/chatSocket';

const LoginPage = () => {
  const [userId, setUserId] = useState('1');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Clear any existing socket connections on mount
  useEffect(() => {
    disconnectChatSocket();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(userId);
      navigate('/app');
    } catch (err) {
      setError('Connection failed. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  const authMode = import.meta.env.VITE_AUTH_MODE;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <Card className="w-full max-w-md">
        <CardHeader
          title={authMode === 'prod' ? 'Sign in with Google' : 'Welcome back'}
          description={
            authMode === 'prod'
              ? 'Use your Google account to access the platform.'
              : 'Enter your Development User ID to continue.'
          }
        />

        {authMode === 'prod' ? (
          <div className="space-y-6 p-6">
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white" disabled>
              Login with Google
            </Button>
            <p className="text-sm text-center text-gray-500">
              Google Authentication is not yet active.
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="User ID"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. 1"
              error={error}
              disabled={isLoading}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default LoginPage;
