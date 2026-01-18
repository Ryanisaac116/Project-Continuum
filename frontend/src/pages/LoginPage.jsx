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

        <div className="space-y-6 p-6">
          <Button
            className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
            onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/google`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
            </svg>
            Sign in with Google
          </Button>

          {authMode !== 'prod' && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-center text-gray-500 mb-4">Development Access</p>
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="User ID"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. 1"
                  error={error}
                  disabled={isLoading}
                />
                <Button type="submit" variant="outline" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Dev Login'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
