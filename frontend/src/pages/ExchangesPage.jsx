import { Routes, Route } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';

// Exchanges flow pages
import ExchangesDashboard from '../components/exchanges/ExchangesDashboard';
import ExchangeIntent from '../components/exchanges/ExchangeIntent';
import MatchingScreen from '../components/exchanges/MatchingScreen';
import ExchangeSession from '../components/exchanges/ExchangeSession';

const ExchangesPage = () => {
  return (
    <PageContainer>
      <Routes>
        {/* 1️⃣ Exchanges Home / Dashboard */}
        <Route index element={<ExchangesDashboard />} />

        {/* 2️⃣ Intent Selection */}
        <Route path="intent" element={<ExchangeIntent />} />

        {/* 3️⃣ Matching / Waiting */}
        <Route path="matching" element={<MatchingScreen />} />

        {/* 4️⃣ Active Exchange Session */}
        <Route path="session/:sessionId" element={<ExchangeSession />} />
      </Routes>
    </PageContainer>
  );
};

export default ExchangesPage;
