import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

/**
 * ExchangeIntent - Choose exchange type (Audio Call for now)
 * Note: Already wrapped by PageContainer in ExchangesPage
 */
const ExchangeIntent = () => {
  const navigate = useNavigate();
  const [intent, setIntent] = useState('AUDIO_CALL');

  const handleContinue = () => {
    navigate('/exchanges/matching', {
      state: { intent },
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
        Choose Exchange Type
      </h1>

      {/* AUDIO CALL (ONLY OPTION FOR NOW) */}
      <Card
        className={`cursor-pointer border transition-colors ${intent === 'AUDIO_CALL'
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700'
          }`}
        onClick={() => setIntent('AUDIO_CALL')}
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors">🎧 Audio Call</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 transition-colors">
            Talk live with someone to learn or teach.
          </p>
          <p className="mt-2 text-xs text-gray-400 dark:text-slate-500 transition-colors">
            Video coming soon
          </p>
        </div>
      </Card>

      <Button
        onClick={handleContinue}
        className="w-full"
      >
        Continue
      </Button>
    </div>
  );
};

export default ExchangeIntent;
