import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './routes/ProtectedRoute';
import { PageContainer } from './components/layout/PageContainer';
import { Card, CardHeader } from './components/ui/Card';
import { Badge } from './components/ui/Badge';
import { Button } from './components/ui/Button';
import { useAuth } from './auth/AuthContext';
import ExchangesPage from './pages/ExchangesPage';
import FriendsPage from './pages/FriendsPage';
import ChatPage from './pages/ChatPage';
import { useTabPresence } from './hooks/useTabPresence';

/* ======================
   Home Page
   ====================== */
const HomePage = () => {
  const { user } = useAuth();

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <Badge status={user.presenceStatus}>{user.presenceStatus}</Badge>
        </div>

        <Card>
          <CardHeader
            title={`Welcome back, ${user.name}`}
            description="Your daily summary"
          />
          <div className="text-sm text-gray-600">
            <p>This is the placeholder dashboard using the new Design System.</p>
            <div className="mt-4">
              <Button variant="secondary" size="sm">
                Action Placeholder
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

/* ======================
   App with Tab Presence
   ====================== */
function AppContent() {
  // Tab-aware presence: ONLINE when focused, OFFLINE when hidden
  useTabPresence();

  const { user } = useAuth();

  // Connect WebSocket app-wide for session invalidation events
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && user) {
      // Import and connect chatSocket for session events
      import('./ws/chatSocket').then(({ connectChatSocket }) => {
        connectChatSocket(
          token,
          () => { }, // Empty message callback - just need session subscription
          () => console.log('[App] WebSocket connected for session events'),
          () => { }
        );
      });
    }
  }, [user]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/exchanges/*"
        element={
          <ProtectedRoute>
            <ExchangesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/friends"
        element={
          <ProtectedRoute>
            <FriendsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat/:friendId"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all MUST be last */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
