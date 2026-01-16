import { Routes, Route } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';

// Exchanges flow pages
import ExchangesDashboard from '../components/exchanges/ExchangesDashboard';
import ExchangeIntent from '../components/exchanges/ExchangeIntent';
import MatchingScreen from '../components/exchanges/MatchingScreen';

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

        {/* Call starts automatically after match - no session page needed */}
      </Routes>
    </PageContainer>
  );
};

export default ExchangesPage;

