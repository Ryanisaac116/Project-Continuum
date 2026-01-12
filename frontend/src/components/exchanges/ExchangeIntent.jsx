import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../layout/PageContainer';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

const ExchangeIntent = () => {
  const navigate = useNavigate();
  const [intent, setIntent] = useState('AUDIO_CALL');

  const handleContinue = () => {
    navigate('/exchanges/matching', {
      state: { intent },
    });
  };

  return (
    <PageContainer>
      <div className="max-w-xl mx-auto space-y-6">

        <h1 className="text-2xl font-bold text-gray-900">
          Choose Exchange Type
        </h1>

        {/* AUDIO CALL (ONLY OPTION FOR NOW) */}
        <Card
          className={`cursor-pointer border ${
            intent === 'AUDIO_CALL'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200'
          }`}
          onClick={() => setIntent('AUDIO_CALL')}
        >
          <div className="p-4">
            <h2 className="text-lg font-semibold">🎧 Audio Call</h2>
            <p className="text-sm text-gray-600">
              Talk live with someone to learn or teach.
            </p>
            <p className="mt-2 text-xs text-gray-500">
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
    </PageContainer>
  );
};

export default ExchangeIntent;
