import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  connectMatchingSocket,
  disconnectMatchingSocket,
  joinMatching,
} from '../../ws/matchingSocket';
import { Button } from '../ui/Button';

const MatchingScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const intent = location.state?.intent;
  const token = localStorage.getItem('token');

  const [status, setStatus] = useState('SEARCHING');
  // SEARCHING | WAITING

  const connectedRef = useRef(false);
  const navigatedToSessionRef = useRef(false);

  useEffect(() => {
    if (!intent || !token) {
      navigate('/exchanges');
      return;
    }

    if (connectedRef.current) return;

    connectMatchingSocket(
      token,
      (event) => {
        console.log('MATCH EVENT:', event);

        if (event.type === 'MATCH_FOUND') {
          navigatedToSessionRef.current = true;
          navigate(`/exchanges/session/${event.sessionId}`);
        }

        if (event.type === 'WAITING') {
          setStatus('WAITING');
        }
      },
      () => {
        connectedRef.current = true;
        joinMatching(intent);
      },
      () => {
        connectedRef.current = false;
      }
    );

    return () => {
      // Only disconnect if NOT navigating to session
      if (!navigatedToSessionRef.current) {
        disconnectMatchingSocket();
      }
      connectedRef.current = false;
    };
  }, [intent, token, navigate]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-24 text-center">
      <div className="h-16 w-16 rounded-full border-4 border-gray-200 border-t-black animate-spin" />

      {status === 'SEARCHING' && (
        <p className="text-lg text-gray-700">
          Looking for someone to match your skills…
        </p>
      )}

      {status === 'WAITING' && (
        <p className="text-lg font-medium text-gray-800">
          You are in the queue. Waiting for a partner…
        </p>
      )}

      <button
        onClick={() => {
          disconnectMatchingSocket();
          navigate('/exchanges');
        }}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        Cancel exchange
      </button>
    </div>
  );
};

export default MatchingScreen;
