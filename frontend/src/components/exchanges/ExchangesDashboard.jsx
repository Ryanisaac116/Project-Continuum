import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toast } from '../ui/Toast';
import { useAuth } from '../../auth/AuthContext';
import { exchangeApi } from '../../api/exchange';
import { addListener } from '../../ws/chatSocket'; // Import listener

/**
 * ExchangesDashboard - User's Exchange Dashboard
 * 
 * Shows:
 * - My Sessions: User's completed exchanges
 * - Currently Active: User's active session (if any)
 * - Users Online: Platform-wide online count
 */
const ExchangesDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [notification, setNotification] = useState(null);
  const [stats, setStats] = useState({
    myCompleted: 0,
    activeExchanges: 0,
    onlineUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  // Determine exchange state from presence
  const getExchangeState = () => {
    const status = user?.presenceStatus;
    if (status === 'OFFLINE') return { state: 'offline', label: 'Offline', color: 'bg-gray-400', canStart: false };
    if (status === 'IN_SESSION') return { state: 'in_session', label: 'In Session', color: 'bg-blue-500', canStart: false };
    if (status === 'BUSY') return { state: 'busy', label: 'Busy', color: 'bg-yellow-500', canStart: false };
    return { state: 'available', label: 'Available', color: 'bg-green-500', canStart: true };
  };

  const exchangeState = getExchangeState();

  const fetchStats = async () => {
    try {
      const res = await exchangeApi.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch exchange stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats on mount and setup listeners
  useEffect(() => {
    fetchStats();

    // Real-time listener: Refresh when a match is found OR session changes
    const matchUnsub = addListener('match', (data) => {
      console.log('ExchangesDashboard: Match event received, refreshing stats...');
      if (data.type === 'MATCH_FOUND') {
        fetchStats();
      }
    });

    const sessionUnsub = addListener('session', (data) => {
      console.log('ExchangesDashboard: Session event received, refreshing stats...', data);
      if (data.type === 'SESSION_STARTED' || data.type === 'SESSION_ENDED') {
        fetchStats();
      }
    });

    // One-shot refresh when user returns to tab/window.
    const syncIfVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchStats();
      }
    };
    window.addEventListener('focus', syncIfVisible);
    document.addEventListener('visibilitychange', syncIfVisible);

    return () => {
      matchUnsub();
      sessionUnsub();
      window.removeEventListener('focus', syncIfVisible);
      document.removeEventListener('visibilitychange', syncIfVisible);
    };
  }, []);

  // Handle session ended notification from navigation state
  useEffect(() => {
    if (location.state?.sessionEnded) {
      const msg = location.state.isEndedByMe
        ? 'You ended the exchange'
        : `${location.state.endedByUserName || 'Partner'} ended the exchange`;
      setNotification({ type: 'info', message: msg });

      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleStartExchange = () => {
    if (exchangeState.canStart) {
      navigate('/exchanges/intent');
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <Toast
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Header with Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">My Exchanges</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${exchangeState.color}`} />
            <span className="text-sm text-gray-500 dark:text-slate-400 transition-colors">{exchangeState.label}</span>
          </div>
        </div>
        <button
          onClick={handleStartExchange}
          disabled={!exchangeState.canStart}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${exchangeState.canStart
            ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            : 'bg-gray-100 dark:bg-gray-200 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
        >
          Start Exchange
        </button>
      </div>

      {/* Stats Cards - Clearly Labeled */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* My Sessions (Completed Exchanges) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center transition-colors">
              <span className="text-green-600 dark:text-green-500 text-lg transition-colors">✓</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
                {loading ? '—' : stats.myCompleted}
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-400 transition-colors">My Sessions</div>
              <div className="text-xs text-gray-400 dark:text-slate-500 transition-colors">Completed exchanges</div>
            </div>
          </div>
        </div>

        {/* Active Exchanges (Platform-wide) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center transition-colors">
              <span className="text-blue-600 dark:text-blue-500 text-lg transition-colors">⚡</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
                {loading ? '—' : stats.activeExchanges}
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-400 transition-colors">Active Exchanges</div>
              <div className="text-xs text-gray-400 dark:text-slate-500 transition-colors">Platform-wide</div>
            </div>
          </div>
        </div>

        {/* Users Online (Platform-wide) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center transition-colors">
              <span className="text-purple-600 dark:text-purple-500 text-lg transition-colors">👥</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
                {loading ? '—' : stats.onlineUsers}
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-400 transition-colors">Users Online</div>
              <div className="text-xs text-gray-400 dark:text-slate-500 transition-colors">Available to exchange</div>
            </div>
          </div>
        </div>

      </div>

      {/* Status Message */}
      {!exchangeState.canStart && (
        <div className="bg-amber-900/20 border border-amber-900/50 rounded-lg p-4 text-center text-sm text-amber-200">
          {exchangeState.state === 'in_session' && 'You are currently in an active exchange session.'}
          {exchangeState.state === 'busy' && 'You are currently busy. Complete your current activity to start a new exchange.'}
          {exchangeState.state === 'offline' && 'You appear to be offline. Connect to start an exchange.'}
        </div>
      )}

      {/* Quick Tips */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 text-sm text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-800 transition-colors">
        <div className="font-medium text-gray-900 dark:text-slate-200 mb-2 transition-colors">How it works</div>
        <ul className="space-y-1 list-disc list-inside">
          <li>Click "Start Exchange" to find a partner</li>
          <li>Connect via voice call to collaborate</li>
          <li>Share your screen during calls if needed</li>
        </ul>
      </div>
    </div>
  );
};

export default ExchangesDashboard;
