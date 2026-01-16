import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  connectMatchingSocket,
  disconnectMatchingSocket,
  joinMatching,
} from '../../ws/matchingSocket';
import { getToken } from '../../api/client';

/**
 * MatchingScreen - Shows matching progress and handles WebSocket events
 * 
 * Features:
 * - Connection timeout (30 seconds)
 * - Error state handling
 * - Cancel functionality
 */
const MatchingScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const intent = location.state?.intent;
  const token = getToken();

  const [status, setStatus] = useState('CONNECTING');
  const [error, setError] = useState(null);

  const connectedRef = useRef(false);
  const navigatedToSessionRef = useRef(false);
  const timeoutRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    // Prevent double mount in strict mode
    if (mountedRef.current) return;
    mountedRef.current = true;

    if (!intent || !token) {
      navigate('/exchanges');
      return;
    }

    if (connectedRef.current) return;

    // Set connection timeout (30 seconds)
    timeoutRef.current = setTimeout(() => {
      if (!connectedRef.current) {
        setStatus('ERROR');
        setError('Connection timed out. Please try again.');
        disconnectMatchingSocket();
      }
    }, 30000);

    connectMatchingSocket(
      token,
      (event) => {
        console.log('MATCH EVENT:', event);

        if (event.type === 'MATCH_FOUND') {
          navigatedToSessionRef.current = true;
          clearTimeout(timeoutRef.current);
          disconnectMatchingSocket();
          // Navigate to /exchanges - CallOverlay will open automatically from the auto-initiated call
          navigate('/exchanges', {
            state: {
              matchFound: true,
              partnerId: event.partnerId,
              partnerName: event.partnerName,
              sessionId: event.sessionId
            }
          });
        }

        if (event.type === 'WAITING') {
          setStatus('WAITING');
        }
      },
      () => {
        connectedRef.current = true;
        clearTimeout(timeoutRef.current);
        setStatus('SEARCHING');
        joinMatching(intent);
      },
      (err) => {
        connectedRef.current = false;
        setStatus('ERROR');
        setError(err || 'Connection failed. Please try again.');
      }
    );

    return () => {
      clearTimeout(timeoutRef.current);
      if (!navigatedToSessionRef.current) {
        disconnectMatchingSocket();
      }
      connectedRef.current = false;
      mountedRef.current = false;
    };
  }, [intent, token, navigate]); // Removed status from dependencies

  const handleCancel = () => {
    clearTimeout(timeoutRef.current);
    disconnectMatchingSocket();
    navigate('/exchanges');
  };

  const handleRetry = () => {
    setStatus('CONNECTING');
    setError(null);
    connectedRef.current = false;
    mountedRef.current = false;

    // Force re-mount by navigating
    navigate('/exchanges/intent', { replace: true });
  };

  if (status === 'ERROR') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <div className="text-5xl">⚠️</div>
        <p className="text-lg text-red-600 dark:text-red-500 font-medium transition-colors">{error}</p>
        <div className="flex gap-4">
          <button
            onClick={handleRetry}
            className="px-6 py-2 bg-gray-900 dark:bg-black text-white rounded-lg hover:bg-gray-800 transition shadow-lg"
          >
            Retry
          </button>
          <button
            onClick={handleCancel}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-24 text-center">
      <div className="h-16 w-16 rounded-full border-4 border-gray-200 dark:border-slate-800 border-t-blue-500 dark:border-t-blue-500 animate-spin" />

      {status === 'CONNECTING' && (
        <p className="text-lg text-gray-500 dark:text-slate-300 transition-colors">
          Connecting to matching service…
        </p>
      )}

      {status === 'SEARCHING' && (
        <p className="text-lg text-gray-500 dark:text-slate-300 transition-colors">
          Looking for someone to match your skills…
        </p>
      )}

      {status === 'WAITING' && (
        <p className="text-lg font-medium text-gray-900 dark:text-white transition-colors">
          You are in the queue. Waiting for a partner…
        </p>
      )}

      <button
        onClick={handleCancel}
        className="text-sm text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
      >
        Cancel exchange
      </button>
    </div>
  );
};

export default MatchingScreen;
