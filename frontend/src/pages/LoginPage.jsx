import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { disconnectChatSocket } from '../ws/chatSocket';

const LoginPage = () => {
  const [userId, setUserId] = useState('1');
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Clear any existing socket connections on mount
  useEffect(() => {
    disconnectChatSocket();
  }, []);

  useEffect(() => {
    if (!loading && user) {
      navigate('/app', { replace: true });
    }
  }, [loading, user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(userId);
      navigate('/app');
    } catch (err) {
      const apiMessage = typeof err?.response?.data === 'string'
        ? err.response.data
        : err?.response?.data?.message;
      setError(apiMessage || err?.message || 'Connection failed. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  const authMode = String(import.meta.env.VITE_AUTH_MODE || 'dev').toLowerCase();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{authMode === 'prod' ? 'Sign in with Google' : 'Developer Login'}</CardTitle>
          <CardDescription>
            {authMode === 'prod'
              ? 'Use your Google account to access the platform.'
              : 'Enter your User ID to continue.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {authMode === 'prod' && (
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
              onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/google`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
              </svg>
              Sign in with Google
            </Button>
          )}

          {authMode !== 'prod' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  type="number"
                  min="1"
                  step="1"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. 1"
                  disabled={isLoading}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
