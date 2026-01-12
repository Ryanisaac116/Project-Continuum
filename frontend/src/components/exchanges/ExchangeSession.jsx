import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { PageContainer } from '../layout/PageContainer';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { connectMatchingSocket, disconnectMatchingSocket } from '../../ws/matchingSocket';

const ExchangeSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    // Listen for session end events
    connectMatchingSocket(
      token,
      (event) => {
        if (event.type === 'SESSION_ENDED') {
          console.log('Session ended by:', event.endedByUserName);

          // Get current user ID to determine if WE ended or the OTHER user ended
          const currentUserId = localStorage.getItem('userId');
          const isEndedByMe = currentUserId && event.endedByUserId?.toString() === currentUserId;

          disconnectMatchingSocket();
          navigate('/exchanges', {
            state: {
              sessionEnded: true,
              endedByUserId: event.endedByUserId,
              endedByUserName: event.endedByUserName,
              isEndedByMe: isEndedByMe
            }
          });
        }
      },
      null,  // onConnected - not needed here
      null   // onError - not needed here
    );

    // Cleanup on unmount (e.g., user navigates away manually)
    return () => {
      disconnectMatchingSocket();
    };
  }, [navigate]);

  const handleEndExchange = async () => {
    try {
      await axios.post(`/sessions/${sessionId}/end`);
    } catch (e) {
      console.error(e);
    }
  };

  if (!sessionId) {
    return <div className="text-center py-20">Invalid session</div>;
  }

  return (
    <PageContainer>
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Exchange Connected</h1>

        <Card>
          <div className="p-6 text-center space-y-2">
            <div className="text-green-600 font-semibold">● Connected</div>
            <p className="text-xs text-gray-400">
              Session ID: <span className="font-mono">{sessionId}</span>
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6 text-center text-gray-500">
            Audio / Video call UI will appear here
          </div>
        </Card>

        <Button variant="danger" className="w-full" onClick={handleEndExchange}>
          End Exchange
        </Button>
      </div>
    </PageContainer>
  );
};

export default ExchangeSession;
