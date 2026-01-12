import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toast } from '../ui/Toast';

const ExchangesDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Check if navigated here after session ended
    if (location.state?.sessionEnded) {
      // Only show notification if the OTHER user ended the session, not us
      if (!location.state.isEndedByMe) {
        const endedByName = location.state.endedByUserName;
        setNotification({
          message: endedByName
            ? `${endedByName} ended the exchange`
            : 'The other user ended the exchange',
          type: 'info'
        });
      }

      // Clear the state so it doesn't show again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 sm:gap-8 py-8 sm:py-16 px-4">

      {/* Toast Notification */}
      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Header */}
      <div className="text-center max-w-xl">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
          Skill Exchanges
        </h1>
        <p className="mt-3 sm:mt-4 text-gray-600 text-base sm:text-lg">
          Get instantly matched with someone to learn or teach — anonymously and in real time.
        </p>
      </div>

      {/* Primary CTA - Full width on mobile */}
      <div className="w-full sm:w-auto mt-4 sm:mt-6">
        <button
          onClick={() => navigate('intent')}
          className="w-full sm:w-auto px-8 py-4 sm:py-3 text-lg rounded-xl bg-black text-white hover:bg-gray-900 active:bg-gray-800 transition font-medium"
        >
          Start Exchange
        </button>
      </div>

      {/* Secondary Info Grid */}
      <div className="mt-6 sm:mt-10 grid grid-cols-3 gap-2 sm:gap-6 w-full max-w-3xl">

        <div className="rounded-xl border bg-white p-3 sm:p-5 text-center">
          <p className="text-xs sm:text-sm text-gray-500">Your Skills</p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-semibold text-gray-900">—</p>
        </div>

        <div className="rounded-xl border bg-white p-3 sm:p-5 text-center">
          <p className="text-xs sm:text-sm text-gray-500">Friends Online</p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-semibold text-gray-900">—</p>
        </div>

        <div className="rounded-xl border bg-white p-3 sm:p-5 text-center">
          <p className="text-xs sm:text-sm text-gray-500">Last Exchange</p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-semibold text-gray-900">—</p>
        </div>

      </div>
    </div>
  );
};

export default ExchangesDashboard;

