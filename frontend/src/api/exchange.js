import apiClient from './client';

export const exchangeApi = {
  joinQueue: (intent) =>
    apiClient.post('/matching/join', { intent }),

  leaveQueue: () =>
    apiClient.post('/matching/leave'),

  getStatus: () =>
    apiClient.get('/matching/status'),
};
