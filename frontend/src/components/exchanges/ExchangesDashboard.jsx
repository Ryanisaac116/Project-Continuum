import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Toast } from '../ui/Toast';
import { Button } from "@/components/ui/button"
import { useAuth } from '../../auth/AuthContext';
import { exchangeApi } from '../../api/exchange';
import useLiveRefresh from '../../hooks/useLiveRefresh';
import { CheckCircle, Zap, Users, AlertCircle, Info } from 'lucide-react';

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
    if (status === 'OFFLINE') return { state: 'offline', label: 'Offline', color: 'bg-slate-400', canStart: false };
    if (status === 'IN_SESSION') return { state: 'in_session', label: 'In Session', color: 'bg-blue-500', canStart: false };
    if (status === 'BUSY') return { state: 'busy', label: 'Busy', color: 'bg-amber-500', canStart: false };
    return { state: 'available', label: 'Available', color: 'bg-emerald-500', canStart: true };
  };

  const exchangeState = getExchangeState();

  const fetchStats = useCallback(async () => {
    try {
      const res = await exchangeApi.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch exchange stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useLiveRefresh({
    refresh: fetchStats,
    events: ['all', 'session', 'match', 'connection'],
    runOnMount: false,
    minIntervalMs: 1500,
    pollIntervalMs: 10000,
  });

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
    <div className="space-y-8 animate-fade-in-up">
      {/* Notification */}
      {notification && (
        <Toast
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Header with Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
            My Exchanges
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2.5 h-2.5 rounded-full shadow-lg shadow-current/50 ${exchangeState.color}`} />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{exchangeState.label}</span>
          </div>
        </div>

        <Button
          onClick={handleStartExchange}
          disabled={!exchangeState.canStart}
          className={`h-12 px-8 rounded-full font-semibold shadow-lg transition-all duration-300 ${exchangeState.canStart
            ? 'bg-gradient-brand hover:shadow-indigo-500/25 hover:scale-105 active:scale-95 text-white border-0'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
            }`}
        >
          <Zap className={`w-4 h-4 mr-2 ${exchangeState.canStart ? 'fill-current' : ''}`} />
          Start Exchange
        </Button>
      </div>

      {/* Stats Cards - Clearly Labeled */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

        {/* My Sessions (Completed Exchanges) */}
        <div className="glass-card rounded-2xl p-6 relative group overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
            <CheckCircle className="w-24 h-24 text-emerald-500" />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-0.5">
                {loading ? '—' : stats.myCompleted}
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-300">My Sessions</div>
              <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">Completed exchanges</div>
            </div>
          </div>
        </div>

        {/* Active Exchanges (Platform-wide) */}
        <div className="glass-card rounded-2xl p-6 relative group overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
            <Zap className="w-24 h-24 text-blue-500" />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-0.5">
                {loading ? '—' : stats.activeExchanges}
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-300">Active Exchanges</div>
              <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">Platform-wide</div>
            </div>
          </div>
        </div>

        {/* Users Online (Platform-wide) */}
        <div className="glass-card rounded-2xl p-6 relative group overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
            <Users className="w-24 h-24 text-violet-500" />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-0.5">
                {loading ? '—' : stats.onlineUsers}
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-300">Users Online</div>
              <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">Available to exchange</div>
            </div>
          </div>
        </div>

      </div>

      {/* Status Message */}
      {!exchangeState.canStart && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex items-center justify-center gap-3 text-sm text-amber-800 dark:text-amber-200 shadow-sm animate-fade-in-up">
          <AlertCircle className="w-5 h-5" />
          <span>
            {exchangeState.state === 'in_session' && 'You are currently in an active exchange session.'}
            {exchangeState.state === 'busy' && 'You are currently busy. Complete your current activity to start a new exchange.'}
            {exchangeState.state === 'offline' && 'You appear to be offline. Connect to start an exchange.'}
          </span>
        </div>
      )}

      {/* Quick Tips */}
      <div className="glass-panel rounded-2xl p-6 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-200 mb-3 text-base">
          <Info className="w-5 h-5 text-indigo-500" />
          How it works
        </div>
        <ul className="space-y-2 list-none pl-1">
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
            <span>Click <strong>Start Exchange</strong> to find a partner with matching skills.</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
            <span>Connect via high-quality voice call to collaborate in real-time.</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
            <span>Share your screen directly within the call to work together effectively.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ExchangesDashboard;
