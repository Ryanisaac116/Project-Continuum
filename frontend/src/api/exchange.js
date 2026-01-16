import apiClient from './client';

export const exchangeApi = {
  joinQueue: (intent) =>
    apiClient.post('/matching/join', { intent }),

  leaveQueue: () =>
    apiClient.post('/matching/leave'),

  getStatus: () =>
    apiClient.get('/matching/status'),

  // Dashboard metrics
  getStats: () =>
    apiClient.get('/exchange-stats'),

  // Session details
  getSession: (sessionId) =>
    apiClient.get(`/sessions/${sessionId}`),

  // End session
  endSession: (sessionId) =>
    apiClient.post(`/sessions/${sessionId}/end`),

  // Start call within exchange session
  startExchangeCall: (receiverId, exchangeSessionId) =>
    apiClient.post('/calls/exchange/initiate', { receiverId, exchangeSessionId }),
};
