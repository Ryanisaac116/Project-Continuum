import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { RealTimeProvider } from './context/RealTimeContext';
import { DialogProvider } from './context/DialogContext';
import { CallProvider, useCall } from './context/CallContext';
import * as ThemeContext from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import HomePage from './pages/HomePage';
import ProtectedRoute from './routes/ProtectedRoute';
import { useAuth } from './auth/AuthContext';
import ExchangesPage from './pages/ExchangesPage';
import FriendsPage from './pages/FriendsPage';
import ChatPage from './pages/ChatPage';
import CallOverlay from './components/CallOverlay';
import ToastContainer from './components/ToastContainer';
import { useTabPresence } from './hooks/useTabPresence';
import LandingPage from './pages/LandingPage';
import AuthSuccess from './pages/AuthSuccess';
import UnauthorizedPage from './pages/UnauthorizedPage';
import AdminRoute from './routes/AdminRoute';
import AdminPage from './pages/AdminPage';

/* ======================
   App with Tab Presence
   ====================== */
function AppContent() {
  const { isCallActive } = useCall();

  // Tab-aware presence: ONLINE when focused, OFFLINE when hidden
  // BUT stay ONLINE if in an active call
  useTabPresence(isCallActive);

  const { user } = useAuth();

  return (
    <>
      {/* Global call overlay for incoming/outgoing/active calls */}
      {user && <CallOverlay userId={user.id} />}

      {/* Global toast notifications */}
      {user && <ToastContainer />}

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/success" element={<AuthSuccess />} />

        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected routes - ProtectedRoute wraps with AppLayout */}
        <Route
          path="/app"
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
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
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

        {/* ChatPage has its own full-screen layout, skip AppLayout */}
        <Route
          path="/chat/:friendId"
          element={
            <ProtectedRoute noLayout>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Page - uses main AppLayout, requires ADMIN role */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        {/* Unauthorized Page */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Catch-all MUST be last */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeContext.ThemeProvider>
          <DialogProvider>
            <NotificationProvider>
              <RealTimeProvider>
                <CallProvider>
                  <AppContent />
                </CallProvider>
              </RealTimeProvider>
            </NotificationProvider>
          </DialogProvider>
        </ThemeContext.ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
